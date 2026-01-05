using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OnDemandApp.Core.Entities;
using OnDemandApp.Infrastructure.Data;
using OnDemandApp.Api.Services;
using OnDemandApp.Api.DTOs;
using OnDemandApp.Infrastructure.Interfaces;

namespace OnDemandApp.Api.Controllers
{
    [ApiController]
    [Route("api/provider")]
    [Authorize]
    public class ProviderController : ControllerBase
    {
        private readonly AppDbContext _db;
        private readonly FirebaseNotificationService _notifService;
        private readonly IFileService _fileService;

        public ProviderController(AppDbContext db, FirebaseNotificationService notifService, IFileService fileService)
        {
            _db = db;
            _notifService = notifService;
            _fileService = fileService;
        }

        private Guid GetUserId()
        {
            var claim = User.FindFirst(ClaimTypes.NameIdentifier)
                        ?? User.FindFirst("sub")
                        ?? User.FindFirst("id");

            if (claim == null)
                throw new UnauthorizedAccessException("ID utilisateur introuvable dans le token.");

            return Guid.Parse(claim.Value);
        }

        private async Task<ProviderProfile> GetOrCreate(Guid userId)
        {
            var p = await _db.ProviderProfiles
                .Include(x => x.User)
                .FirstOrDefaultAsync(x => x.UserId == userId);

            if (p != null) return p;

            p = new ProviderProfile
            {
                UserId = userId,
                RayonKm = 10,
                TarifKm = 5,
                CreatedAt = DateTime.UtcNow,
                IsAvailable = false
            };

            _db.ProviderProfiles.Add(p);
            await _db.SaveChangesAsync();
            return p;
        }

        // --- 1. DASHBOARD & PROFIL ---
        [HttpGet("me")]
        public async Task<IActionResult> Me()
        {
            var id = GetUserId();
            var p = await GetOrCreate(id);
            var startOfMonth = new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1);

            var stats = await _db.Jobs
                .Where(j => j.ProviderId == id && j.Status == JobStatus.Completed && j.CreatedAt >= startOfMonth)
                .GroupBy(j => 1)
                .Select(g => new {
                    Revenue = g.Sum(x => x.Price ?? 0),
                    Count = g.Count()
                })
                .FirstOrDefaultAsync();

            var rating = p.User.Rating > 0 ? p.User.Rating : 5.0m;

            return Ok(new
            {
                ProviderName = p.User?.FullName ?? "Prestataire",
                p.IsAvailable,
                p.RayonKm,
                CaMoisCourant = stats?.Revenue ?? 0,
                CompletedJobsMonth = stats?.Count ?? 0,
                Rating = rating,
                AcceptanceRate = 95,
                ObjectifMensuelCA = p.ObjectifMensuelCA > 0 ? p.ObjectifMensuelCA : 5000
            });
        }

        // --- 2. ACTIONS JOBS (ARRIVÉE) ---
        [HttpPost("jobs/{jobId}/arrive")]
        public async Task<IActionResult> ProviderArrived(Guid jobId)
        {
            // MODIFICATION: On cherche le job UNIQUEMENT par son ID
            // On ne vérifie pas le ProviderId ici pour éviter l'erreur de type
            var job = await _db.Jobs
                .Include(j => j.Client)
                .FirstOrDefaultAsync(j => j.Id == jobId);

            if (job == null) return NotFound("Job introuvable.");

            // LOGIQUE DE NOTIFICATION
            if (job.Client != null)
            {
                try
                {
                    await _notifService.SendToUserAsync(
                        job.ClientId,
                        "Le prestataire est là ! 📍",
                        $"Votre prestataire est arrivé à l'adresse."
                    );
                }
                catch (Exception ex)
                {
                    Console.WriteLine("Erreur notif: " + ex.Message);
                }
            }

            return Ok(new { message = "Client notifié." });
        }

        [HttpPut("availability")]
        public async Task<IActionResult> SetAvailability([FromBody] AvailabilityRequest req)
        {
            var id = GetUserId();
            var p = await GetOrCreate(id);
            p.IsAvailable = req.IsAvailable;

            if (req.Lat.HasValue && req.Lng.HasValue)
            {
                p.LastLat = req.Lat.Value;
                p.LastLng = req.Lng.Value;
            }

            await _db.SaveChangesAsync();
            return Ok(new { p.IsAvailable });
        }

        // --- 2. GESTION DU PLANNING ---
        [HttpGet("schedule")]
        public async Task<IActionResult> GetSchedule()
        {
            var id = GetUserId();
            var p = await GetOrCreate(id);
            return Ok(p.ScheduleJson ?? "[]");
        }

