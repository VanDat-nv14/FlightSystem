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
    public class SavedPassenger : BaseEntity
    {
        public int UserId { get; set; }
        public ApplicationUser? User { get; set; }

        public string NickName { get; set; }
        public string FullName { get; set; } = string.Empty;
        public DateTime DateOfBirth { get; set; }
        public Gender Gender { get; set; }
        public string Nationality { get; set; } = string.Empty;
        public string? IdCardNumber { get; set; }
        public string? PassportNumber { get; set; }
        public DateTime? PassportExpiry { get; set; }
        public bool IsDefault { get; set; } = false;

    }
}
