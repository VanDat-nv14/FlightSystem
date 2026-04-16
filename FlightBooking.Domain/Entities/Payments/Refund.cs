using FlightBooking.Domain.Common;
using FlightBooking.Domain.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FlightBooking.Domain.Entities.Payments
{
    public class Refund : BaseEntity
    {
        public int PaymentId { get; set; }
        public Payment? Payment { get; set; }

        public decimal Amount { get; set; }
        public RefundReason Reason { get; set; }
        public RefundStatus Status { get; set; } = RefundStatus.Pending;
        public DateTime RequestedAt { get; set; } = DateTime.UtcNow;
        public DateTime? ProcessedAt { get; set; }
    }
}
