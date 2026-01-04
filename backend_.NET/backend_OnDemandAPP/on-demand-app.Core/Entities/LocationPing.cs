using System;

namespace OnDemandApp.Core.Entities;

public class LocationPing : BaseEntity
{
    public Guid JobId { get; set; }
    public Job Job { get; set; } = default!;

    public Guid ProviderId { get; set; }
    public User Provider { get; set; } = default!;
    public Guid UserId { get; set; }
    public decimal Lat { get; set; }
    public decimal Lng { get; set; }
    public decimal? AccuracyM { get; set; }
}
