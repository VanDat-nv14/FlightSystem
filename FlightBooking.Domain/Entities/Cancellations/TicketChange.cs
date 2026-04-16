using FlightBooking.Domain.Common;
using FlightBooking.Domain.Entities.Bookings;
using FlightBooking.Domain.Entities.Seats;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FlightBooking.Domain.Entities.Cancellations
{
    public class TicketChange : BaseEntity
    {
        public int OriginalTicketId { get; set; }
        public Ticket? OriginalTicket { get; set; }

        public int NewFlightSeatId { get; set; }
        public FlightSeat? NewFlightSeat { get; set; }

        public DateTime ChangedAt { get; set; }
        public decimal ChangeFee { get; set; }
        public decimal PriceDifference { get; set; }
    }
}
