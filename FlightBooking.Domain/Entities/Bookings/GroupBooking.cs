using FlightBooking.Domain.Common;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FlightBooking.Domain.Entities.Bookings
{
    public class GroupBooking : BaseEntity
    {
        public string GroupName { get; set; } = string.Empty;
        public string ContactPerson { get; set; } = string.Empty;
        public string ContactEmail { get; set; } = string.Empty;
        public int TotalPassengers { get; set; }
        public decimal DiscountPercentage { get; set; }

        public ICollection<Booking> Bookings { get; set; } = new List<Booking>();
    }
}
