using System.Collections.Generic;

namespace OnDemandApp.Core.Entities;

public class ServiceItem
{
    public int Id { get; set; }
    public int CategoryId { get; set; }
    public decimal MinPrice { get; set; } = 100;
    public string Name { get; set; } = default!;  
    public string Slug { get; set; } = default!;  
    public string Icon { get; set; } = "";        

    public ServiceCategory Category { get; set; } = default!;
    public ICollection<ProviderService> ProviderServices { get; set; } = new List<ProviderService>();
}
