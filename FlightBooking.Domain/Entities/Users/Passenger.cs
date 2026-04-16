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
        public required string FullName { get; set; }
        public required string PassportNumber { get; set; }
        public required string Nationality { get; set; }
        public DateTime DateOfBirth { get; set; }
        public Gender Gender { get; set; }

        public ICollection<Ticket> Tickets { get; set; } = new List<Ticket>();
    } 
}
