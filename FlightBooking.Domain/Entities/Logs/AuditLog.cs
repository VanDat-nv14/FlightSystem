using FlightBooking.Domain.Common;
using FlightBooking.Domain.Entities.Users;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FlightBooking.Domain.Entities.Logs
{
    public class AuditLog : BaseEntity
    {
        public int? UserId { get; set; }
        public ApplicationUser? User { get; set; }

        public string Action { get; set; } = string.Empty;
        public string EntityName { get; set; } = string.Empty;
        public int EntityId { get; set; }
        public string? OldValues { get; set; }   // JSON string
        public string? NewValues { get; set; }   // JSON string
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    }
}
