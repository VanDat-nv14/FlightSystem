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
    public class UserPaymentMethod : BaseEntity
    {
        public PaymentMethod Method { get; set; }
        public string DisplayName { get; set; } = string.Empty;
        public string? CardLastFour { get; set; }
        public string? CardBrand { get; set; }
        public string? CardHolderName { get; set; }
        public int? CardExpiryMonth { get; set; }
        public int? CardExpiryYear { get; set; }
        public string? BankName { get; set; }
        public string? AccountNumber { get; set; }
        public string? GatewayToken { get; set; }
        public bool IsDefault { get; set; } = false;
    }
}
