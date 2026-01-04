namespace OnDemandApp.Core.Entities;

public enum UserRole
{
    client,
    provider,
    admin
}

public enum UserStatus
{
    pending,
    active,
    suspended,
    banned
}


public enum PaymentStatus
{
    pending,
    authorized,
    captured,
    refunded,
    failed
}