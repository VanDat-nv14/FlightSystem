using FlightBooking.Domain.Entities.Bookings;
using FlightBooking.Domain.Entities.Loyalty;
using FlightBooking.Domain.Entities.Users;
using FlightBooking.Domain.Enums;
using Microsoft.AspNetCore.Identity;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FlightBooking.Domain.Entities.Users
{
    public class ApplicationUser : IdentityUser<int>
    {
        public string? FullName { get; set; } = string.Empty;
        public UserRole Role { get; set; } = UserRole.Customer;
        public DateTime CreateAt { get; set; } = DateTime.Now;
        public DateTime? UpdatedAt { get; set; }
        public int? AirlineId { get; set; }

        // Navigation properties
        public UserProfile? UserProfile { get; set; }
        public UserPreferences? UserPreferences { get; set; }
        public LoyaltyAccount? LoyaltyAccount { get; set; }
        public FlightBooking.Domain.Entities.Flights.Airline? Airline { get; set; }

        public ICollection<Booking> Bookings { get; set; } = new List<Booking>();
        public ICollection<Passenger> Passengers { get; set; } = new List<Passenger>();
        public ICollection<UserAddress> UserAddresses { get; set; } = new List<UserAddress>();
        public ICollection<UserSession> UserSessions { get; set; } = new List<UserSession>();
        public ICollection<UserLoginHistory> UserLoginHistories { get; set; } = new List<UserLoginHistory>();
        public ICollection<SavedPassenger> SavedPassengers { get; set; } = new List<SavedPassenger>();
        public ICollection<UserPaymentMethod> UserPaymentMethods { get; set; } = new List<UserPaymentMethod>();
    }
}
