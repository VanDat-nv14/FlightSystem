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
    public class UserPreferences : BaseEntity
    {
        public int UserId { get; set; }
        public ApplicationUser? User { get; set; }

        public string Language { get; set; } = "vi";
        public Currency Currency { get; set; } = Currency.VND;
        public string Timezone { get; set; } = "Asia/Ho_Chi_Minh";
        public bool EmailNotification { get; set; } = true;
        public bool SmsNotification { get; set; } = true;
        public bool PushNotification { get; set; } = true;
        public bool MarketingEmails { get; set; } = false;
    }
}
