using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;

namespace OnDemandApp.Infrastructure.Interfaces
{
	public interface IFileService
	{
		Task<string> SaveAsync(IFormFile file, string folder);
	}
}
