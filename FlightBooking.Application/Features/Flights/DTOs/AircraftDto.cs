using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FlightBooking.Application.Features.Flights.DTOs
{
    public class AircraftDto
    {
        public int Id { get; set; }
        public string RegistrationNumber { get; set; } = string.Empty;
        public string Model { get; set; } = string.Empty;
        public int TotalSeats { get; set; }
        public int AirlineId { get; set; }
        public string AirlineName { get; set; } = string.Empty;
        public bool IsActive { get; set; }
    }
    public class CreateAircraftRequest
    {
        public string RegistrationNumber { get; set; } = string.Empty;
        public string Model { get; set; } = string.Empty;
        public int TotalSeats { get; set; }
        public int AirlineId { get; set; }
    }
    public class UpdateAircraftRequest
    {
        public string Model { get; set; } = string.Empty;
        public int TotalSeats { get; set; }
        public bool IsActive { get; set; }
    }
}