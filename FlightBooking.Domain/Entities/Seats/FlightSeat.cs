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
    public class FlightSeat : BaseEntity
    {
        public int FlightId { get; set; }
        public Flight? Flight { get; set; }

        public required string SeatNumber { get; set; }
        public SeatClassType ClassType { get; set; }
        public decimal Price { get; set; }


        public SeatStatus Status { get; set; } = SeatStatus.Available;

        // Concurrency Token để tránh double booking (Nhiều người mua cùng 1 ghế)
        public byte[]? RowVersion { get; set; }
    }
}
