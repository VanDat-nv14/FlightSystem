namespace FlightBooking.Application.Features.Flights.DTOs
{
    public class RouteDto
    {
        public int Id { get; set; }
        public int OriginAirportId { get; set; }
        public string OriginCode { get; set; } = string.Empty;
        public string OriginCity { get; set; } = string.Empty;
        public int DestinationAirportId { get; set; }
        public string DestinationCode { get; set; } = string.Empty;
        public string DestinationCity { get; set; } = string.Empty;
        public string DistanceKm { get; set; } = string.Empty;
        public int EstimatedDurationMinutes { get; set; }
        public bool IsActive { get; set; }
    }
    public class CreateRouteRequest
    {
        public int OriginAirportId { get; set; }
        public int DestinationAirportId { get; set; }
        public string DistanceKm { get; set; } = string.Empty;
        public int EstimatedDurationMinutes { get; set; }
    }
    public class UpdateRouteRequest
    {
        public string DistanceKm { get; set; } = string.Empty;
        public int EstimatedDurationMinutes { get; set; }
        public bool IsActive { get; set; }
    }
}