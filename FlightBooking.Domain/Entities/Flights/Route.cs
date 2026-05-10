using FlightBooking.Domain.Common;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FlightBooking.Domain.Entities.Flights
{
    public class Route : BaseEntity
    {
        public int OriginAirportId { get; set; }
        public Airport? OriginAirport { get; set; }

        public int DestinationAirportId { get; set; }
        public Airport? DestinationAirport { get; set; }

        public TimeSpan Duration { get; set; }

        public string DistanceKm { get; set; } = string.Empty;

        public bool IsActive { get; set; }

        public int EstimatedDurationMinutes { get; set; }
        // Tạm thời comment lại nếu bạn chưa viết Entity Flight
        public ICollection<Flight> Flights { get; set; } = new List<Flight>();
    }
}
