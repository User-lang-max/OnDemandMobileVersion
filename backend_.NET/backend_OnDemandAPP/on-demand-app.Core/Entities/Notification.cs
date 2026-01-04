using System;

namespace OnDemandApp.Core.Entities
{
    public class Notification : BaseEntity
    {
     

        public Guid UserId { get; set; }
        public User User { get; set; } = default!;

        public string Title { get; set; } = "Notification";
        public string Message { get; set; } = string.Empty;

     
        public string Type { get; set; } = "info";

    
        public string? ReferenceId { get; set; }

        public bool IsRead { get; set; } = false;
    }
}