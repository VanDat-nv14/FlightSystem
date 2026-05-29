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
        public int StopCount { get; set; }
        public string? StopoverCodes { get; set; }
        public decimal BasePrice { get; set; }
        public int AvailableSeats { get; set; }

        // Airline info
        public string AirlineCode { get; set; } = string.Empty;
        public string AirlineName { get; set; } = string.Empty;
        public string AirlineLogo { get; set; } = string.Empty;
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

    public class FlightScheduleDto
    {
        public int Id { get; set; }
        public string FlightNumber { get; set; } = string.Empty;
        public string DaysOfWeek { get; set; } = string.Empty;
        public DateTime StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public int RouteId { get; set; }
        public string OriginCode { get; set; } = string.Empty;
        public string DestinationCode { get; set; } = string.Empty;
        public int AircraftId { get; set; }
        public string AircraftModel { get; set; } = string.Empty;
        public string DepartureTime { get; set; } = string.Empty; // "HH:mm"
        public string ArrivalTime { get; set; } = string.Empty;   // "HH:mm"
        public decimal BasePrice { get; set; }
        public bool IsActive { get; set; }
        public int? AirlineId { get; set; }
        public string AirlineName { get; set; } = string.Empty;
        public int FlightsGenerated { get; set; }
    }

    public class CreateFlightScheduleRequest
    {
        public string FlightNumber { get; set; } = string.Empty;
        public string DaysOfWeek { get; set; } = string.Empty;
        public DateTime StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public int RouteId { get; set; }
        public int AircraftId { get; set; }
        public string DepartureTime { get; set; } = string.Empty; // "HH:mm"
        public string ArrivalTime { get; set; } = string.Empty;   // "HH:mm"
        public decimal BasePrice { get; set; }
    }

    public class UpdateFlightScheduleRequest
    {
        public string DaysOfWeek { get; set; } = string.Empty;
        public DateTime StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public int RouteId { get; set; }
        public int AircraftId { get; set; }
        public string DepartureTime { get; set; } = string.Empty; // "HH:mm"
        public string ArrivalTime { get; set; } = string.Empty;   // "HH:mm"
        public decimal BasePrice { get; set; }
        public bool IsActive { get; set; }
    }

    public class UpdateFlightStatusRequest
    {
        public string Status { get; set; } = string.Empty;
        public string? DelayReason { get; set; }
    }
}
