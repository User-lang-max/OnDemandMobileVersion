using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace OnDemandApp.Api.Hubs
{
    [Authorize]
    public class NotificationHub : Hub
    {
        public async Task JoinJobGroup(string jobId)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, jobId);
        }

        public async Task SendMessageToJob(string jobId, string message, string senderName, string senderId)
        {
            await Clients.Group(jobId).SendAsync("ReceiveMessage", new
            {
                senderName,
                content = message,
                senderId,
                sentAt = DateTime.UtcNow
            });
        }

        public async Task SendLocation(string jobId, double lat, double lng)
        {
            await Clients.Group(jobId).SendAsync("ReceiveLocation", new { lat, lng });
        }
    }
}