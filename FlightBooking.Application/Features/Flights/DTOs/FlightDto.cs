using FlightBooking.Domain.Enums;

namespace FlightBooking.Application.Features.Flights.DTOs
{
    public class FlightDto
    {
        public int Id { get; set; }
        public string FlightNumber { get; set; } = string.Empty;
        public int RouteId { get; set; }
        public string OriginCode { get; set; } = string.Empty;
        public string DestinationCode { get; set; } = string.Empty;
        public int AircraftId { get; set; }
        public string AircraftModel { get; set; } = string.Empty;
        public DateTime DepartureTime { get; set; }
        public DateTime ArrivalTime { get; set; }
        public string Status { get; set; } = string.Empty;
        public decimal BasePrice { get; set; }
        public int AvailableSeats { get; set; }
    }

    public class CreateFlightRequest
    {
        public string FlightNumber { get; set; } = string.Empty;
        public int RouteId { get; set; }
        public int AircraftId { get; set; }
        public DateTime DepartureTime { get; set; }
        public DateTime ArrivalTime { get; set; }
        public decimal BasePrice { get; set; }
    }

    public class UpdateFlightRequest
    {
        public DateTime DepartureTime { get; set; }
        public DateTime ArrivalTime { get; set; }
        public decimal BasePrice { get; set; }
        public string Status { get; set; } = string.Empty;
    }

    public class SearchFlightRequest
    {
        public int OriginAirportId { get; set; }
        public int DestinationAirportId { get; set; }
        public DateTime DepartureDate { get; set; }
        public int PassengerCount { get; set; } = 1;
    }
}
