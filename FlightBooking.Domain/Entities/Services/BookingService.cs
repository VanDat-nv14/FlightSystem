using FlightBooking.Domain.Common;
using FlightBooking.Domain.Entities.Bookings;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FlightBooking.Domain.Entities.Services
{
    public class BookingService : BaseEntity
    {
        public int BookingId { get; set; }
        public Booking? Booking { get; set; }

        public int AdditionalServiceId { get; set; }
        public AdditionalService? AdditionalService { get; set; }

        public int? PassengerId { get; set; } // Optional: Link to a specific passenger if needed
        public decimal PriceAtBooking { get; set; }
    }
}
