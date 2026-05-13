using FlightBooking.Domain.Enums;

namespace FlightBooking.Application.Features.Flights.DTOs
{
    public class FlightSeatDto
    {
        public int Id { get; set; }
        public int FlightId { get; set; }
        public string SeatNumber { get; set; } = string.Empty;
        public SeatClassType ClassType { get; set; }
        public SeatStatus Status { get; set; }
        public decimal Price { get; set; }
    }
}
