using System;

namespace OnDemandApp.Core.Entities
{
    public class Job : BaseEntity
    {
        public Guid ServiceId { get; set; }
        public Service Service { get; set; } = default!;

        public Guid ClientId { get; set; }
        public User Client { get; set; } = default!;

        public Guid? ProviderId { get; set; }
        public User? Provider { get; set; }

        public JobStatus Status { get; set; } = JobStatus.Pending;

        public string? Address { get; set; }
        public decimal? Lat { get; set; }
        public decimal? Lng { get; set; }
        public decimal? DistanceKm { get; set; }
        public decimal? Price { get; set; }
        public DateTime? ScheduledAt { get; set; }

   
        public string? Description { get; set; }
      
        public decimal? CurrentLat { get; set; } 
        public decimal? CurrentLng { get; set; }
        public int? Rating { get; set; } 
        public string? ReviewComment { get; set; }
    }
}