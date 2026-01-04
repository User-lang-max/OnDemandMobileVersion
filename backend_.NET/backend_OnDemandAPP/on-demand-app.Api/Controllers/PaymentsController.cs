using System;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OnDemandApp.Core.Entities;
using OnDemandApp.Infrastructure.Data;

namespace OnDemandApp.Api.Controllers
{
    [ApiController]
    [Route("api/payments")]
    [Authorize]
    public class PaymentsController : ControllerBase
    {
        private readonly AppDbContext _db;

        public PaymentsController(AppDbContext db)
        {
            _db = db;
        }

        public record PaymentRequest(Guid JobId, string Method, string? TransactionId);

        [HttpPost("pay")]
        public async Task<IActionResult> ProcessPayment([FromBody] PaymentRequest req)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || string.IsNullOrEmpty(userIdClaim.Value))
            {
                return Unauthorized();
            }
            var userId = Guid.Parse(userIdClaim.Value);

            var job = await _db.Jobs.FirstOrDefaultAsync(j => j.Id == req.JobId);
            if (job == null) return NotFound("Mission introuvable.");
            if (job.ClientId != userId) return Unauthorized("Ce n'est pas votre mission.");

            if (job.Status != JobStatus.Assigned)
                return BadRequest("Statut incorrect pour le paiement (Le prestataire doit d'abord accepter).");

            if (!Enum.TryParse<PaymentMethod>(req.Method, true, out var methodEnum))
                return BadRequest("Méthode de paiement invalide.");

            var payment = new Payment
            {
                Id = Guid.NewGuid(),
                JobId = job.Id,
                Amount = job.Price ?? 0,
                Currency = "MAD",
                CreatedAt = DateTime.UtcNow,
                PSPProvider = methodEnum.ToString(),
                PSPPaymentId = req.TransactionId ?? $"MANUAL-{Guid.NewGuid().ToString().Substring(0, 8)}"
            };

            switch (methodEnum)
            {
                case PaymentMethod.Stripe:
                case PaymentMethod.PayPal:
                    payment.Status = PaymentStatus.captured;
                    job.Status = JobStatus.Confirmed; // 7
                    break;

                case PaymentMethod.Cash:
                    // --- CORRECTION : Statut passé à 'captured' pour valider immédiatement ---
                    payment.Status = PaymentStatus.captured;
                    job.Status = JobStatus.Confirmed; // 7
                    break;

                case PaymentMethod.BankTransfer:
                    // Vous pouvez laisser pending ici si vous voulez vérifier manuellement, 
                    // ou mettre captured si vous voulez valider tout de suite.
                    payment.Status = PaymentStatus.pending;
                    break;
            }

            _db.Payments.Add(payment);
            await _db.SaveChangesAsync();

            return Ok(new
            {
                message = "Paiement enregistré",
                status = payment.Status.ToString(),
                jobStatus = job.Status.ToString()
            });
        }

        [HttpGet("history")]
        public async Task<IActionResult> GetMyPayments()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || string.IsNullOrEmpty(userIdClaim.Value))
            {
                return Unauthorized();
            }
            var userId = Guid.Parse(userIdClaim.Value);

            var payments = await _db.Payments
                .Include(p => p.Job)
                .ThenInclude(j => j.Service)
                .Where(p => p.Job.ClientId == userId)
                .OrderByDescending(p => p.CreatedAt)
                .Select(p => new {
                    p.Id,
                    Amount = p.Amount,
                    Date = p.CreatedAt,
                    ServiceName = p.Job.Service != null ? p.Job.Service.Title : "Service",
                    Method = p.PSPProvider,
                    Status = p.Status.ToString()
                })
                .ToListAsync();

            return Ok(payments);
        }
    }
}