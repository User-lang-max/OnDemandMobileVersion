using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using OnDemandApp.Api.Hubs;
using OnDemandApp.Core.Entities;
using OnDemandApp.Infrastructure.Data;
using iText.Kernel.Pdf;
using iText.Layout;
using iText.Layout.Element;
using iText.IO.Font;
using iText.IO.Font.Constants;
using iText.Kernel.Font;
using iText.Kernel.Colors;
using iText.Layout.Borders;
using iText.Layout.Properties;


namespace OnDemandApp.Api.Controllers
{
    [ApiController]
    [Route("api/orders")]
    [Authorize]
    public class JobController : ControllerBase
    {
        private static readonly PdfFont _boldFont = PdfFontFactory.CreateFont(StandardFonts.HELVETICA_BOLD);
        private static readonly PdfFont _regularFont = PdfFontFactory.CreateFont(StandardFonts.HELVETICA);
        private readonly AppDbContext _db;
        private readonly IHubContext<NotificationHub> _hubContext;

        public JobController(AppDbContext db, IHubContext<NotificationHub> hubContext)
        {
            _db = db;
            _hubContext = hubContext;
        }

        private Guid GetUserId() => Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

       
        [HttpGet("{id:guid}")]
        public async Task<IActionResult> GetOrder(Guid id)
        {
            var userId = GetUserId();

         
            var j = await _db.Jobs
                .Include(x => x.Client)
                .Include(x => x.Service)
                .Include(x => x.Provider)
                .AsNoTracking()
                .FirstOrDefaultAsync(x => x.Id == id);

            if (j == null) return NotFound();
            if (j.ClientId != userId && j.ProviderId != userId) return Unauthorized();

        
            var messages = await _db.Messages
                .Where(m => m.JobId == id)
                .OrderBy(m => m.SentAt)
                .Select(m => new
                {
                    m.Id,
                    m.Content,
                    Text = m.Content, 
                    SentAt = m.SentAt,
                    
                    Sender = m.FromUserId == userId ? "me" : "other",
                    IsMe = m.FromUserId == userId,
                    SenderName = m.FromUserId == j.ClientId ? j.Client.FullName : (j.Provider != null ? j.Provider.FullName : "Système")
                })
                .ToListAsync();

     
            var lastPing = await _db.LocationPings
                .Where(p => p.JobId == id)
                .OrderByDescending(p => p.CreatedAt)
                .FirstOrDefaultAsync();

     
            var response = new
            {
                j.Id,
                StatusCode = (int)j.Status,
                Status = j.Status.ToString(),
                j.Price,
                j.Address,
                j.Description,
                j.CreatedAt,
                j.ScheduledAt,

           
                Lat = lastPing != null ? lastPing.Lat : j.Lat,
                Lng = lastPing != null ? lastPing.Lng : j.Lng,
                IsTrackingActive = (j.Status == JobStatus.InProgress || j.Status == JobStatus.Assigned || j.Status == JobStatus.Confirmed),

          
                ClientName = j.Client.FullName,
                ServiceName = j.Service.Title,
                CategoryName = j.Service.Title, 
                ProviderName = j.Provider?.FullName,

                ProviderPhone = j.Provider != null ? "0600000000" : null,

           
                HasReview = j.Rating != null,
                MyRating = j.Rating,
                ProviderRating = j.Provider?.Rating ?? 5.0m,

             
                Messages = messages,

               
                Documents = j.Status == JobStatus.Completed || j.Status == JobStatus.Confirmed
                    ? new[] { new { Name = $"Facture-{j.Id.ToString().Substring(0, 8)}.pdf" } }
                    : new object[] { }
            };

            return Ok(response);
        }

      
        [HttpPost("{id}/messages")]
        public async Task<IActionResult> SendMessage([FromRoute] Guid id, [FromBody] SendMessageDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Content)) return BadRequest("Le message ne peut pas être vide.");

            var userId = GetUserId();
            var job = await _db.Jobs.FindAsync(id);
            if (job == null) return NotFound("Commande introuvable.");


