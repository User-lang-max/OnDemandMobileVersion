using System;
using System.ComponentModel.DataAnnotations;
using System.Security.Claims;
using System.Threading.Tasks;
using BCrypt.Net;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using OnDemandApp.Api.Auth;
using OnDemandApp.Core.Entities;
using OnDemandApp.Infrastructure.Data;

using FirebaseAdmin.Auth;

namespace OnDemandApp.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IJwtTokenService _jwt;
    private readonly ITwoFactorService _authService;
    private readonly IEmailService _emailService;

    public AuthController(AppDbContext db, IJwtTokenService jwt, ITwoFactorService authService, IEmailService emailService)
    {
        _db = db;
        _jwt = jwt;
        _authService = authService;
        _emailService = emailService;
    }

    // DTOs
    public record RegisterDto(
        [Required, EmailAddress] string Email,
        [Required] string FullName,
        [Required] string Password,
        UserRole Role,
        string? ProviderCategoryCode,
        string? CvUrl,
        string? PhotoUrl
    );

    public record LoginDto([Required, EmailAddress] string Email, [Required] string Password);

    public record FirebaseRegisterDto(
        string? FullName,
        UserRole? Role,
        string? ProviderCategoryCode,
        string? CvUrl,
        string? PhotoUrl
    );

    public record VerifyEmailDto([Required, EmailAddress] string Email, [Required] string Code);

    // 1. REGISTER
    [HttpPost("register")]
    public async Task<IActionResult> Register(RegisterDto dto)
    {


        if (await _db.Users.AnyAsync(u => u.Email == dto.Email))
            return Conflict("Email déjà utilisé.");

        var initialStatus = dto.Role == UserRole.provider ? UserStatus.pending : UserStatus.active;

        var user = new User
        {
            Email = dto.Email.Trim().ToLowerInvariant(),
            FullName = dto.FullName,
            Role = dto.Role,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
            EmailConfirmed = false,
            Status = initialStatus,
            TwoFactorEnabled = false
        };


        if (dto.Role == UserRole.provider)
        {
            user.ProviderProfile = new ProviderProfile
            {
                Zones = dto.ProviderCategoryCode ?? "Général",
                CvUrl = dto.CvUrl,
                PhotoUrl = dto.PhotoUrl,
                IsOnboardingCompleted = false
            };
            Console.WriteLine("[REGISTER] Profil Provider créé en mémoire avec CV/Photo.");
        }

        _db.Users.Add(user);
        await _db.SaveChangesAsync();

        Console.WriteLine($"[REGISTER] Utilisateur {user.Id} sauvegardé en base !");

        await _authService.CreateAndMaybeSendCodeAsync(user, AuthCodePurpose.EmailConfirm);

        return Created("", new { message = "Compte créé.", userId = user.Id });
    }

   

    [Authorize]
    [HttpGet("me")]
    public async Task<IActionResult> Me()
    {
        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier).Value);


        var user = await _db.Users.FindAsync(userId);

        if (user == null) return NotFound("Utilisateur introuvable");

        return Ok(new
        {
            user.Id,
            user.FullName,
            user.Email,
            user.Role,
            user.TwoFactorEnabled,
            user.CreatedAt,
            user.Status,
            user.EmailConfirmed
        });
    }

    // 3. ACTIVER/DESACTIVER 2FA
    [Authorize]
    [HttpPost("toggle-2fa")]
    public async Task<IActionResult> Toggle2FA()
    {
        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier).Value);
        var user = await _db.Users.FindAsync(userId);

        if (user == null) return NotFound();

        // On inverse l'état actuel
        user.TwoFactorEnabled = !user.TwoFactorEnabled;

        await _db.SaveChangesAsync();

        return Ok(new
        {
            enabled = user.TwoFactorEnabled,
            message = user.TwoFactorEnabled ? "2FA Activé" : "2FA Désactivé"
        });
    }

    // 4. VÉRIFICATION EMAIL
    [HttpPost("verify-email")]
    public async Task<IActionResult> VerifyEmail(VerifyEmailDto dto)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == dto.Email.Trim().ToLowerInvariant());
        if (user == null) return Unauthorized("Utilisateur inconnu.");

        var isValid = await _authService.VerifyCodeAsync(user, dto.Code, AuthCodePurpose.EmailConfirm);
        if (!isValid) return BadRequest("Code invalide ou expiré.");

        user.EmailConfirmed = true;
        await _db.SaveChangesAsync();

        return Ok(new { message = "Email confirmé avec succès. Vous pouvez maintenant vous connecter." });
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginDto dto)
    {
        var email = dto.Email.Trim().ToLowerInvariant();
        var user = await _db.Users
            .Include(u => u.ProviderProfile)
            .FirstOrDefaultAsync(u => u.Email == email);

        if (user == null)
            return Unauthorized("Identifiants invalides.");

        // 🔥 CAS UTILISATEUR FIREBASE
        if (user.PasswordHash == "FIREBASE")
        {
            return Unauthorized(new
            {
                error = "UseFirebaseLogin",
                message = "Ce compte utilise Firebase. Veuillez vous connecter via Firebase."
            });
        }

        // 🔐 LOGIN CLASSIQUE
        if (!BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash))
            return Unauthorized("Identifiants invalides.");


        if (!user.EmailConfirmed)
            return Unauthorized(new { error = "EmailNonVerifie", message = "Confirmez votre email." });

        if (user.Status == UserStatus.banned)
            return Unauthorized("Compte banni.");


        if (user.Status == UserStatus.pending && user.Role == UserRole.provider)
        {
            var hasFinishedOnboarding = user.ProviderProfile?.IsOnboardingCompleted ?? false;

            if (!hasFinishedOnboarding)
            {
                // Comme sur le Web : on donne un token et on dit de finir l'onboarding
                var tokenTemp = _jwt.CreateToken(user, "provider_pending_onboarding");
                return Ok(new
                {
                    token = tokenTemp,
                    role = "provider_pending_onboarding",
                    fullName = user.FullName
                });
            }
            else
            {
                // Comme sur le Web : Erreur bloquante tant que l'admin n'a pas validé
                return Unauthorized(new { error = "CompteEnAttente", message = "Dossier en attente de validation admin." });
            }
        }

        // Connexion normale
        var token = _jwt.CreateToken(user);
        return Ok(new { token, role = user.Role.ToString(), fullName = user.FullName });
    }
    // ================= 🔥 FIREBASE LOGIN =================
    [HttpPost("firebase-login")]
    public async Task<IActionResult> FirebaseLogin([FromBody] FirebaseRegisterDto? dto)
    {
        // 🔐 Récupération du token Firebase
        var authHeader = Request.Headers["Authorization"].ToString();
        if (!authHeader.StartsWith("Bearer "))
            return Unauthorized("Token Firebase manquant.");

        var firebaseToken = authHeader.Replace("Bearer ", "");

        FirebaseToken decoded;
        try
        {
            decoded = await FirebaseAuth.DefaultInstance.VerifyIdTokenAsync(firebaseToken);
        }
        catch
        {
            return Unauthorized("Token Firebase invalide.");
        }

        // 🔎 Infos Firebase
        var email = decoded.Claims.ContainsKey("email")
            ? decoded.Claims["email"]?.ToString()
            : null;

        if (string.IsNullOrEmpty(email))
            return Unauthorized("Email Firebase introuvable.");

        var firebaseUid = decoded.Uid;

        // 🔎 Recherche utilisateur en base
        var user = await _db.Users
            .Include(u => u.ProviderProfile)
            .FirstOrDefaultAsync(u => u.Email == email);

        // 🔗 LIAISON OU CRÉATION DU COMPTE
        if (user != null)
        {
            // Liaison Firebase si pas encore faite
            if (string.IsNullOrEmpty(user.FirebaseUid))
            {
                user.FirebaseUid = firebaseUid;
                user.EmailConfirmed = true; // 🔥 PLUS DE VÉRIF EMAIL
                await _db.SaveChangesAsync();
            }
        }
        else
        {
            // Création nouveau compte
            var role = dto?.Role ?? UserRole.client;
            var initialStatus = role == UserRole.provider
                ? UserStatus.pending
                : UserStatus.active;

            user = new User
            {
                Email = email.Trim().ToLowerInvariant(),
                FullName = !string.IsNullOrWhiteSpace(dto?.FullName)
                    ? dto.FullName
                    : email,
                Role = role,
                Status = initialStatus,
                EmailConfirmed = true, // 🔥 TOUJOURS TRUE
                FirebaseUid = firebaseUid,
                PasswordHash = "FIREBASE",
                TwoFactorEnabled = false
            };

            if (role == UserRole.provider)
            {
                user.ProviderProfile = new ProviderProfile
                {
                    Zones = dto?.ProviderCategoryCode ?? "Général",
                    CvUrl = dto?.CvUrl,
                    PhotoUrl = dto?.PhotoUrl,
                    IsOnboardingCompleted = false
                };
            }

            _db.Users.Add(user);
            await _db.SaveChangesAsync();
        }

        // 🔒 RÈGLES PROVIDER (ON GARDE)
        if (user.Role == UserRole.provider)
        {
            if (user.Status == UserStatus.banned)
                return Unauthorized("Compte banni.");

            if (user.Status == UserStatus.pending)
            {
                if (user.ProviderProfile?.IsOnboardingCompleted == false)
                {
                    var tokenTemp = _jwt.CreateToken(user, "provider_pending_onboarding");
                    return Ok(new
                    {
                        token = tokenTemp,
                        role = "provider_pending_onboarding",
                        fullName = user.FullName
                    });
                }

                return Unauthorized(new
                {
                    error = "CompteEnAttente",
                    message = "Dossier en attente de validation admin."
                });
            }
        }

        // ✅ LOGIN OK
        var token = _jwt.CreateToken(user);

        return Ok(new
        {
            token,
            role = user.Role.ToString(),
            fullName = user.FullName
        });
    }


}



