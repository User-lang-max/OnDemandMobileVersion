using System.IO;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;

namespace OnDemandApp.Infrastructure.Data
{
    public class DesignTimeDbContextFactory : IDesignTimeDbContextFactory<AppDbContext>
    {
        public AppDbContext CreateDbContext(string[] args)
        {
            // Chemin vers le projet API (là où se trouvent les appsettings.*)
            var basePath = Path.GetFullPath(
                Path.Combine(Directory.GetCurrentDirectory(), "..", "on-demand-app.Api")
            );

            var config = new ConfigurationBuilder()
                .SetBasePath(basePath)
                .AddJsonFile("appsettings.json", optional: true, reloadOnChange: false)
                .AddJsonFile("appsettings.Development.json", optional: true, reloadOnChange: false)
                .AddEnvironmentVariables()
                .Build();

            // Fallback si les appsettings ne sont pas trouvés

            var conn = config.GetConnectionString("OnDemandDb") ?? "Server=localhost\\SQLEXPRESS;Database=OnDemandDb;Trusted_Connection=True;Encrypt=False";


            var optionsBuilder = new DbContextOptionsBuilder<AppDbContext>();
            optionsBuilder.UseSqlServer(conn); 

            return new AppDbContext(optionsBuilder.Options);
        }
    }
}
