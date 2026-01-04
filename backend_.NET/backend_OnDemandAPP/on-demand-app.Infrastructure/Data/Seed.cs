using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using OnDemandApp.Core.Entities;

namespace OnDemandApp.Infrastructure.Data;

public static class Seed
{
    public static async Task RunAsync(AppDbContext db)
    {
        // 1. Appliquer les migrations (crée les tables)
        await db.Database.MigrateAsync();

        // 2. Synchroniser le Catalogue (ServiceItems) vers l'Opérationnel (Services)
        // On vérifie d'abord s'il y a des items définis dans le HasData du DbContext
        if (!await db.ServiceItems.AnyAsync()) return;

        // On récupère tous les items du catalogue 
        var catalogItems = await db.ServiceItems
            .Include(si => si.Category)
            .AsNoTracking()
            .ToListAsync();

        // Pour chaque item, on vérifie s'il existe déjà un Service opérationnel (par le slug/nom)
        var existingServices = await db.Services
            .Select(s => s.Title) // On utilise le Titre comme clé de correspondance
            .ToListAsync();

        var servicesToCreate = catalogItems
            .Where(item => !existingServices.Contains(item.Name))
            .Select(item => new Service
            {
                Id = Guid.NewGuid(),         // <--- C'est ICI qu'on génère le GUID pour la commande
                Title = item.Name,        
                Category = item.Category,   
                Description = $"Service de {item.Name} professionnel",
                BasePrice = 100m,            // Prix par défaut (sera surchargé par le provider plus tard)
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            })
            .ToList();

        if (servicesToCreate.Any())
        {
            await db.Services.AddRangeAsync(servicesToCreate);
            await db.SaveChangesAsync();
        }
    }
}