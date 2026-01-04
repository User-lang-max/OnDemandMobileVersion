
using System.Collections.Generic;

namespace OnDemandApp.Core.Entities;

public class Service : BaseEntity
{
    public string Title { get; set; } = default!;
    public ServiceCategory Category { get; set; } = default!; 
    public string? Description { get; set; }
    public decimal BasePrice { get; set; }
    public bool IsActive { get; set; } = true;

    public ICollection<Job> Jobs { get; set; } = new List<Job>();
}
