using FlightBooking.Domain.Common;
using FlightBooking.Domain.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FlightBooking.Domain.Entities.Users
{
    public class UserProfile : BaseEntity
    {
        public int UserId { get; set; }
        public ApplicationUser? User { get; set; }
        public string? UrlAvatar { get; set; } = null;
        public DateTime? DateOfBirth { get; set; }
        public Gender? Gender {get; set; }
        public string? Nationality { get; set; }
        public string? IdCardNumber { get; set; }
        public string? PassportNumber { get; set; }
        public DateTime? PassportExpiry { get; set; }
    }
}
