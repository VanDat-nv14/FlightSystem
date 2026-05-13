using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FlightBooking.Application.Features.Flights.DTOs
{
    public class AirlineDto
    {
        public int Id { get; set; }
        public string Code { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string? LogoUrl { get; set; }
        public string? Country { get; set; }
        public bool IsActive { get; set; }
        public string Status { get; set; } = string.Empty;
        public int AircraftCount { get; set; }
    }
    public class CreateAirlineRequest
    {
        public string Code { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string? LogoUrl { get; set; }
        public string? Country { get; set; }
    }
    public class UpdateAirlineRequest
    {
        public string Name { get; set; } = string.Empty;
        public string? LogoUrl { get; set; }
        public string? Country { get; set; }
        public bool IsActive { get; set; }
    }

    public class UpdateAirlineStatusRequest
    {
        public string Status { get; set; } = string.Empty; // Approved, Rejected, Suspended, Pending
    }
}
