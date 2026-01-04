using System;

namespace OnDemandApp.Core.Entities
{
    public enum PaymentMethod
    {
        Stripe = 0,
        PayPal = 1,
        Cash = 2,
        BankTransfer = 3
    }
}
