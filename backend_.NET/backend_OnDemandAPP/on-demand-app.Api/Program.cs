using System.Text;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using OnDemandApp.Api.Auth;
using OnDemandApp.Infrastructure.Data;
using FirebaseAdmin;
using Google.Apis.Auth.OAuth2;
using OnDemandApp.Api.Services;




var builder = WebApplication.CreateBuilder(args);

// ==========================================
// 0. CONFIGURATION RESEAU (MOBILE)
// ==========================================
// Permet au serveur d'écouter sur toutes les interfaces réseau (WiFi), pas juste localhost.
// C'est INDISPENSABLE pour que ton téléphone puisse accéder à l'API.
builder.WebHost.UseUrls("http://0.0.0.0:5234");

// ==========================================
// 1. CONFIGURATION DATABASE
// ==========================================
var connectionString = builder.Configuration.GetConnectionString("OnDemandDb")
    ?? "Server=localhost\\SQLEXPRESS;Database=OnDemandDb;Trusted_Connection=True;Encrypt=False";

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(connectionString));

// ==========================================
// 2. CONFIGURATION DES SETTINGS
// ==========================================
builder.Services.Configure<JwtOptions>(builder.Configuration.GetSection("Jwt"));
builder.Services.Configure<EmailOptions>(builder.Configuration.GetSection("Email"));

// ==========================================
// 3. INJECTION DES DÉPENDANCES
// ==========================================
builder.Services.AddScoped<IJwtTokenService, JwtTokenService>();
builder.Services.AddScoped<ITwoFactorService, TwoFactorService>();
builder.Services.AddTransient<IEmailService, EmailService>();

// ==========================================
// 4. CONFIGURATION CORS (MODIFIÉ POUR MOBILE)
// ==========================================
builder.Services.AddCors(options =>
{
    // Ta politique existante pour le Web (React JS)
    options.AddPolicy("AllowReactApp", policy =>
    {
        policy.WithOrigins("http://localhost:3000", "http://localhost:5173") // Tes ports React habituels
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });

    // NOUVELLE politique pour le Mobile (Permissive pour le développement)
    // Elle accepte tout le monde : le téléphone ET le web.
    options.AddPolicy("AllowMobile", policy =>
    {
        policy.AllowAnyOrigin()  // Accepte l'IP de ton téléphone (192.168.x.x)
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});
builder.Services.AddScoped<FirebaseNotificationService>();


// ==========================================
// 5. AUTHENTIFICATION JWT & SIGNALR
// ==========================================
var jwtOptions = builder.Configuration.GetSection("Jwt").Get<JwtOptions>();

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtOptions.Issuer,
            ValidAudience = jwtOptions.Audience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtOptions.Key))
        };

        // Configuration Spécifique pour SignalR (WebSockets)
        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                // SignalR envoie le token dans l'URL "?access_token=..."
                var accessToken = context.Request.Query["access_token"];

                // On vérifie si la requête contient un token ET si elle vise le Hub
                var path = context.HttpContext.Request.Path;
                if (!string.IsNullOrEmpty(accessToken) &&
                    path.StartsWithSegments("/hubs/notifications"))
                {
                    // On force l'utilisation de ce token pour l'authentification
                    context.Token = accessToken;
                }
                return Task.CompletedTask;
            }
        };
    });

// ==========================================
// 6. SERVICES STANDARDS
// ==========================================
builder.Services.AddControllers();
builder.Services.AddSignalR();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
if (FirebaseApp.DefaultInstance == null)
{
    FirebaseApp.Create(new AppOptions
    {
        Credential = GoogleCredential.FromFile("firebase-admin.json")
    });
}

var app = builder.Build();



// ==========================================
// 7. PIPELINE HTTP
// ==========================================

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// IMPORTANT : On utilise la politique "AllowMobile" car elle inclut "AllowAnyOrigin".
// Cela permet à React JS (localhost) ET React Native (IP locale) de fonctionner en même temps.
app.UseCors("AllowMobile");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.UseStaticFiles();

// Endpoint du Hub SignalR
app.MapHub<OnDemandApp.Api.Hubs.NotificationHub>("/hubs/notifications");

app.Run();