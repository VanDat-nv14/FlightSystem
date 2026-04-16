using FlightBooking.Domain.Common;
using FlightBooking.Domain.Entities.Bookings;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FlightBooking.Domain.Entities.Cancellations
{
    public class BookingCancellation : BaseEntity
    {
        public int BookingId { get; set; }
        public Booking? Booking { get; set; }

        public DateTime CancelledAt { get; set; }
        public string Reason { get; set; } = string.Empty;
        public decimal RefundAmount { get; set; }
    }
}
