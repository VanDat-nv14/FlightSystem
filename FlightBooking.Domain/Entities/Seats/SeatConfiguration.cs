using FlightBooking.Domain.Common;
using FlightBooking.Domain.Entities.Flights;
using FlightBooking.Domain.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FlightBooking.Domain.Entities.Seats
{
    public class SeatConfiguration : BaseEntity
    {
        public int AircraftId { get; set; }
        public Aircraft? Aircraft { get; set; }

        public required string SeatNumber { get; set; }
        public decimal PriceMultiplier { get; set; } // Hệ số giá vé, có thể dùng để tính giá vé dựa trên loại ghế
        public SeatClassType ClassType { get; set; }
        public SeatPosition Position { get; set; }
    }
}