        [HttpPost("schedule")]
        public async Task<IActionResult> UpdateSchedule([FromBody] object scheduleData)
        {
            var id = GetUserId();
            var p = await GetOrCreate(id);
            p.ScheduleJson = JsonSerializer.Serialize(scheduleData);
            await _db.SaveChangesAsync();
            return Ok();
        }


        [Authorize]
        [HttpPost("onboarding")]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> SubmitOnboarding(
     [FromForm] ProviderOnboardingDto dto
 )
        {
            var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

            var provider = await _db.ProviderProfiles
                .Include(p => p.Services)
                .FirstOrDefaultAsync(p => p.UserId == userId);

            if (provider == null)
                return NotFound("Profil prestataire introuvable");

            // --- Infos dossier ---
            provider.Bio = dto.Bio;
            provider.InterviewDate = dto.InterviewDate;
            provider.IsOnboardingCompleted = true;
            provider.UpdatedAt = DateTime.UtcNow;

            // --- FICHIERS ---
            if (dto.Cv != null)
                provider.CvUrl = await _fileService.SaveAsync(dto.Cv, "cvs");

            if (dto.Photo != null)
                provider.PhotoUrl = await _fileService.SaveAsync(dto.Photo, "photos");

            // --- SERVICES SÉLECTIONNÉS ---
            _db.ProviderServices.RemoveRange(provider.Services);

            var serviceIds = dto.Services
                .Split(',', StringSplitOptions.RemoveEmptyEntries)
                .Select(int.Parse)
                .ToList();

            foreach (var serviceItemId in serviceIds)
            {
                _db.ProviderServices.Add(new ProviderService
                {
                    ProviderProfileUserId = userId,
                    ServiceItemId = serviceItemId,
                    BasePrice = 100m,
                    IsActive = true
                });
            }

            await _db.SaveChangesAsync();

            return Ok(new
            {
                message = "Onboarding prestataire complété avec succès"
            });
        }


        // --- 4. SERVICES ---
        [HttpGet("services")]
        public async Task<IActionResult> GetMyServices()
        {
            var userId = GetUserId();
            var services = await _db.ProviderServices
                .Include(ps => ps.ServiceItem)
                .Where(ps => ps.ProviderProfile.UserId == userId && ps.IsActive)
                .Select(ps => new
                {
                    ItemId = ps.ServiceItemId,
                    Name = ps.ServiceItem.Name,
                    Icon = ps.ServiceItem.Icon,
                    BasePrice = ps.BasePrice,
                    IsActive = ps.IsActive
                })
                .ToListAsync();

            return Ok(services);
        }

        [HttpPost("services")]
        public async Task<IActionResult> ToggleService([FromBody] ToggleServiceRequest req)
        {
            var userId = GetUserId();
            var p = await GetOrCreate(userId);

            var existing = await _db.ProviderServices
                .FirstOrDefaultAsync(ps => ps.ProviderProfileUserId == userId && ps.ServiceItemId == req.ServiceItemId);

            if (existing == null)
            {
                _db.ProviderServices.Add(new ProviderService
                {
                    ProviderProfileUserId = userId,
                    ServiceItemId = req.ServiceItemId,
                    BasePrice = req.Price,
                    IsActive = req.IsActive
                });
            }
            else
            {
                existing.BasePrice = req.Price;
                existing.IsActive = req.IsActive;
            }

            await _db.SaveChangesAsync();
            return Ok();
        }

        // --- 5. JOBS ASSIGNÉS ---
        [HttpGet("jobs/assigned")]
        public async Task<IActionResult> GetAssignedJobs()
        {
            var userId = GetUserId();
            var jobs = await _db.Jobs
                .AsNoTracking()
                .Include(j => j.Client)
                .Where(j => j.ProviderId == userId
                         && (j.Status == JobStatus.Pending || j.Status == JobStatus.Assigned || j.Status == JobStatus.Confirmed || j.Status == JobStatus.InProgress))
                .OrderByDescending(j => j.CreatedAt)
                .Select(j => new
                {
                    j.Id,
                    Status = (int)j.Status,
                    j.Price,
                    j.Address,
                    j.DistanceKm,
                    j.CreatedAt,
                    ClientName = j.Client.FullName ?? "Client"
                })
                .ToListAsync();

            return Ok(jobs);
        }
    }

    // DTOs
    public class AvailabilityRequest { public bool IsAvailable { get; set; } public decimal? Lat { get; set; } public decimal? Lng { get; set; } }
    public class ToggleServiceRequest { public int ServiceItemId { get; set; } public decimal Price { get; set; } public bool IsActive { get; set; } }

    public class OnboardingRequest
    {
        public string Bio { get; set; }
        public string InterviewDate { get; set; } // Reçoit une string du front
        public string PhotoUrl { get; set; }
        public string CvUrl { get; set; }
        public List<int> SelectedServiceIds { get; set; }
    }
}
