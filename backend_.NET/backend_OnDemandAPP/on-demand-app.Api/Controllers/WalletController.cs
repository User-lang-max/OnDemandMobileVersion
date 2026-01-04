using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OnDemandApp.Core.Entities;
using OnDemandApp.Infrastructure.Data;

namespace OnDemandApp.Api.Controllers
{
    [ApiController]
    [Route("api/wallet")]
    [Authorize]
    public class WalletController : ControllerBase
    {
        private readonly AppDbContext _db;

        public WalletController(AppDbContext db)
        {
            _db = db;
        }

        private Guid GetUserId() => Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? Guid.Empty.ToString());

        [HttpGet]
        public async Task<IActionResult> GetWalletData()
        {
            var userId = GetUserId();
            var now = DateTime.UtcNow;
            var startOfMonth = new DateTime(now.Year, now.Month, 1);
            var startOfLastMonth = startOfMonth.AddMonths(-1);

          
            var completedJobs = await _db.Jobs
                .AsNoTracking()
                .Where(j => j.ProviderId == userId && j.Status == JobStatus.Completed)
                .Select(j => new { j.Price, j.CreatedAt, j.Id })
                .ToListAsync();

        
            var totalEarned = completedJobs.Sum(j => j.Price ?? 0);

            
            var pendingAmount = await _db.Jobs
                .Where(j => j.ProviderId == userId && (j.Status == JobStatus.Assigned || j.Status == JobStatus.InProgress))
                .SumAsync(j => j.Price ?? 0);

            var currentMonthEarnings = completedJobs
                .Where(j => j.CreatedAt >= startOfMonth)
                .Sum(j => j.Price ?? 0);

            var lastMonthEarnings = completedJobs
                .Where(j => j.CreatedAt >= startOfLastMonth && j.CreatedAt < startOfMonth)
                .Sum(j => j.Price ?? 0);

          
            double growth = 0;
            if (lastMonthEarnings > 0)
            {
                growth = (double)((currentMonthEarnings - lastMonthEarnings) / lastMonthEarnings) * 100;
            }
            else if (currentMonthEarnings > 0)
            {
                growth = 100; 
            }

            var totalJobs = completedJobs.Count;
            var averagePerJob = totalJobs > 0 ? totalEarned / totalJobs : 0;

          
            var bestMonth = completedJobs
                .GroupBy(j => new { j.CreatedAt.Year, j.CreatedAt.Month })
                .Select(g => g.Sum(x => x.Price ?? 0))
                .OrderByDescending(x => x)
                .FirstOrDefault();

          
            var chartData = new List<decimal>();
            for (int i = 5; i >= 0; i--)
            {
                var d = now.AddMonths(-i);
                var monthSum = completedJobs
                    .Where(j => j.CreatedAt.Month == d.Month && j.CreatedAt.Year == d.Year)
                    .Sum(j => j.Price ?? 0);
                chartData.Add(monthSum);
            }

        
            var transactions = await _db.Jobs
                .AsNoTracking()
                .Include(j => j.Client)
                .Where(j => j.ProviderId == userId && j.Status == JobStatus.Completed)
                .OrderByDescending(j => j.CreatedAt) 
                .Take(10)
                .Select(j => new
                {
                    Id = j.Id,
                    Description = j.Service.Title ?? "Service rendu",
                    ClientName = j.Client.FullName,
                    Date = j.CreatedAt,
                    Amount = j.Price ?? 0,
                    Status = "Succès"
                })
                .ToListAsync();

            return Ok(new
            {
                Balance = totalEarned,
                Pending = pendingAmount,
                ChartData = chartData, 
                Transactions = transactions,
                Stats = new
                {
                    MonthlyEarnings = currentMonthEarnings,
                    WeeklyGrowth = Math.Round(growth, 1),
                    CompletedJobs = totalJobs,
                    AveragePerJob = Math.Round(averagePerJob, 2),
                    BestMonth = bestMonth,
                    PendingWithdrawals = 0 
                }
            });
        }

        [HttpPost("withdraw")]
        public async Task<IActionResult> RequestWithdraw([FromBody] WithdrawRequest req)
        {
        
            if (req.Amount <= 0) return BadRequest("Montant invalide");


            await Task.Delay(500); 

            return Ok(new { message = "Demande de retrait reçue" });
        }
    }

    public class WithdrawRequest { public decimal Amount { get; set; } }
}