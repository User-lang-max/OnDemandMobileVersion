using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using OnDemandApp.Core.Entities;

namespace OnDemandApp.Api.Auth;

public interface IJwtTokenService
{
    string CreateToken(User user, string? roleOverride = null);
}

public class JwtTokenService : IJwtTokenService
{
    private readonly JwtOptions _opt;
    private readonly SymmetricSecurityKey _key;

    public JwtTokenService(IOptions<JwtOptions> opt)
    {
        _opt = opt.Value;
        _key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_opt.Key));
    }

    public string CreateToken(User user, string? roleOverride = null)
    {
        var claims = new List<Claim>
        {
            // 🔑 ID utilisateur (OBLIGATOIRE pour Authorize)
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),

            // Infos utilisateur
            new Claim(JwtRegisteredClaimNames.Email, user.Email),
            new Claim(ClaimTypes.Name, user.FullName ?? string.Empty),

            // Rôle (override possible pour provider_pending_onboarding)
            new Claim(
                ClaimTypes.Role,
                roleOverride ?? user.Role.ToString()
            ),

            // JWT ID
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        var creds = new SigningCredentials(_key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: _opt.Issuer,
            audience: _opt.Audience,
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(_opt.ExpireMinutes),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
