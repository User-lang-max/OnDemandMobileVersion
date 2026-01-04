using System.Threading;
using System.Threading.Tasks;
using MailKit.Security;
using Microsoft.Extensions.Options;
using MimeKit;

namespace OnDemandApp.Api.Auth;

public class EmailOptions
{
    public bool Enabled { get; set; } = false;          
    public string FromName { get; set; } = default!;
    public string FromAddress { get; set; } = default!;
    public string SmtpHost { get; set; } = default!;
    public int SmtpPort { get; set; }
    public string Username { get; set; } = default!;
    public string Password { get; set; } = default!;
}

public interface IEmailService
{
    Task SendAsync(string to, string subject, string htmlBody, CancellationToken ct = default);
}

public class EmailService : IEmailService
{
    private readonly EmailOptions _opt;
    public EmailService(IOptions<EmailOptions> opt) => _opt = opt.Value;

    public async Task SendAsync(string to, string subject, string htmlBody, CancellationToken ct = default)
    {
        // No-op en DEV
        if (!_opt.Enabled)
        {
            System.Console.WriteLine($"[DEV EMAIL DISABLED] To={to} Subject={subject}\n{htmlBody}");
            return;
        }

        var msg = new MimeMessage();
        msg.From.Add(new MailboxAddress(_opt.FromName, _opt.FromAddress));
        msg.To.Add(MailboxAddress.Parse(to));
        msg.Subject = subject;
        msg.Body = new BodyBuilder { HtmlBody = htmlBody }.ToMessageBody();

        using var client = new MailKit.Net.Smtp.SmtpClient();
        await client.ConnectAsync(_opt.SmtpHost, _opt.SmtpPort, SecureSocketOptions.StartTls, ct);
        await client.AuthenticateAsync(_opt.Username, _opt.Password, ct);
        await client.SendAsync(msg, ct);
        await client.DisconnectAsync(true, ct);
    }
}
