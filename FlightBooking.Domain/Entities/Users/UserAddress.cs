using FlightBooking.Domain.Common;
using FlightBooking.Domain.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FlightBooking.Domain.Entities.Users
{
    public class UserAddress : BaseEntity
    {
        public int UserId { get; set; }
        public ApplicationUser? User { get; set; }
        public AddressType AddressType { get; set; }
        public string? Label { get; set; }
        public string FullAddress { get; set; } = string.Empty;
        public string? Ward { get; set; }
        public string? District { get; set; }
        public string City { get; set; } = string.Empty;
        public string Country { get; set; } = string.Empty; 
        public string? PostalCode { get; set; }
        public bool IsDefault { get; set; } = false;
    }
}
