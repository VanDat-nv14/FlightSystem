using FlightBooking.Domain.Common;
using FlightBooking.Domain.Entities.Users;
using FlightBooking.Domain.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FlightBooking.Domain.Entities.Logs
{
    public class NotificationLog : BaseEntity
    {
        public int UserId { get; set; }
        public ApplicationUser? User { get; set; }
        public NotificationType Type { get; set; }
        public string Subject { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
        public DateTime SentAt { get; set; }
        public bool IsRead { get; set; } = false;
    }
}
