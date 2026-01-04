using System.Collections.Generic;

namespace OnDemandApp.Core.Entities;

public class ServiceCategory
{
    public int Id { get; set; }
    public string Name { get; set; } = default!;
    public string Icon { get; set; } = "";
    public ProviderCategory Code { get; set; }

    public ICollection<ServiceItem> Services { get; set; } = new List<ServiceItem>();
}
