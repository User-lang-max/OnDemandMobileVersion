// Payment.cs (corrigé)
using System;
namespace OnDemandApp.Core.Entities;

public class Payment : BaseEntity
{
    public Guid JobId { get; set; }
    public Job Job { get; set; } = default!;

    public decimal Amount { get; set; }
    public string Currency { get; set; } = "MAD";
    public PaymentStatus Status { get; set; } = PaymentStatus.pending;

    public string? PSPProvider { get; set; }  
    public string? PSPPaymentId { get; set; }
}
