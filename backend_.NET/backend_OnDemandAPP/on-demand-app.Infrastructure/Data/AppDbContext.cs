using Microsoft.EntityFrameworkCore;
using OnDemandApp.Core.Entities;

namespace OnDemandApp.Infrastructure.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    // ===== Core/Auth =====
    public DbSet<User> Users => Set<User>();
    public DbSet<AuthCode> AuthCodes => Set<AuthCode>();

    // ===== Catalogue & prestataires =====
    public DbSet<ServiceCategory> ServiceCategories => Set<ServiceCategory>();
    public DbSet<ServiceItem> ServiceItems => Set<ServiceItem>();
    public DbSet<ProviderProfile> ProviderProfiles => Set<ProviderProfile>();
    public DbSet<ProviderService> ProviderServices => Set<ProviderService>();
    public DbSet<NotificationToken> NotificationTokens { get; set; }



    // ===== Jobs/Services/Comms/Payments =====
    public DbSet<Service> Services => Set<Service>();
    public DbSet<Job> Jobs => Set<Job>();
    public DbSet<Message> Messages => Set<Message>();
    public DbSet<LocationPing> LocationPings => Set<LocationPing>();
    public DbSet<Payment> Payments => Set<Payment>();

    // --- AJOUT : Table Notifications (pour corriger l'erreur CS1061) ---
    public DbSet<Notification> Notifications => Set<Notification>();

    protected override void OnModelCreating(ModelBuilder b)
    {
        base.OnModelCreating(b);

        // ---------- User ----------
        b.Entity<User>()
            .HasIndex(u => u.Email)
            .IsUnique();

        b.Entity<User>()
            .Property(u => u.Rating)
            .HasColumnType("numeric(4,2)");

        // ---------- ProviderProfile (1-1, clé = UserId) ----------
        b.Entity<ProviderProfile>()
            .HasKey(p => p.UserId);

        b.Entity<ProviderProfile>()
            .HasOne(p => p.User)
            .WithOne(u => u.ProviderProfile!)
            .HasForeignKey<ProviderProfile>(p => p.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        // ---------- Catalogue ----------
        b.Entity<ServiceCategory>()
            .Property(c => c.Name)
            .IsRequired();

        b.Entity<ServiceItem>()
            .HasKey(s => s.Id);

        b.Entity<ServiceItem>()
            .Property(s => s.Name)
            .IsRequired();

        b.Entity<ServiceItem>()
            .Property(s => s.Slug)
            .IsRequired();

        b.Entity<ServiceItem>()
            .HasIndex(s => s.Slug)
            .IsUnique();

        b.Entity<ServiceItem>()
            .HasOne(s => s.Category)
            .WithMany(c => c.Services)
            .HasForeignKey(s => s.CategoryId)
            .OnDelete(DeleteBehavior.Cascade);

        // ---------- ProviderService (liaison) ----------
        b.Entity<ProviderService>()
            .HasKey(ps => ps.ProviderServiceId);

        b.Entity<ProviderService>()
            .Property(ps => ps.BasePrice)
            .HasColumnType("numeric(12,2)");

        b.Entity<ProviderService>()
            .HasOne(ps => ps.ProviderProfile)
            .WithMany(p => p.Services)
            .HasForeignKey(ps => ps.ProviderProfileUserId)
            .OnDelete(DeleteBehavior.Cascade);

        b.Entity<ProviderService>()
            .HasOne(ps => ps.ServiceItem)
            .WithMany(s => s.ProviderServices)
            .HasForeignKey(ps => ps.ServiceItemId)
            .OnDelete(DeleteBehavior.Cascade);

        b.Entity<ProviderService>()
            .HasIndex(ps => ps.ServiceItemId);

        // ---------- Service ----------
        b.Entity<Service>()
            .Property(s => s.BasePrice)
            .HasColumnType("numeric(12,2)");

        // ---------- Job ----------
        b.Entity<Job>()
            .Property(j => j.Price).HasColumnType("numeric(12,2)");
        b.Entity<Job>()
            .Property(j => j.DistanceKm).HasColumnType("numeric(12,2)");
        b.Entity<Job>()
            .Property(j => j.Lat).HasColumnType("numeric(10,6)");
        b.Entity<Job>()
            .Property(j => j.Lng).HasColumnType("numeric(10,6)");

        b.Entity<Job>()
            .HasOne(j => j.Service)
            .WithMany(s => s.Jobs)
            .HasForeignKey(j => j.ServiceId)
            .OnDelete(DeleteBehavior.Cascade);

        // MAPPINGS EXPLICITES (Job -> Client/Provider)
        b.Entity<Job>()
            .HasOne(j => j.Client)
            .WithMany(u => u.JobsRequested)
            .HasForeignKey(j => j.ClientId)
            .OnDelete(DeleteBehavior.Restrict);

        b.Entity<Job>()
            .HasOne(j => j.Provider)
            .WithMany(u => u.JobsTaken)
            .HasForeignKey(j => j.ProviderId)
            .OnDelete(DeleteBehavior.Restrict);

        // ---------- Message ----------
        b.Entity<Message>()
            .Property(m => m.Content).IsRequired();

        // Correction pour Message -> Job (relation optionnelle ou explicite)
        b.Entity<Message>()
            .HasOne(m => m.Job)
            .WithMany()
            .HasForeignKey(m => m.JobId)
            .OnDelete(DeleteBehavior.Cascade);

        b.Entity<Message>()
            .HasOne(m => m.FromUser)
            .WithMany()
            .HasForeignKey(m => m.FromUserId)
            .OnDelete(DeleteBehavior.Restrict);

        b.Entity<Message>()
            .HasOne(m => m.ToUser)
            .WithMany()
            .HasForeignKey(m => m.ToUserId)
            .OnDelete(DeleteBehavior.Restrict);

        // ---------- LocationPing ----------
        b.Entity<LocationPing>()
            .Property(p => p.Lat).HasColumnType("numeric(10,6)");
        b.Entity<LocationPing>()
            .Property(p => p.Lng).HasColumnType("numeric(10,6)");
        b.Entity<LocationPing>()
            .Property(p => p.AccuracyM).HasColumnType("numeric(8,2)");

        // --- AJOUT : Configuration LocationPing -> Job (important pour éviter erreurs) ---
        b.Entity<LocationPing>()
            .HasOne(p => p.Job)
            .WithMany()
            .HasForeignKey(p => p.JobId)
            .OnDelete(DeleteBehavior.Cascade);

        // ---------- Payment ----------
        b.Entity<Payment>()
            .Property(p => p.Amount).HasColumnType("numeric(12,2)");

        b.Entity<Payment>()
            .HasIndex(p => new { p.PSPProvider, p.PSPPaymentId });

        b.Entity<Payment>()
            .HasOne(p => p.Job)
            .WithMany()
            .HasForeignKey(p => p.JobId)
            .OnDelete(DeleteBehavior.Cascade);
        //--------------------------------------------
        b.Entity<NotificationToken>()
            .HasIndex(t => new { t.UserId, t.Token })
            .IsUnique();

        // ---------- AuthCode ----------
        b.Entity<AuthCode>()
            .Property(a => a.Code).IsRequired();

        b.Entity<AuthCode>()
            .HasOne(a => a.User)
            .WithMany()
            .HasForeignKey(a => a.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        b.Entity<AuthCode>()
            .HasIndex(a => new { a.UserId, a.Purpose, a.Code });

        // --- AJOUT : Configuration Notification (pour éviter erreurs cascade) ---
        b.Entity<Notification>()
            .HasOne(n => n.User)
            .WithMany()
            .HasForeignKey(n => n.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        // --- AJOUT : Configuration des colonnes GPS pour Job (Tracking temps réel) ---
        b.Entity<Job>().Property(j => j.CurrentLat).HasColumnType("numeric(10,6)");
        b.Entity<Job>().Property(j => j.CurrentLng).HasColumnType("numeric(10,6)");

        // --- AJOUT : Configuration ProviderProfile (Dernière position connue) ---
        b.Entity<ProviderProfile>().Property(p => p.LastLat).HasColumnType("numeric(10,6)");
        b.Entity<ProviderProfile>().Property(p => p.LastLng).HasColumnType("numeric(10,6)");

        // --- AJOUT : MinPrice pour le catalogue (éviter erreur décimale) ---
        b.Entity<ServiceItem>().Property(s => s.MinPrice).HasColumnType("numeric(12,2)");

        // ---------- SEED CATEGORIES / ITEMS ----------
        b.Entity<ServiceCategory>().HasData(
            new ServiceCategory { Id = 1, Name = "Services à domicile", Icon = "🏠", Code = ProviderCategory.HomeServices },
            new ServiceCategory { Id = 2, Name = "Beauté et bien-être", Icon = "💇", Code = ProviderCategory.BeautyAndWellness },
            new ServiceCategory { Id = 3, Name = "Services automobiles", Icon = "🚗", Code = ProviderCategory.Automotive }
        );

        b.Entity<ServiceItem>().HasData(
            // Home (101..106)
            new ServiceItem { Id = 101, CategoryId = 1, Name = "Plombier", Icon = "🚰", Slug = "plombier", MinPrice = 150 },
            new ServiceItem { Id = 102, CategoryId = 1, Name = "Électricien", Icon = "💡", Slug = "electricien", MinPrice = 150 },
            new ServiceItem { Id = 103, CategoryId = 1, Name = "Ménage", Icon = "🧹", Slug = "menage", MinPrice = 100 },
            new ServiceItem { Id = 104, CategoryId = 1, Name = "Peintre / bricoleur", Icon = "🎨🔧", Slug = "peintre-bricoleur", MinPrice = 200 },
            new ServiceItem { Id = 105, CategoryId = 1, Name = "Jardinier", Icon = "🌿", Slug = "jardinier", MinPrice = 120 },
            new ServiceItem { Id = 106, CategoryId = 1, Name = "Technicien électroménager", Icon = "⚙️", Slug = "technicien-electromenager", MinPrice = 180 },

            // Beauty (201..205)
            new ServiceItem { Id = 201, CategoryId = 2, Name = "Coiffeur(se)", Icon = "💇", Slug = "coiffeur", MinPrice = 100 },
            new ServiceItem { Id = 202, CategoryId = 2, Name = "Esthéticien(ne)", Icon = "💅", Slug = "estheticienne", MinPrice = 150 },
            new ServiceItem { Id = 203, CategoryId = 2, Name = "Masseur / masseuse", Icon = "💆", Slug = "masseur", MinPrice = 300 },
            new ServiceItem { Id = 204, CategoryId = 2, Name = "Coach sportif", Icon = "🏋️‍♀️", Slug = "coach-sportif", MinPrice = 200 },
            new ServiceItem { Id = 205, CategoryId = 2, Name = "Nutritionniste", Icon = "🍎", Slug = "nutritionniste", MinPrice = 250 },

            // Auto (301..304)
            new ServiceItem { Id = 301, CategoryId = 3, Name = "Mécanicien à domicile", Icon = "🛠️", Slug = "mecanicien-domicile", MinPrice = 200 },
            new ServiceItem { Id = 302, CategoryId = 3, Name = "Lavage auto à domicile", Icon = "🚘", Slug = "lavage-auto-domicile", MinPrice = 80 },
            new ServiceItem { Id = 303, CategoryId = 3, Name = "Dépanneur / remorquage", Icon = "🚛", Slug = "depannage-remorquage", MinPrice = 300 },
            new ServiceItem { Id = 304, CategoryId = 3, Name = "Chauffeur privé (VTC, taxi)", Icon = "🚕", Slug = "chauffeur-prive", MinPrice = 50 }
        );
    }
}