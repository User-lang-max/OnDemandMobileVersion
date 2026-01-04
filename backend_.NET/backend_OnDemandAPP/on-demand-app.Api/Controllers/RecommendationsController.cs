using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OnDemandApp.Core.Entities;
using OnDemandApp.Infrastructure.Data;

namespace OnDemandApp.Api.Controllers
{
    [ApiController]
    [Route("api/recommendations")]
    public class RecommendationsController : ControllerBase
    {
        private readonly AppDbContext _db;

        public RecommendationsController(AppDbContext db)
        {
            _db = db;
        }
        [HttpGet]
        public async Task<IActionResult> GetRecommendations()
        {
          
            var topServiceNames = await _db.Jobs
                .Include(j => j.Service)
                .GroupBy(j => j.Service.Title)
                .Select(g => new { Name = g.Key, Count = g.Count() })
                .OrderByDescending(x => x.Count)
                .Take(6)
                .Select(x => x.Name)
                .ToListAsync();

            var items = await _db.ServiceItems
                .Include(i => i.Category)
                .AsNoTracking()
                .Where(i => topServiceNames.Contains(i.Name))
                .Select(s => new {
                    s.Id,
                    s.Name,
                    s.Icon,
                    CategoryName = s.Category.Name,
                    CategoryId = s.CategoryId, 
                    MinPrice = 100
                })
                .ToListAsync();

         
            if (items.Count < 3)
            {
                var defaultItems = await _db.ServiceItems
                    .Include(i => i.Category)
                    .AsNoTracking()
                    .OrderBy(s => s.Id)
                    .Take(6)
                    .Select(s => new {
                        s.Id,
                        s.Name,
                        s.Icon,
                        CategoryName = s.Category.Name,
                        CategoryId = s.CategoryId,
                        MinPrice = 100
                    })
                    .ToListAsync();

                return Ok(defaultItems);
            }

          
            var sortedItems = items
                .OrderBy(i => topServiceNames.IndexOf(i.Name))
                .ToList();

            return Ok(sortedItems);
        }
        

        // --- AJOUT : LES MEILLEURS AVIS ---
        [HttpGet("reviews")]
        public async Task<IActionResult> GetTopReviews()
        {
         
            var reviews = await _db.Jobs
                .AsNoTracking()
                .Include(j => j.Client)
                .Include(j => j.Provider)
                .Include(j => j.Service)
                .Where(j => j.Rating >= 4 && !string.IsNullOrEmpty(j.ReviewComment))
                .OrderByDescending(j => j.CreatedAt)
                .Take(5)
                .Select(j => new {
                    j.Id,
                    ClientName = j.Client.FullName,
                    ProviderName = j.Provider.FullName,
                    ServiceName = j.Service.Title,
                    Rating = j.Rating,
                    Comment = j.ReviewComment,
                    Date = j.CreatedAt
                })
                .ToListAsync();

            return Ok(reviews);
        }
    }
}