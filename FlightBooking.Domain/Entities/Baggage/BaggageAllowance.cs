using FlightBooking.Domain.Common;
using FlightBooking.Domain.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FlightBooking.Domain.Entities.Baggage
{
    public class BaggageAllowance : BaseEntity  
    {
        public SeatClassType ClassType { get; set; }
        public int MaxWeight { get; set; }   // kg
        public int MaxPieces { get; set; }
        public decimal AdditionalFee { get; set; }  // phí/kg vượt cân
    }
}
