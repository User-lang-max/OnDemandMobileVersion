using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using OnDemandApp.Api.Hubs;
using OnDemandApp.Core.Entities;
using OnDemandApp.Infrastructure.Data;

namespace OnDemandApp.Api.Services
{
    public class JobMatchingService : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<JobMatchingService> _logger;
        private readonly IHubContext<NotificationHub> _hubContext;

        public JobMatchingService(
            IServiceProvider serviceProvider,
            ILogger<JobMatchingService> logger,
            IHubContext<NotificationHub> hubContext)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
            _hubContext = hubContext;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("Job Matching Service (Real-Time) démarré.");

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    await MatchJobsAsync();
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Erreur durant le cycle de matching.");
                }

                await Task.Delay(TimeSpan.FromSeconds(10), stoppingToken);
            }
        }

        private async Task MatchJobsAsync()
        {
            using var scope = _serviceProvider.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        
            var pendingJobs = await db.Jobs
                .Include(j => j.Service)
                .Where(j => j.Status == JobStatus.Pending && j.Lat.HasValue && j.Lng.HasValue)
                .ToListAsync();

            if (!pendingJobs.Any()) return;

            foreach (var job in pendingJobs)
            {
                var candidates = await db.ProviderProfiles
                    .AsNoTracking()
                    .Where(p => p.IsAvailable)
                    .Include(p => p.Services)
                    .Include(p => p.User)
                    .Select(p => new
                    {
                        Profile = p,
                        OffersService = p.Services.Any(s => s.ServiceItem.Name == job.Service.Title),
                        LastPing = db.LocationPings
                            .Where(lp => lp.ProviderId == p.UserId)
                            .OrderByDescending(lp => lp.CreatedAt)
                            .FirstOrDefault()
                    })
                    .ToListAsync();

                var bestMatch = candidates
                    .Where(c => c.OffersService && c.LastPing != null)
                    .Select(c => new
                    {
                        c.Profile,
                        Distance = CalculateDistance(job.Lat!.Value, job.Lng!.Value, c.LastPing!.Lat, c.LastPing!.Lng)
                    })
                    .Where(x => x.Distance <= x.Profile.RayonKm)
                    .OrderBy(x => x.Distance)
                    .FirstOrDefault();

                if (bestMatch != null)
                {
                    job.ProviderId = bestMatch.Profile.UserId;

                    
                    job.Status = JobStatus.Assigned;

                    job.DistanceKm = bestMatch.Distance;
                    job.UpdatedAt = DateTime.UtcNow; 

                    _logger.LogInformation($"Job {job.Id} assigné à {bestMatch.Profile.UserId}");

                  
                    if (_hubContext != null)
                    {
                        await _hubContext.Clients.User(bestMatch.Profile.UserId.ToString())
                            .SendAsync("JobAssigned", new
                            {
                                jobId = job.Id,
                                price = job.Price,
                                address = job.Address,
                                distance = bestMatch.Distance
                            });
                    }
                }
            }

            await db.SaveChangesAsync();
        }

        private decimal CalculateDistance(decimal lat1, decimal lon1, decimal lat2, decimal lon2)
        {
            double rlat1 = Math.PI * (double)lat1 / 180;
            double rlat2 = Math.PI * (double)lat2 / 180;
            double theta = (double)lon1 - (double)lon2;
            double rtheta = Math.PI * theta / 180;
            double dist = Math.Sin(rlat1) * Math.Sin(rlat2) + Math.Cos(rlat1) * Math.Cos(rlat2) * Math.Cos(rtheta);
            dist = Math.Acos(dist);
            dist = dist * 180 / Math.PI;
            dist = dist * 60 * 1.1515;
            return (decimal)(dist * 1.609344);
        }
    }
}