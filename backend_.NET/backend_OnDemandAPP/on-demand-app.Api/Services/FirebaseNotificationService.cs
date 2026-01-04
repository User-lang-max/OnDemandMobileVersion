using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using FirebaseAdmin.Messaging;
using Microsoft.EntityFrameworkCore;
using OnDemandApp.Infrastructure.Data;

namespace OnDemandApp.Api.Services;

public class FirebaseNotificationService
{
    private readonly AppDbContext _db;

    public FirebaseNotificationService(AppDbContext db)
    {
        _db = db;
    }

    public async Task SendToUserAsync(Guid userId, string title, string body, Dictionary<string, string>? data = null)
    {
        var tokens = await _db.NotificationTokens
            .Where(t => t.UserId == userId)
            .Select(t => t.Token)
            .ToListAsync();

        if (!tokens.Any()) return;

        var message = new MulticastMessage
        {
            Tokens = tokens,
            Notification = new Notification
            {
                Title = title,
                Body = body
            },
            Data = data ?? new Dictionary<string, string>()
        };

        await FirebaseMessaging.DefaultInstance.SendMulticastAsync(message);
    }
}
