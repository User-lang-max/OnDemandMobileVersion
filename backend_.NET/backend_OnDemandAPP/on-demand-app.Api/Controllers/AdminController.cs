using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OnDemandApp.Api.Auth;
using OnDemandApp.Core.Entities;
using OnDemandApp.Infrastructure.Data;

namespace OnDemandApp.Api.Controllers
{
    [ApiController]
    [Route("api/admin")]
    [Authorize(Roles = "admin")]
    public class AdminController : ControllerBase
    {
        private readonly AppDbContext _db;
        private readonly IEmailService _mailer;

        public AdminController(AppDbContext db, IEmailService mailer)
        {
            _db = db;
            _mailer = mailer;
        }

        // --- DASHBOARD ---
        [HttpGet("overview")]
        public async Task<IActionResult> GetOverview()
        {
            var stats = new
            {
                users = await _db.Users.CountAsync(u => u.Role == UserRole.client),
                providers = await _db.Users.CountAsync(u => u.Role == UserRole.provider),
                jobs = await _db.Jobs.CountAsync(),
                // On somme les paiements validés
                payments = await _db.Payments.Where(p => p.Status == PaymentStatus.captured).SumAsync(p => p.Amount)
            };
            return Ok(stats);
        }

       
        [HttpGet("activity")]
        public async Task<IActionResult> GetRecentActivity()
        {
            // 1. Derniers utilisateurs
            var newUsers = await _db.Users
                .OrderByDescending(u => u.CreatedAt)
                .Take(5)
                .Select(u => new {
                    Type = "user",
                    Message = $"Nouvel utilisateur : {u.FullName}",
                    Date = u.CreatedAt
                })
                .ToListAsync();

            // 2. Dernières commandes
            var newJobs = await _db.Jobs
                .OrderByDescending(j => j.CreatedAt)
                .Take(5)
                .Select(j => new {
                    Type = "job",
                    Message = $"Nouvelle commande ({j.Price} MAD)",
                    Date = j.CreatedAt
                })
                .ToListAsync();

            // 3. Derniers paiements
            var newPayments = await _db.Payments
                .OrderByDescending(p => p.CreatedAt)
                .Take(5)
                .Select(p => new {
                    Type = "payment",
                    Message = $"Paiement reçu : {p.Amount} MAD",
                    Date = p.CreatedAt
                })
                .ToListAsync();

            // Fusion et tri par date
            var activity = newUsers
                .Concat(newJobs)
                .Concat(newPayments)
                .OrderByDescending(x => x.Date)
                .Take(10)
                .ToList();

            return Ok(activity);
        }

        // --- USERS ---
        [HttpGet("users")]
        public async Task<IActionResult> GetAllUsers()
        {
            var users = await _db.Users
                .AsNoTracking()
                .OrderByDescending(u => u.CreatedAt)
                .Select(u => new
                {
                    u.Id,
                    u.FullName,
                    u.Email,
                    Role = u.Role.ToString(),
                    Status = u.Status.ToString(),
                    u.CreatedAt
                })
                .ToListAsync();
            return Ok(users);
        }

        [HttpGet("pending-providers")]
        public async Task<IActionResult> GetPendingProviders()
        {
            var list = await _db.Users
                .Where(u => u.Role == UserRole.provider && u.Status == UserStatus.pending)
                .Include(u => u.ProviderProfile)
                .Select(u => new {
                    u.Id,
                    u.FullName,
                    u.Email,
                    u.EmailConfirmed,
                    RequestedZone = u.ProviderProfile != null ? u.ProviderProfile.Zones : "Non défini",
                    Bio = u.ProviderProfile != null ? u.ProviderProfile.Bio : null,
                    PhotoUrl = u.ProviderProfile != null ? u.ProviderProfile.PhotoUrl : null,
                    CvUrl = u.ProviderProfile != null ? u.ProviderProfile.CvUrl : null,
                    InterviewDate = u.ProviderProfile != null ? u.ProviderProfile.InterviewDate : null,
                    IsComplete = u.ProviderProfile != null && u.ProviderProfile.IsOnboardingCompleted,
                    u.CreatedAt
                })
                .OrderByDescending(x => x.CreatedAt)
                .ToListAsync();

            return Ok(list);
        }

        // DANS AdminController.cs

