using FlightBooking.Domain.Common;
using FlightBooking.Domain.Entities.Bookings;
using FlightBooking.Domain.Enums;

namespace FlightBooking.Domain.Entities.Payments;

public class Payment : BaseEntity
{
    public int BookingId { get; set; }
    public Booking? Booking { get; set; }

    public decimal Amount { get; set; }
    public Currency Currency { get; set; } = Currency.VND;
    public PaymentMethod Method { get; set; }
    public PaymentStatus Status { get; set; } = PaymentStatus.Pending;
    public string? TransactionId { get; set; }
    public DateTime? PaidAt { get; set; }
    public string? FailureReason { get; set; }

    public ICollection<Refund> Refunds { get; set; } = new List<Refund>();
}