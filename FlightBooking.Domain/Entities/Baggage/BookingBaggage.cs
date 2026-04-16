using FlightBooking.Domain.Common;
using FlightBooking.Domain.Entities.Bookings;
using FlightBooking.Domain.Entities.Users;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FlightBooking.Domain.Entities.Baggage
{
    public class BookingBaggage : BaseEntity
    {
        public  int BookingId { get; set; }
        public Booking? Booking { get; set; }
        public int PassengerId { get; set; }
        public Passenger? Passenger { get; set; }
        public decimal Weight { get; set; }
        public decimal ExtraFee { get; set; }
    }
}
