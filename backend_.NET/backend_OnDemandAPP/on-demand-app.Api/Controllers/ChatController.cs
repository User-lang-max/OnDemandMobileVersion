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
    [Route("api/chat")]
    [Authorize]
    public class ChatController : ControllerBase
    {
        private readonly AppDbContext _db;
        public ChatController(AppDbContext db) => _db = db;

        [HttpGet("{jobId}")]
        public async Task<IActionResult> GetHistory(Guid jobId)
        {
            var currentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var msgs = await _db.Messages
                .Where(m => m.JobId == jobId)
                .OrderBy(m => m.SentAt)
                .Select(m => new {
                    m.Content,
                    m.SentAt,
                    IsMe = m.FromUserId.ToString() == currentUserId
                })
                .ToListAsync();
            return Ok(msgs);
        }

        [HttpPost]
        public async Task<IActionResult> SaveMessage([FromBody] CreateMessageDto dto)
        {
            var senderId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
            var job = await _db.Jobs.FindAsync(dto.JobId);
            if (job == null) return NotFound();

            var receiverId = (job.ClientId == senderId) ? job.ProviderId : job.ClientId;
            if (receiverId == null) return BadRequest("Destinataire introuvable");

            var msg = new Message
            {
                JobId = dto.JobId,
                FromUserId = senderId,
                ToUserId = receiverId.Value,
                Content = dto.Content,
                SentAt = DateTime.UtcNow
            };
            _db.Messages.Add(msg);
            await _db.SaveChangesAsync();
            return Ok();
        }
    }
    public class CreateMessageDto { public Guid JobId { get; set; } public string Content { get; set; } }
}