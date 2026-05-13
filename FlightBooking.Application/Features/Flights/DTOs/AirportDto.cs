using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FlightBooking.Application.Features.Flights.DTOs
{
    public class AirportDto
    {
        public int Id { get; set; }
        public string Code { get; set; } = string.Empty; // IATA Code
        public string Name { get; set; } = string.Empty;

        public string City { get; set; } = string.Empty;
        public string Country { get; set; } = string.Empty;
        public string? Terminal { get; set; }
        public string? Timezone { get; set; }
    }
    public class CreateAirportRequest
    {
        public string Code { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string City { get; set; } = string.Empty;
        public string Country { get; set; } = string.Empty;
        public string? Terminal { get; set; }
        public string? Timezone { get; set; }
    }

    public class UpdateAirportRequest
    {
        public int Id { get; set; }
        public string Code { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string City { get; set; } = string.Empty;
        public string Country { get; set; } = string.Empty;
        public string? Terminal { get; set; }
        public string? Timezone { get; set; }
    }
}