        // --- COMMISSIONS & REVENUS ---
        [HttpGet("commissions")]
        public async Task<IActionResult> GetCommissions([FromQuery] decimal rate = 0.15m) 
        {
          
            var commissions = await _db.Jobs
                .AsNoTracking()
                .Include(j => j.Provider)
                .Include(j => j.Service)
                .Where(j => j.Status == JobStatus.Completed && j.Price != null)
                .OrderByDescending(j => j.CreatedAt)
                .Select(j => new
                {
                    JobId = j.Id,
                    Date = j.CreatedAt,
                    Service = j.Service.Title,
                    Provider = j.Provider != null ? j.Provider.FullName : "Inconnu",
                    Client = j.Client.FullName,
                    totalPrice = j.Price,
                  
                    platformFee = Math.Round((decimal)j.Price * rate, 2),
                
                    providerNet = Math.Round((decimal)j.Price * (1 - rate), 2),
                    Status = "collected" 
                })
                .ToListAsync();

            return Ok(commissions);
        }
        // --- 3. CARTE EN TEMPS RÉEL ---
        [HttpGet("map/providers")]
        public async Task<IActionResult> GetProvidersOnMap()
        {
            
            var providers = await _db.ProviderProfiles
                .Include(p => p.User)
                .Include(p => p.Services).ThenInclude(ps => ps.ServiceItem)
                .Where(p => p.IsAvailable && p.LastLat != null && p.LastLng != null)
                .Select(p => new
                {
                    Id = p.UserId,
                    Name = p.User.FullName,
                    Service = p.Services.FirstOrDefault().ServiceItem.Name ?? "Prestataire",
                    Lat = p.LastLat,
                    Lng = p.LastLng,
         
                    HasActiveJob = _db.Jobs.Any(j => j.ProviderId == p.UserId && (j.Status == JobStatus.InProgress || j.Status == JobStatus.Confirmed))
                })
                .ToListAsync();

            return Ok(providers);
        }
        [HttpPost("validate-provider/{id}")]
        public async Task<IActionResult> ValidateProvider(Guid id)
        {
            var user = await _db.Users.Include(u => u.ProviderProfile).FirstOrDefaultAsync(u => u.Id == id);
            if (user == null) return NotFound("Introuvable");

            user.Status = UserStatus.active;
            if (user.ProviderProfile != null) user.ProviderProfile.IsAvailable = true;

            await _db.SaveChangesAsync();

        
            try
            {
                await _mailer.SendAsync(user.Email, "Compte validé", "<p>Votre compte a été validé !</p>");
            }
            catch { }

            return Ok(new { message = "Validé !" });
        }

        // --- JOBS (COMMANDES) ---
        [HttpGet("jobs")]
        public async Task<IActionResult> GetAllJobs()
        {
            var jobs = await _db.Jobs
                .AsNoTracking()
                .Include(j => j.Client)
                .Include(j => j.Provider)
                .Include(j => j.Service)
                .OrderByDescending(j => j.CreatedAt)
                .Select(j => new
                {
                    j.Id,
                    Client = new { Name = j.Client.FullName, Email = j.Client.Email },
                    Provider = j.Provider != null ? new { Name = j.Provider.FullName, Email = j.Provider.Email } : null,
                    Service = j.Service.Title,
                    Price = j.Price,
                    Address = j.Address,
                    Date = j.CreatedAt,
                    Status = j.Status.ToString().ToLower(),
                    Payment = _db.Payments.Any(p => p.JobId == j.Id && p.Status == PaymentStatus.captured) ? "paid" : "pending"
                })
                .ToListAsync();

            return Ok(jobs);
        }

        // --- SERVICES (STATS) ---
        [HttpGet("services-stats")]
        public async Task<IActionResult> GetServicesStats()
        {
            var services = await _db.ServiceItems
                .AsNoTracking()
                .Include(s => s.Category)
                .Select(s => new
                {
                    s.Id,
                    Name = s.Name,
                    Category = s.Category.Name,
                    Providers = s.ProviderServices.Count(ps => ps.IsActive),
                    AvgPrice = s.ProviderServices.Any() ? (decimal?)s.ProviderServices.Average(ps => ps.BasePrice) : 0,
                    Status = "active",
                    Rating = 4.5
                })
                .ToListAsync();

            return Ok(services);
        }
        [HttpPost("reject-provider/{id}")]
        public async Task<IActionResult> RejectProvider(Guid id)
        {
            
            var profile = await _db.ProviderProfiles.Include(p => p.User).FirstOrDefaultAsync(p => p.UserId == id); 

           
            if (profile == null)
            {
              
                profile = await _db.ProviderProfiles.Include(p => p.User).FirstOrDefaultAsync(p => p.UserId == id);
            }

            if (profile == null) return NotFound("Prestataire introuvable");

           

           
            _db.ProviderProfiles.Remove(profile);

           
            var user = await _db.Users.FindAsync(profile.UserId);
            if (user != null)
            {
                _db.Users.Remove(user);
            }

            await _db.SaveChangesAsync();
            return Ok(new { message = "Candidature rejetée et supprimée." });
        }

        // --- PAYMENTS ---
        [HttpGet("payments")]
        public async Task<IActionResult> GetAllPayments()
        {
            var payments = await _db.Payments
                .AsNoTracking()
                .Include(p => p.Job).ThenInclude(j => j.Client)
                .Include(p => p.Job).ThenInclude(j => j.Provider)
                .Include(p => p.Job).ThenInclude(j => j.Service)
                .OrderByDescending(p => p.CreatedAt)
                .Select(p => new
                {
                    Id = p.Id.ToString(),
                    Client = new { Name = p.Job.Client.FullName, Email = p.Job.Client.Email },
                    Provider = p.Job.Provider != null ? new { Name = p.Job.Provider.FullName } : null,
                    Service = p.Job.Service.Title,
                    Amount = p.Amount,
                    Date = p.CreatedAt,
                    Status = p.Status.ToString().ToLower(),
                    Method = p.PSPProvider.ToLower(),
                    TransactionId = p.PSPPaymentId
                })
                .ToListAsync();

            return Ok(payments);
        }
    }
}