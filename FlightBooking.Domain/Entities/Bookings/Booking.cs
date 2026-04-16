using FlightBooking.Domain.Common;
using FlightBooking.Domain.Entities.Bookings;
using FlightBooking.Domain.Entities.Users;
using FlightBooking.Domain.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Sockets;
using System.Text;
using System.Threading.Tasks;

namespace FlightBooking.Domain.Entities.Bookings
{
    public class Booking : BaseEntity
    {
        public int UserId { get; set; }
        public ApplicationUser? User { get; set; }

        public int? GroupBookingId { get; set; }
        public GroupBooking? GroupBooking { get; set; }

        public DateTime BookingDate { get; set; } = DateTime.UtcNow;
        public decimal TotalAmount { get; set; }

        public BookingStatus Status { get; set; } = BookingStatus.Pending;
        public BookingType BookingType { get; set; } = BookingType.OneWay;

        // Cho luồng vé khứ hồi
        public int? ReturnBookingId { get; set; }
        public Booking? ReturnBooking { get; set; }

        public ICollection<Ticket> Tickets { get; set; } = new List<Ticket>();
    }
}
