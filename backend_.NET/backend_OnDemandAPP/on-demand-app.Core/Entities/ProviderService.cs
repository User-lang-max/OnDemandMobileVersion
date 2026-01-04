using System;

namespace OnDemandApp.Core.Entities
{
    public class ProviderService
    {
        public int ProviderServiceId { get; set; }

        public Guid ProviderProfileUserId { get; set; }
        public ProviderProfile ProviderProfile { get; set; }

        public int ServiceItemId { get; set; }
        public ServiceItem ServiceItem { get; set; }

        public decimal BasePrice { get; set; }

    
        public bool IsActive { get; set; } = true;
    }
}