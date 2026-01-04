using System;

namespace OnDemandApp.Api.DTOs;

public record JobNotificationDto(
    Guid JobId,
    Guid ClientId,
    Guid ProviderId
);
