using FlightBooking.Domain.Common;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FlightBooking.Domain.Entities.Flights
{
    public class Airline   : BaseEntity
    {
        public string Code { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string? LogoUrl { get; set; }
        public string? Country { get; set; }

        public bool IsActive { get; set; }

        // Navigation Properties
        public ICollection<Aircraft>? Aircrafts { get; set; }
    }
}
