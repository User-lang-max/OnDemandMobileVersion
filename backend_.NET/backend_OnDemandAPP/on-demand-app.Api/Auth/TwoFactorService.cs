using System;
using System.Linq;
using System.Security.Cryptography;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using OnDemandApp.Core.Entities;
using OnDemandApp.Infrastructure.Data;

namespace OnDemandApp.Api.Auth;

public interface ITwoFactorService
{
    
    Task<(AuthCode code, bool sent)> CreateAndMaybeSendCodeAsync(User user, AuthCodePurpose purpose, CancellationToken ct = default);
    Task<bool> VerifyCodeAsync(User user, string code, AuthCodePurpose purpose, CancellationToken ct = default);

    
    Task<(AuthCode code, bool sent)> CreateAndMaybeSendLoginCodeAsync(User user, CancellationToken ct = default);
    Task<bool> VerifyLoginCodeAsync(User user, string code, CancellationToken ct = default);
}

public class TwoFactorService : ITwoFactorService
{
    private readonly AppDbContext _db;
    private readonly IEmailService _mailer;
    private readonly EmailOptions _emailOptions;

    public TwoFactorService(AppDbContext db, IEmailService mailer, IOptions<EmailOptions> emailOptions)
    {
        _db = db; _mailer = mailer; _emailOptions = emailOptions.Value;
    }

   
    public async Task<(AuthCode code, bool sent)> CreateAndMaybeSendCodeAsync(User user, AuthCodePurpose purpose, CancellationToken ct = default)
    {
        var now = DateTime.UtcNow;

        
        var olds = await _db.AuthCodes
            .Where(a => a.UserId == user.Id && a.Purpose == purpose && a.ExpiresAt > now)
            .ToListAsync(ct);

        if (olds.Any()) { _db.AuthCodes.RemoveRange(olds); }

        var rnd = RandomNumberGenerator.GetInt32(100000, 999999);
        var codeStr = rnd.ToString();

        var auth = new AuthCode
        {
            UserId = user.Id,
            Code = codeStr,
            Purpose = purpose, 
            CreatedAt = DateTime.UtcNow,
            ExpiresAt = DateTime.UtcNow.AddMinutes(15) 
        };

        _db.AuthCodes.Add(auth);
        await _db.SaveChangesAsync(ct);

        // Envoi Email
        var sent = false;
        if (_emailOptions.Enabled)
        {
            string subject = purpose == AuthCodePurpose.Login2FA ? "Code de connexion" : "Confirmez votre email";
            string body = $@"<p>Votre code de vérification :</p>
                             <p style=""font-size:24px;font-weight:bold"">{codeStr}</p>";

            await _mailer.SendAsync(user.Email, subject, body, ct);
            sent = true;
        }
        else
        {
            Console.WriteLine($"[DEV CODE {purpose}] {user.Email} -> {codeStr}");
        }

        return (auth, sent);
    }

    public async Task<bool> VerifyCodeAsync(User user, string code, AuthCodePurpose purpose, CancellationToken ct = default)
    {
        var clean = (code ?? "").Trim();
        var match = await _db.AuthCodes
            .Where(a => a.UserId == user.Id && a.Purpose == purpose && a.ExpiresAt >= DateTime.UtcNow)
            .OrderByDescending(a => a.CreatedAt)
            .FirstOrDefaultAsync(ct);

        if (match == null || match.Code != clean) return false;

        _db.AuthCodes.Remove(match);
        await _db.SaveChangesAsync(ct);
        return true;
    }

 
    public Task<(AuthCode code, bool sent)> CreateAndMaybeSendLoginCodeAsync(User user, CancellationToken ct = default)
        => CreateAndMaybeSendCodeAsync(user, AuthCodePurpose.Login2FA, ct);

    public Task<bool> VerifyLoginCodeAsync(User user, string code, CancellationToken ct = default)
        => VerifyCodeAsync(user, code, AuthCodePurpose.Login2FA, ct);
}