using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OnDemandApp.Core.Entities;
using OnDemandApp.Infrastructure.Data;

namespace OnDemandApp.Api.Controllers
{
    [ApiController]
    [Route("api/catalog")]
    public class CatalogController : ControllerBase
    {
        private readonly AppDbContext _db;

        public CatalogController(AppDbContext db)
        {
            _db = db;
        }

        
        [HttpGet("categories/{categoryId}/items")]
        public async Task<IActionResult> GetItemsByCategory(int categoryId)
        {
            var items = await _db.ServiceItems
                .Where(i => i.CategoryId == categoryId)
                .AsNoTracking()
                .Select(i => new
                {
                    i.Id,
                    i.Name,
                    i.Icon,
                    i.Slug,
                    MinPrice = 100 
                })
                .ToListAsync();

            return Ok(items);
        }

       
        [HttpGet("tree")]
        public async Task<IActionResult> GetCatalogTree()
        {
            var tree = await _db.ServiceCategories
                .AsNoTracking()
                .Include(c => c.Services) 
                .Select(c => new
                {
                    c.Id,
                    c.Name,
                    c.Icon,
                    Services = c.Services.Select(s => new {
                        s.Id,
                        s.Name,
                        s.Icon,
                        s.MinPrice
                    }).ToList()
                })
                .ToListAsync();

            return Ok(tree);
        }

       
        [HttpGet("services")]
        public async Task<IActionResult> GetAllCatalog()
        {
            var items = await _db.ServiceItems
                .Include(i => i.Category)
                .AsNoTracking()
                .Select(i => new
                {
                    i.Id,
                    i.Name,
                    CategoryName = i.Category.Name,
                    MinPrice = 100 
                })
                .ToListAsync();

            return Ok(new { items });
        }

       
        [HttpGet("services/{id}")]
        public async Task<IActionResult> GetItemDetail(int id)
        {
          
            var item = await _db.ServiceItems
                .Include(i => i.Category)
                .FirstOrDefaultAsync(i => i.Id == id);

            if (item == null)
                return NotFound("Item catalogue introuvable");

         
            var operationalService = await _db.Services
                .Include(s => s.Category)
                .FirstOrDefaultAsync(s =>
                    s.Title == item.Name &&
                    s.Category.Id == item.CategoryId);

           
            if (operationalService == null)
            {
                operationalService = new Service
                {
                    Id = Guid.NewGuid(),
                    Title = item.Name,
                    Category = item.Category,
                    Description = $"Service professionnel de {item.Name}",
                    BasePrice = 100m,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                };

                _db.Services.Add(operationalService);
                await _db.SaveChangesAsync();
            }

        
            return Ok(new
            {
                item.Id,
                item.Name,
                item.Icon,
                MinPrice = operationalService.BasePrice,
                ServiceId = operationalService.Id
            });
        }

        [HttpGet("categories")]
        public async Task<IActionResult> GetCategories()
        {
            return Ok(await _db.ServiceCategories.AsNoTracking().OrderBy(c => c.Id).ToListAsync());
        }


       
        [HttpGet("search-items")]
        public async Task<IActionResult> SearchCatalogItems([FromQuery] string q)
        {
            if (string.IsNullOrWhiteSpace(q)) return Ok(new object[] { });

            q = q.ToLower().Trim();

            var results = await _db.ServiceItems
                .Include(i => i.Category)
                .AsNoTracking()
                .Where(i => i.Name.ToLower().Contains(q) || i.Category.Name.ToLower().Contains(q))
                .Select(s => new {
                    s.Id,
                    s.Name,
                    s.Icon,
                    CategoryName = s.Category.Name,
                    CategoryId = s.CategoryId,
                    MinPrice = 100
                })
                .Take(10)
                .ToListAsync();

            return Ok(results);
        }


        [HttpPost("sync")]
        public async Task<IActionResult> SyncCatalogToServices()
        {
            var catalogItems = await _db.ServiceItems
                .Include(i => i.Category)
                .ToListAsync();

            var existingServiceTitles = await _db.Services
                .Select(s => s.Title)
                .ToListAsync();

            var createdCount = 0;

            foreach (var item in catalogItems)
            {
                if (!existingServiceTitles.Contains(item.Name))
                {
                    var newService = new Service
                    {
                        Id = Guid.NewGuid(),
                        Title = item.Name,
                        Category = item.Category,
                        Description = $"Service professionnel de {item.Name}",
                        BasePrice = 100m,
                        IsActive = true,
                        CreatedAt = DateTime.UtcNow
                    };

                    _db.Services.Add(newService);
                    createdCount++;
                }
            }

            if (createdCount > 0)
            {
                await _db.SaveChangesAsync();
                return Ok(new
                {
                    message = $"Succès : {createdCount} services ont été créés et synchronisés."
                });
            }

            return Ok(new { message = "Tout est déjà synchronisé. Aucun ajout nécessaire." });
        }

      
        [HttpGet("search")]
        public async Task<IActionResult> SearchProviders([FromQuery] int serviceId)
        {
            if (serviceId <= 0)
                return BadRequest("ID de service invalide.");

            var providers = await _db.ProviderServices
                .AsNoTracking()
                .Include(ps => ps.ProviderProfile)
                    .ThenInclude(pp => pp.User)
                .Where(ps =>
                    ps.ServiceItemId == serviceId &&
                    ps.IsActive &&
                    ps.ProviderProfile.IsAvailable &&
                    ps.ProviderProfile.User.Status == UserStatus.active)
                .Select(ps => new
                {
                    ProviderId = ps.ProviderProfile.UserId,
                    Name = ps.ProviderProfile.User.FullName,
                    BasePrice = ps.BasePrice,
                    Rating = ps.ProviderProfile.User.Rating,
                    DistanceKm = 3.5 
                })
                .ToListAsync();

            return Ok(providers);
        }
    }
}
