using FlightBooking.Domain.Common;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FlightBooking.Domain.Entities.Cancellations
{
    public class CancellationPolicy: BaseEntity
    {
        public int DaysBefore { get; set; }
        public decimal RefundPercentage { get; set; }
        public decimal FeeAmount { get; set; }
    }
}
