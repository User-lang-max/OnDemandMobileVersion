namespace OnDemandApp.Core.Entities;

public class User : BaseEntity
{
    public string Email { get; set; } = default!;
    public string FullName { get; set; } = default!;
    public UserRole Role { get; set; } = UserRole.client;
    public UserStatus Status { get; set; } = UserStatus.active;
    public decimal Rating { get; set; } = 0m;
    public string? FirebaseUid { get; set; }



    // AUTH
    public string PasswordHash { get; set; } = default!;
    public bool EmailConfirmed { get; set; } = false;
    public bool TwoFactorEnabled { get; set; } = true; 

    public ProviderProfile? ProviderProfile { get; set; }
    public ICollection<Job> JobsRequested { get; set; } = new List<Job>();
    public ICollection<Job> JobsTaken { get; set; } = new List<Job>();
}
