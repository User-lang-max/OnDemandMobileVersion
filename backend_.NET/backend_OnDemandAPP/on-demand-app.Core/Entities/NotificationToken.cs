using System;

public class NotificationToken
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string Token { get; set; }
    public string DeviceType { get; set; } = "mobile";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
