using System;

namespace OnDemandApp.Core.Entities;

public class Message : BaseEntity
{
    public Guid JobId { get; set; }
    public Job Job { get; set; } = default!;

    public Guid FromUserId { get; set; }
    public User FromUser { get; set; } = default!;

    public Guid ToUserId { get; set; }
    public User ToUser { get; set; } = default!;

    public string Content { get; set; } = default!;
    public DateTime SentAt { get; set; } = DateTime.UtcNow;
}
