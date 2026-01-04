using System;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using OnDemandApp.Api.Hubs;
using OnDemandApp.Core.Entities;
using OnDemandApp.Infrastructure.Data;

namespace OnDemandApp.Api.Controllers
{
    [ApiController]
    [Route("api")]
    [Authorize] 
    public class LocationController : ControllerBase
    {
        private readonly AppDbContext _db;
        private readonly IHubContext<NotificationHub> _hubContext;

        public LocationController(AppDbContext db, IHubContext<NotificationHub> hubContext)
        {
            _db = db;
            _hubContext = hubContext;
        }

        private Guid GetUserId() => Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? Guid.Empty.ToString());

      
        [HttpGet("jobs/{jobId:guid}/pings")]
        public async Task<IActionResult> Pings(Guid jobId)
        {
            var list = await _db.LocationPings.AsNoTracking()
                .Where(p => p.JobId == jobId)
                .OrderByDescending(p => p.CreatedAt)
                .Take(1) 
                .Select(p => new LocationPingDto(p.Id, p.JobId, p.Lat, p.Lng, p.AccuracyM, p.CreatedAt))
                .ToListAsync();

            return Ok(list);
        }

 

        [HttpPost("jobs/{jobId:guid}/pings")]
        public async Task<IActionResult> Create(Guid jobId, [FromBody] CreatePingRequest body)
        {
            var userId = GetUserId();

         
            var job = await _db.Jobs.Include(j => j.Provider).FirstOrDefaultAsync(j => j.Id == jobId);
            if (job == null) return NotFound("Job introuvable");

        
            var ping = new LocationPing
            {
                Id = Guid.NewGuid(),
                JobId = jobId,
                UserId = userId,
                ProviderId = job.ProviderId ?? userId,
                Lat = body.Lat,
                Lng = body.Lng,
                AccuracyM = body.AccuracyM,
                CreatedAt = DateTime.UtcNow
            };
            _db.LocationPings.Add(ping);

      
            job.CurrentLat = body.Lat;
            job.CurrentLng = body.Lng;

           
            if (userId == job.ProviderId)
            {
                var profile = await _db.ProviderProfiles.FirstOrDefaultAsync(p => p.UserId == userId);
                if (profile != null)
                {
                    profile.LastLat = body.Lat;
                    profile.LastLng = body.Lng;
               
                    profile.IsAvailable = true;
                }
            }
           

            await _db.SaveChangesAsync();

        
            var targetUserId = (userId == job.ProviderId) ? job.ClientId : job.ProviderId;
            if (targetUserId.HasValue)
            {
                await _hubContext.Clients.User(targetUserId.Value.ToString()).SendAsync("ReceiveLocation", new
                {
                    jobId = jobId,
                    lat = body.Lat,
                    lng = body.Lng
                });
            }

            return Ok();
        }
    }

    public record LocationPingDto(Guid Id, Guid JobId, decimal Lat, decimal Lng, decimal? AccuracyM, DateTime CreatedAt);

    public class CreatePingRequest
    {
        public decimal Lat { get; set; }
        public decimal Lng { get; set; }
        public decimal? AccuracyM { get; set; }
    }
}