            var receiverId = (job.ClientId == userId) ? job.ProviderId : job.ClientId;
            if (receiverId == null) return BadRequest("Aucun destinataire disponible pour cette commande.");

            var msg = new Message
            {
                Id = Guid.NewGuid(),
                JobId = id,
                FromUserId = userId,
                ToUserId = receiverId.Value,
                Content = dto.Content,
                SentAt = DateTime.UtcNow
            };

            _db.Messages.Add(msg);

         
            var notif = new Notification
            {
                UserId = receiverId.Value,
                Title = "Nouveau message",
                Message = $"Message reçu pour la commande #{job.Id.ToString().Substring(0, 5)}",
                Type = "message",
                ReferenceId = job.Id.ToString(),
                CreatedAt = DateTime.UtcNow,
                IsRead = false
            };
            _db.Notifications.Add(notif);

            await _db.SaveChangesAsync();

            
            if (_hubContext != null)
            {
                await _hubContext.Clients.User(receiverId.Value.ToString()).SendAsync("ReceiveMessage", new
                {
                    id = msg.Id,
                    text = dto.Content,
                    sender = "other",
                    sentAt = msg.SentAt
                });

               
                await _hubContext.Clients.User(receiverId.Value.ToString()).SendAsync("NotificationReceived", notif);
            }

