using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OnDemandApp.Core.Entities;
using OnDemandApp.Infrastructure.Data;
using System;
using System.Security.Claims;
using System.Threading.Tasks;

namespace OnDemandApp.Api.Controllers
{
    [ApiController]
    [Route("api/notifications")]
    [Authorize] // Nécessite que l'user soit connecté
    public class NotificationController : ControllerBase
    {
        private readonly AppDbContext _db;

        public NotificationController(AppDbContext db)
        {
            _db = db;
        }

        [HttpPost("register")]
        public async Task<IActionResult> RegisterToken([FromBody] TokenRequest req)
        {
            // Récupère l'ID de l'utilisateur connecté depuis le token JWT
            var claim = User.FindFirst(ClaimTypes.NameIdentifier)
                        ?? User.FindFirst("sub")
                        ?? User.FindFirst("id");

            if (claim == null) return Unauthorized();

            var userId = Guid.Parse(claim.Value);

            // Vérifie si ce token existe déjà pour cet user
            var existingToken = await _db.NotificationTokens
                .FirstOrDefaultAsync(t => t.Token == req.Token && t.UserId == userId);

            if (existingToken == null)
            {
                _db.NotificationTokens.Add(new NotificationToken
                {
                    UserId = userId,
                    Token = req.Token,
                    DeviceType = "mobile", // ou détecté via User-Agent
                    CreatedAt = DateTime.UtcNow
                });
                await _db.SaveChangesAsync();
            }

            return Ok(new { message = "Token enregistré" });
        }
    }

    public class TokenRequest
    {
        public string Token { get; set; }
    }
}