using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OnDemandApp.Core.Entities;
using OnDemandApp.Infrastructure.Data;

namespace OnDemandApp.Api.Controllers
{
    [ApiController]
    [Route("api")]
    public class MessagesController : ControllerBase
    {
        private readonly AppDbContext _db;
        public MessagesController(AppDbContext db) => _db = db;

    
        [HttpGet("messages/threads")]
        public async Task<IActionResult> Threads()
        {
            var threads = await _db.Messages
                .AsNoTracking()
                .Include(m => m.FromUser)
                .GroupBy(m => m.JobId)
                .Select(g => new ThreadDto(
                    g.Key,
                    g.OrderByDescending(x => x.SentAt)
                     .Select(x => x.Content)
                     .FirstOrDefault() ?? string.Empty
                ))
                .ToListAsync();

            return Ok(threads);
        }

     
        [HttpGet("jobs/{jobId:guid}/messages")]
        public async Task<IActionResult> JobMessages(Guid jobId)
        {
            var msgs = await _db.Messages.AsNoTracking()
                .Where(m => m.JobId == jobId)
                .Include(m => m.FromUser)
                .OrderBy(m => m.SentAt)
                .Select(m => new MessageDto(
                    m.Id,
                    m.JobId,
                    m.FromUserId,
                    m.FromUser.FullName,  
                    m.Content,
                    m.SentAt
                ))
                .ToListAsync();

            return Ok(msgs);
        }

       
        [HttpPost("jobs/{jobId:guid}/messages")]
        public async Task<IActionResult> Send(Guid jobId, [FromBody] SendMessageRequest body)
        {
            if (body == null || string.IsNullOrWhiteSpace(body.Content))
                return BadRequest("Content required.");
            if (body.FromUserId == Guid.Empty || body.ToUserId == Guid.Empty)
                return BadRequest("FromUserId and ToUserId are required.");

            // Ensure job exists
            var jobExists = await _db.Jobs.AnyAsync(j => j.Id == jobId);
            if (!jobExists) return NotFound("Job not found.");

            var msg = new Message
            {
                Id = Guid.NewGuid(),
                JobId = jobId,
                FromUserId = body.FromUserId,
                ToUserId = body.ToUserId,
                Content = body.Content,
                SentAt = DateTime.UtcNow
            };

            _db.Messages.Add(msg);
            await _db.SaveChangesAsync();
            return Ok();
        }
    }

    public record ThreadDto(Guid JobId, string LastMessageSnippet);

    public record MessageDto(
        Guid Id,
        Guid JobId,
        Guid FromUserId,
        string FromUserName,
        string Content,
        DateTime SentAt
    );

    public class SendMessageRequest
    {
        public Guid FromUserId { get; set; }
        public Guid ToUserId { get; set; }
        public string Content { get; set; } = string.Empty;
    }
}
