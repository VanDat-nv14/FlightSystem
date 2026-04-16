using FlightBooking.Domain.Common;
using FlightBooking.Domain.Entities.Bookings;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FlightBooking.Domain.Entities.Loyalty
{
    public class MileageTransaction : BaseEntity
    {
        public int LoyaltyAccountId { get; set; }
        public LoyaltyAccount? LoyaltyAccount { get; set; }

        public int? BookingId { get; set; }
        public Booking? Booking { get; set; }

        public int Miles { get; set; }   // âm khi dùng dặm (Redeemed)
        public string Type { get; set; } = string.Empty;  // Earned / Redeemed / Expired
        public DateTime TransactionDate { get; set; } = DateTime.UtcNow;
    }
}
