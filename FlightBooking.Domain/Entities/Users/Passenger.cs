using FlightBooking.Domain.Common;
using FlightBooking.Domain.Entities.Bookings;
using FlightBooking.Domain.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FlightBooking.Domain.Entities.Users
{
    public class Passenger : BaseEntity
    {
        public int UserId { get; set; }
        public ApplicationUser? User { get; set; }
        public required string Title { get; set; } // Mr, Mrs, Ms
        public required string FirstName { get; set; }
        public required string LastName { get; set; }
        public string? FullName => $"{FirstName} {LastName}";
        public required string PassportNumber { get; set; }
        public DateTime? PassportExpiryDate { get; set; }
        public required string Nationality { get; set; }
        public DateTime DateOfBirth { get; set; }
        public Gender Gender { get; set; }

        public ICollection<Ticket> Tickets { get; set; } = new List<Ticket>();
    } 
}
