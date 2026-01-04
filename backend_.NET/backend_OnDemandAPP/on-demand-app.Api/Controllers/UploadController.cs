using System;
using System.IO;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;

namespace OnDemandApp.Api.Controllers
{
    [ApiController]
    [Route("api/upload")]
    public class UploadController : ControllerBase
    {
        private static readonly string UploadPath =
            @"C:\Users\alaou\Downloads\uploads";

        [HttpPost]
        public async Task<IActionResult> Upload(IFormFile file)
        {
            if (file == null || file.Length == 0)
                return BadRequest("Aucun fichier reçu.");

            // Vérification basique du type
            if (file.ContentType != "application/pdf")
                return BadRequest("Seuls les fichiers PDF sont autorisés.");

            Directory.CreateDirectory(UploadPath);

            var fileName = $"{Guid.NewGuid()}_{Path.GetFileName(file.FileName)}";
            var fullPath = Path.Combine(UploadPath, fileName);

            await using var stream = new FileStream(fullPath, FileMode.Create);
            await file.CopyToAsync(stream);

            return Ok(new
            {
                fileName,
                path = fullPath
            });
        }
    }
}