            return Ok();
        }

        [HttpGet("{id}/invoice")]
        public async Task<IActionResult> DownloadInvoice(Guid id)
        {
            try
            {
                var userId = GetUserId();

                // --- OPTIMISATION SQL : On ne récupère que le texte nécessaire (très rapide) ---
                var job = await _db.Jobs
                    .AsNoTracking()
                    .Where(j => j.Id == id)
                    .Select(j => new
                    {
                        j.Id,
                        j.ClientId,
                        j.ProviderId,
                        j.Price,
                        j.Description,
                        j.Address,
                        j.CreatedAt,
                        ServiceName = j.Service.Title,
                        ClientName = j.Client.FullName,
                        ProviderName = j.Provider != null ? j.Provider.FullName : "Non assigné",
                        ProviderEmail = j.Provider != null ? j.Provider.Email : "" // Exemple si besoin
                    })
                    .FirstOrDefaultAsync();

                if (job == null) return NotFound("Commande introuvable.");

                // Sécurité
                if (job.ClientId != userId && job.ProviderId != userId) return Forbid();

                byte[] pdfBytes;

                // --- GÉNÉRATION PDF ---
                using (var ms = new MemoryStream())
                {
                    var writer = new PdfWriter(ms);
                    var pdf = new PdfDocument(writer);
                    var doc = new Document(pdf);

                    // COULEURS & STYLES
                    Color brandColor = new DeviceRgb(13, 148, 136); // Teal 600
                    Color lightGray = new DeviceRgb(243, 244, 246); // Gray 100
                    Color darkGray = new DeviceRgb(55, 65, 81);     // Gray 700

                    doc.SetFont(_regularFont);

                    // 1. EN-TÊTE (HEADER)
                    var headerTable = new Table(new float[] { 1, 1 }).UseAllAvailableWidth();
                    headerTable.SetBorder(Border.NO_BORDER);

                    // Logo / Marque (Gauche)
                    headerTable.AddCell(new Cell().Add(new Paragraph("OnDemandApp")
                        .SetFont(_boldFont).SetFontSize(22).SetFontColor(brandColor))
                        .SetBorder(Border.NO_BORDER));

                    // Infos Facture (Droite)
                    headerTable.AddCell(new Cell()
                        .Add(new Paragraph("FACTURE").SetFont(_boldFont).SetFontSize(16).SetTextAlignment(TextAlignment.RIGHT))
                        .Add(new Paragraph($"#{job.Id.ToString().Substring(0, 8).ToUpper()}").SetFontSize(10).SetFontColor(darkGray).SetTextAlignment(TextAlignment.RIGHT))
                        .Add(new Paragraph($"Date: {DateTime.Now:dd/MM/yyyy}").SetFontSize(10).SetFontColor(darkGray).SetTextAlignment(TextAlignment.RIGHT))
                        .SetBorder(Border.NO_BORDER));

                    doc.Add(headerTable);

                    // Ligne de séparation
                    doc.Add(new Paragraph("\n"));
                    doc.Add(new LineSeparator(new iText.Kernel.Pdf.Canvas.Draw.SolidLine(1f)).SetFontColor(lightGray).SetMarginBottom(20));

                    // 2. ADRESSES (CLIENT & PRESTATAIRE)
                    var addressTable = new Table(new float[] { 1, 1 }).UseAllAvailableWidth();
                    addressTable.SetMarginBottom(30);

                    // Client
                    addressTable.AddCell(new Cell().SetBorder(Border.NO_BORDER)
                        .Add(new Paragraph("FACTURÉ À :").SetFont(_boldFont).SetFontSize(9).SetFontColor(ColorConstants.GRAY))
                        .Add(new Paragraph(job.ClientName).SetFontSize(12).SetFont(_boldFont))
                        .Add(new Paragraph(job.Address ?? "Adresse non renseignée").SetFontSize(10).SetFontColor(darkGray)));

                    // Prestataire
                    addressTable.AddCell(new Cell().SetBorder(Border.NO_BORDER).SetTextAlignment(TextAlignment.RIGHT)
                        .Add(new Paragraph("PRESTATAIRE :").SetFont(_boldFont).SetFontSize(9).SetFontColor(ColorConstants.GRAY))
                        .Add(new Paragraph(job.ProviderName).SetFontSize(12).SetFont(_boldFont))
                        .Add(new Paragraph("Service certifié").SetFontSize(10).SetFontColor(brandColor)));

                    doc.Add(addressTable);

                    // 3. TABLEAU DES SERVICES
                    var table = new Table(new float[] { 4, 1, 1, 1 }).UseAllAvailableWidth();

                    // -- En-têtes --
                    string[] headers = { "Description", "Qté", "Prix U.", "Total" };
                    foreach (var h in headers)
                    {
                        table.AddHeaderCell(new Cell().Add(new Paragraph(h).SetFont(_boldFont).SetFontSize(10).SetFontColor(ColorConstants.WHITE))
                            .SetBackgroundColor(brandColor).SetPadding(8).SetBorder(Border.NO_BORDER));
                    }

                    // -- Calculs --
                    decimal price = job.Price ?? 0;
                    decimal ht = Math.Round(price * 0.8333m, 2); // HT (approx 20% TVA)
                    decimal tva = price - ht;

                    // -- Ligne du service --
                    table.AddCell(new Cell().Add(new Paragraph(job.ServiceName).SetFont(_boldFont).SetFontSize(10))
                        .Add(new Paragraph(job.Description ?? "").SetFontSize(8).SetFontColor(darkGray))
                        .SetPadding(10).SetBorderBottom(new SolidBorder(lightGray, 1)));

                    table.AddCell(new Cell().Add(new Paragraph("1")).SetPadding(10).SetTextAlignment(TextAlignment.CENTER).SetBorderBottom(new SolidBorder(lightGray, 1)));
                    table.AddCell(new Cell().Add(new Paragraph($"{price:F2}")).SetPadding(10).SetTextAlignment(TextAlignment.RIGHT).SetBorderBottom(new SolidBorder(lightGray, 1)));
                    table.AddCell(new Cell().Add(new Paragraph($"{price:F2}")).SetPadding(10).SetTextAlignment(TextAlignment.RIGHT).SetFont(_boldFont).SetBorderBottom(new SolidBorder(lightGray, 1)));

                    doc.Add(table);

                    // 4. TOTAUX
                    var totalTable = new Table(new float[] { 3, 1 }).UseAllAvailableWidth().SetMarginTop(10);

                    void AddTotalRow(string label, string val, bool isBold = false, bool isColor = false)
                    {
                        totalTable.AddCell(new Cell().Add(new Paragraph(label).SetTextAlignment(TextAlignment.RIGHT).SetFontSize(10).SetFont(isBold ? _boldFont : _regularFont)).SetBorder(Border.NO_BORDER));
                        totalTable.AddCell(new Cell().Add(new Paragraph(val + " MAD").SetTextAlignment(TextAlignment.RIGHT).SetFontSize(10).SetFont(isBold ? _boldFont : _regularFont).SetFontColor(isColor ? brandColor : ColorConstants.BLACK)).SetBorder(Border.NO_BORDER));
                    }

                    AddTotalRow("Total HT", $"{ht:F2}");
                    AddTotalRow("TVA (20%)", $"{tva:F2}");

                    // Espace
                    totalTable.AddCell(new Cell().SetHeight(10).SetBorder(Border.NO_BORDER));
                    totalTable.AddCell(new Cell().SetHeight(10).SetBorder(Border.NO_BORDER));

                    // Total Final
                    totalTable.AddCell(new Cell().Add(new Paragraph("NET À PAYER").SetFontSize(14).SetFont(_boldFont).SetTextAlignment(TextAlignment.RIGHT)).SetBorder(Border.NO_BORDER));
                    totalTable.AddCell(new Cell().Add(new Paragraph($"{price:F2} MAD").SetFontSize(14).SetFont(_boldFont).SetFontColor(brandColor).SetTextAlignment(TextAlignment.RIGHT)).SetBorder(Border.NO_BORDER));

                    doc.Add(totalTable);

                    // 5. FOOTER
                    doc.Add(new Paragraph("\n\n"));
                    doc.Add(new Paragraph("Merci pour votre confiance !")
                        .SetTextAlignment(TextAlignment.CENTER).SetFont(_boldFont).SetFontSize(12).SetFontColor(darkGray));

                    doc.Add(new Paragraph("OnDemandApp S.A.R.L - Généré automatiquement le " + DateTime.Now.ToString("dd/MM/yyyy HH:mm"))
                        .SetTextAlignment(TextAlignment.CENTER).SetFontSize(8).SetFontColor(ColorConstants.GRAY).SetMarginTop(5));

                    doc.Close();
                    pdfBytes = ms.ToArray();
                }

                return File(pdfBytes, "application/pdf", $"Facture-{job.Id.ToString().Substring(0, 8)}.pdf");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"PDF ERROR: {ex.Message}");
                return StatusCode(500, new { error = "Erreur PDF", details = ex.Message });
            }
        }
        public record ReviewDto(int Rating, string Comment);

        [HttpPost("{id}/review")]
        public async Task<IActionResult> AddReview([FromRoute] Guid id, [FromBody] ReviewDto dto)
        {
            var userId = GetUserId();

            var job = await _db.Jobs
                .Include(j => j.Provider)
                .FirstOrDefaultAsync(j => j.Id == id && j.ClientId == userId);

            if (job == null) return NotFound("Commande introuvable.");

         
            if (job.Status != JobStatus.Completed)
                return BadRequest("Vous ne pouvez noter qu'une mission terminée.");

            if (job.Rating != null)
                return BadRequest("Vous avez déjà noté cette mission.");

            if (dto.Rating < 1 || dto.Rating > 5)
                return BadRequest("La note doit être entre 1 et 5.");

       
            job.Rating = dto.Rating;
            job.ReviewComment = dto.Comment;

          
            if (job.Provider != null)
            {
                await _db.SaveChangesAsync(); 

                var ratings = await _db.Jobs
                    .Where(j => j.ProviderId == job.ProviderId && j.Rating != null)
                    .Select(j => (double)j.Rating.Value)
                    .ToListAsync();

                if (ratings.Any())
                {
                    
                    job.Provider.Rating = (decimal)Math.Round(ratings.Average(), 2);
                }
            }

            await _db.SaveChangesAsync();
            return Ok(new { message = "Merci pour votre avis !" });
        }


        [HttpGet("my")]
        public async Task<IActionResult> GetMyOrders()
        {
            var userId = GetUserId();

            var list = await _db.Jobs.AsNoTracking()
                .Include(j => j.Provider)
                .Include(j => j.Service)
                .Where(j => j.ClientId == userId)
                .OrderByDescending(j => j.CreatedAt)
                .Select(j => new
                {
                    j.Id,
                    Status = j.Status.ToString(),
                    StatusCode = (int)j.Status,
                    j.Price,
                    j.CreatedAt,
                    ServiceName = j.Service.Title,
                    ProviderName = j.Provider != null ? j.Provider.FullName : "En attente...",
                    HasReview = j.Rating != null,
                    MyRating = j.Rating
                })
                .ToListAsync();

            return Ok(list);
        }

        

        [HttpGet("search")]
        public async Task<IActionResult> SearchProviders([FromQuery] Guid serviceId)
        {
            var service = await _db.Services.AsNoTracking().FirstOrDefaultAsync(s => s.Id == serviceId);
            if (service == null) return BadRequest("Service introuvable");

            var catalogItem = await _db.ServiceItems.AsNoTracking().FirstOrDefaultAsync(i => i.Name == service.Title);
            if (catalogItem == null) return Ok(new List<object>());

            var providers = await _db.ProviderServices.AsNoTracking()
                .Include(ps => ps.ProviderProfile).ThenInclude(pp => pp.User)
                .Where(ps => ps.ServiceItemId == catalogItem.Id && ps.IsActive && ps.ProviderProfile.IsAvailable)
                .Select(ps => new {
                    ProviderId = ps.ProviderProfile.UserId,
                    Name = ps.ProviderProfile.User.FullName,
                    BasePrice = ps.BasePrice,
                    Rating = ps.ProviderProfile.User.Rating,
                    DistanceKm = 3.5
                })
                .ToListAsync();

            return Ok(providers);
        }

        [HttpPost]
        public async Task<IActionResult> CreateOrder([FromBody] CreateOrderDto dto)
        {
            var clientId = GetUserId();
            var service = await _db.Services.FindAsync(dto.ServiceId);
            if (service == null) return BadRequest("Service invalide.");

            var job = new Job
            {
                Id = Guid.NewGuid(),
                ServiceId = service.Id,
                ClientId = clientId,
                ProviderId = dto.ProviderId,
                Price = dto.Price,
                Description = "Négocié",
                Status = JobStatus.Pending,
                Address = dto.Address,
                Lat = dto.Lat,
                Lng = dto.Lng,
                CreatedAt = DateTime.UtcNow
            };

            _db.Jobs.Add(job);
            await _db.SaveChangesAsync();

            if (_hubContext != null)
            {
                await _hubContext.Clients.User(dto.ProviderId.ToString()).SendAsync("JobAssigned", new { jobId = job.Id, price = job.Price, isNegotiated = true });
            }

            return Ok(new { jobId = job.Id });
        }

        [HttpPost("{id}/respond")]
        public async Task<IActionResult> Respond([FromRoute] Guid id, [FromBody] RespondDto dto)
        {
            var userId = GetUserId();
            var job = await _db.Jobs.FirstOrDefaultAsync(j => j.Id == id && j.ProviderId == userId);
            if (job == null) return NotFound();

            if (dto.Accepted)
            {
                job.Status = JobStatus.Assigned;
                if (_hubContext != null)
                    await _hubContext.Clients.User(job.ClientId.ToString()).SendAsync("JobAccepted", job.Id);
            }
            else
            {
                job.Status = JobStatus.Rejected;
                job.ProviderId = null;
            }

            await _db.SaveChangesAsync();
            return Ok();
        }

        [HttpPost("{id}/status")]
        public async Task<IActionResult> UpdateStatus([FromRoute] Guid id, [FromBody] UpdateStatusDto dto)
        {
            var userId = GetUserId();
            var job = await _db.Jobs.Include(j => j.Client).FirstOrDefaultAsync(j => j.Id == id);

            if (job == null) return NotFound("Job introuvable");
            if (job.ProviderId != userId) return Forbid(); 

        
            switch (dto.Status)
            {
                case "in_progress":
                    
                    if (job.Status != JobStatus.Confirmed)
                        return BadRequest("Le client n'a pas encore validé/payé.");
                    job.Status = JobStatus.InProgress;


                    await CreateNotification(job.ClientId, "Le prestataire est en route !", "warning", job.Id);
                    break;

                case "completed":
                    if (job.Status != JobStatus.InProgress)
                        return BadRequest("Mission non démarrée.");
                    job.Status = JobStatus.Completed;

                  
                    await CreateNotification(job.ClientId, "Mission terminée. Merci !", "success", job.Id);
                    break;
            }

            await _db.SaveChangesAsync();

            if (_hubContext != null)
                await _hubContext.Clients.User(job.ClientId.ToString()).SendAsync("StatusChanged", new { status = dto.Status });

            return Ok(new { status = job.Status.ToString(), statusCode = (int)job.Status });
        }

        [HttpGet("provider-history")]
        public async Task<IActionResult> GetProviderHistory()
        {
            var userId = GetUserId();
            var list = await _db.Jobs.AsNoTracking()
                .Include(j => j.Client).Include(j => j.Service)
                .Where(j => j.ProviderId == userId)
                .OrderByDescending(j => j.CreatedAt)
                .Select(j => new { j.Id, Status = j.Status.ToString(), StatusCode = (int)j.Status, j.Price, j.CreatedAt, ServiceName = j.Service.Title, ClientName = j.Client.FullName })
                .ToListAsync();
            return Ok(list);
        }


        [HttpPost("{id}/location")]
        public async Task<IActionResult> UpdateLocation(Guid id, [FromBody] LocationDto dto)
        {
            var userId = GetUserId();

            var job = await _db.Jobs.FindAsync(id);
            if (job == null) return NotFound();

        
            if (job.Status != JobStatus.Confirmed && job.Status != JobStatus.InProgress)
            {
                return BadRequest("Le tracking n'est pas actif pour ce statut de commande (Paiement requis).");
            }

          
            var ping = new LocationPing
            {
                Id = Guid.NewGuid(),
                JobId = id,
                UserId = userId,
                Lat = dto.Lat,
                Lng = dto.Lng,
                CreatedAt = DateTime.UtcNow
            };
            _db.LocationPings.Add(ping);

         
            job.CurrentLat = dto.Lat;
            job.CurrentLng = dto.Lng;

            await _db.SaveChangesAsync();

           
            var targetUserId = (userId == job.ProviderId) ? job.ClientId : job.ProviderId;

            if (targetUserId.HasValue)
            {
                await _hubContext.Clients.User(targetUserId.Value.ToString())
                    .SendAsync("ReceiveLocation", new { jobId = id, lat = dto.Lat, lng = dto.Lng });
            }

            return Ok();
        }

        private async Task CreateNotification(Guid userId, string msg, string type, Guid refId)
        {
            var n = new Notification
            {
                UserId = userId,
                Message = msg,
                Type = type,
                ReferenceId = refId.ToString(),
                CreatedAt = DateTime.UtcNow,
                IsRead = false
            };
            _db.Notifications.Add(n);
          
        }
    }

    public class LocationDto { public decimal Lat { get; set; } public decimal Lng { get; set; } }
    public class SendMessageDto { public string Content { get; set; } }
    public class UpdateStatusDto { public string Status { get; set; } = string.Empty; }
    public class CreateOrderDto { public Guid ServiceId { get; set; } public Guid ProviderId { get; set; } public decimal Price { get; set; } public string Address { get; set; } = string.Empty; public decimal Lat { get; set; } public decimal Lng { get; set; } }
    public class RespondDto { public bool Accepted { get; set; } }
}