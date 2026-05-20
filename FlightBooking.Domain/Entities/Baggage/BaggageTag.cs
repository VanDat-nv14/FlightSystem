using FlightBooking.Domain.Common;
using FlightBooking.Domain.Entities.Bookings;
using FlightBooking.Domain.Entities.Flights;
using FlightBooking.Domain.Enums;

namespace FlightBooking.Domain.Entities.Baggage;

public class BaggageTag : BaseEntity
{
    public string TagCode { get; set; } = string.Empty;

    public int BookingBaggageId { get; set; }
    public BookingBaggage? BookingBaggage { get; set; }

    public int TicketId { get; set; }
    public Ticket? Ticket { get; set; }

    public int FlightId { get; set; }
    public Flight? Flight { get; set; }

    public BaggageTagStatus Status { get; set; } = BaggageTagStatus.Registered;

    public DateTime? CheckedInAt { get; set; }
    public DateTime? LoadedAt { get; set; }
    public DateTime? ArrivedAt { get; set; }
    public DateTime? ClaimedAt { get; set; }
}
