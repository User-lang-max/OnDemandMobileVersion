namespace OnDemandApp.Core.Entities;

public enum AuthCodePurpose { Login2FA = 0, EmailConfirm = 1 }

public class AuthCode : BaseEntity
{
    public Guid UserId { get; set; }
    public User User { get; set; } = default!;

    public string Code { get; set; } = default!;       
    public AuthCodePurpose Purpose { get; set; } = AuthCodePurpose.Login2FA;
    public DateTime ExpiresAt { get; set; }           
}
