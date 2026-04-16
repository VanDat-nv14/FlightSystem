using FlightBooking.Domain.Common;
using FlightBooking.Domain.Entities.Users;
using FlightBooking.Domain.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FlightBooking.Domain.Entities.Users
{
    public class UserLoginHistory: BaseEntity
    {
        public int UserId { get; set; }
        public ApplicationUser? User { get; set; }
        public string Email { get; set; } = string.Empty;
        public DateTime LoginAt { get; set; } = DateTime.Now;
        public string? IpAddress { get; set; }
        public string? DeviceInfo { get; set; }
        public LoginStatus? Status { get; set; }
        public string? FailReason { get; set; }
    }
}
