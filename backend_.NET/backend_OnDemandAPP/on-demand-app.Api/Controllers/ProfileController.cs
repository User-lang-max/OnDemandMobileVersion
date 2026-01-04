using System;
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
    [Route("api")]
    [Authorize]
    public class ProfileController : ControllerBase
    {
        private readonly AppDbContext _db;

        public ProfileController(AppDbContext db)
        {
            _db = db;
        }

        private Guid? GetUserIdFromClaims()
        {
            var idClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                       ?? User.FindFirst("sub")?.Value
                       ?? User.FindFirst("id")?.Value
                       ?? User.FindFirst("userId")?.Value;

            if (string.IsNullOrEmpty(idClaim)) return null;
            if (Guid.TryParse(idClaim, out var guid)) return guid;
            return null;
        }

        [HttpGet("me")]
        public async Task<IActionResult> Me()
        {
            var userId = GetUserIdFromClaims();
            if (userId == null) return Unauthorized(new { error = "Token invalide" });

            var user = await _db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == userId.Value);

            if (user == null) return NotFound(new { error = "Utilisateur introuvable" });

            // CORRECTION ICI : Ajout de "});" à la fin
            return Ok(new
            {
                id = user.Id,
                fullName = user.FullName ?? "Utilisateur",
                email = user.Email,
                role = user.Role.ToString(),
                status = user.Status.ToString(),
                rating = user.Rating,
                joinedAt = user.CreatedAt
            });
        } // CORRECTION ICI : Ajout de l'accolade fermante de la méthode

        [HttpPut("profile")]
        public async Task<IActionResult> Update([FromBody] UpdateProfileRequest body)
        {
            var userId = GetUserIdFromClaims();
            if (userId == null) return Unauthorized();

            var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == userId.Value);
            if (user == null) return NotFound();

            if (!string.IsNullOrWhiteSpace(body.FullName))
                user.FullName = body.FullName;

            await _db.SaveChangesAsync();

            return Ok(new { message = "Succès", fullName = user.FullName });
        }

        [HttpPut("me/location")]
        public IActionResult UpdateLocation([FromBody] object body)
        {
            return Ok(new { received = true });
        }
    }

    public class UpdateProfileRequest
    {
        public string FullName { get; set; }
    }
}