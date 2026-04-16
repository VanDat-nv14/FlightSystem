using FlightBooking.Domain.Common;
using FlightBooking.Domain.Entities.Users;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FlightBooking.Domain.Entities.Loyalty
{
    public class LoyaltyAccount : BaseEntity
    {
        public int UserId { get; set; }
        public ApplicationUser? User { get; set; }

        public string MembershipNumber { get; set; } = string.Empty;
        public int TotalMiles { get; set; } = 0;
        public string Tier { get; set; } = "Silver";  // Silver / Gold / Platinum

        public ICollection<MileageTransaction> Transactions { get; set; } = new List<MileageTransaction>();
    }
}
