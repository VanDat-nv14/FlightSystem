using FlightBooking.Domain.Common;
using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FlightBooking.Domain.Entities.Flights
{
    public class Airport : BaseEntity
    {
        public string Code { get; set; } = string.Empty; // IATA Code
        public string Name { get; set; } = string.Empty;
        public string City { get; set; } = string.Empty;
        public string Country { get; set; } = string.Empty;

        // Navigation Properties
        // Một sân bay có thể là điểm đi hoặc điểm đến của nhiều tuyến bay (Route)
        public ICollection<Route>? DepartureRoutes { get; set; }
        public ICollection<Route>? ArrivalRoutes { get; set; }
    }
}
