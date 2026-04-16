using FlightBooking.Domain.Common;
using FlightBooking.Domain.Entities.Seats;
using FlightBooking.Domain.Entities.Users;
using FlightBooking.Domain.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FlightBooking.Domain.Entities.Bookings
{
    public class Ticket : BaseEntity    
    {
        public int BookingId { get; set; }
        public Booking? Booking { get; set; }

        public int FlightSeatId { get; set; }
        public FlightSeat? FlightSeat { get; set; }

        public int PassengerId { get; set; }
        public Passenger? Passenger { get; set; }

        public CheckInStatus CheckInStatus { get; set; } = CheckInStatus.NotCheckedIn;
        public DateTime? CheckInTime { get; set; }
        public string? BoardingPass { get; set; }
    }
}
