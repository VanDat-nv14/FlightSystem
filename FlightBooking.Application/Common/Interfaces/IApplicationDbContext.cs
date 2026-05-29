using FlightBooking.Domain.Entities.Baggage;
using FlightBooking.Domain.Entities.Bookings;
using FlightBooking.Domain.Entities.Cancellations;
using FlightBooking.Domain.Entities.Flights;
using FlightBooking.Domain.Entities.Logs;
using FlightBooking.Domain.Entities.Loyalty;
using FlightBooking.Domain.Entities.Payments;
using FlightBooking.Domain.Entities.Promotions;
using FlightBooking.Domain.Entities.Seats;
using FlightBooking.Domain.Entities.Services;
using FlightBooking.Domain.Entities.Users;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using System.Threading;
using System.Threading.Tasks;

namespace FlightBooking.Application.Common.Interfaces
{
    public interface IApplicationDbContext
    {
        // ── Flight Management ──────────────────────────────
        DbSet<Airport> Airports { get; }
        DbSet<Airline> Airlines { get; }
        DbSet<Aircraft> Aircrafts { get; }
        DbSet<Route> Routes { get; }
        DbSet<FlightSchedule> FlightSchedules { get; }
        DbSet<Flight> Flights { get; }

        // ── Promotions ─────────────────────────────────────
        DbSet<Promotion> Promotions { get; }

        // ── Seat Management ────────────────────────────────
        DbSet<SeatConfiguration> SeatConfigurations { get; }
        DbSet<FlightSeat> FlightSeats { get; }

        // ── Booking System ─────────────────────────────────
        DbSet<GroupBooking> GroupBookings { get; }
        DbSet<Booking> Bookings { get; }
        DbSet<Ticket> Tickets { get; }

        // ── User Management ────────────────────────────────
        DbSet<ApplicationUser> Users { get; }
        DbSet<Passenger> Passengers { get; }
        DbSet<UserProfile> UserProfiles { get; }
        DbSet<UserAddress> UserAddresses { get; }
        DbSet<UserPreferences> UserPreferences { get; }
        DbSet<UserSession> UserSessions { get; }
        DbSet<UserLoginHistory> UserLoginHistories { get; }
        DbSet<SavedPassenger> SavedPassengers { get; }
        DbSet<FavoriteItem> FavoriteItems { get; }
        DbSet<UserPaymentMethod> UserPaymentMethods { get; }

        // ── Payment System ─────────────────────────────────
        DbSet<Payment> Payments { get; }
        DbSet<Refund> Refunds { get; }

        // ── Baggage ────────────────────────────────────────
        DbSet<BaggageAllowance> BaggageAllowances { get; }
        DbSet<BookingBaggage> BookingBaggages { get; }
        DbSet<BaggageTag> BaggageTags { get; }

        // ── Cancellation & Changes ─────────────────────────
        DbSet<CancellationPolicy> CancellationPolicies { get; }
        DbSet<BookingCancellation> BookingCancellations { get; }
        DbSet<TicketChange> TicketChanges { get; }

        // ── Loyalty Program ────────────────────────────────
        DbSet<LoyaltyAccount> LoyaltyAccounts { get; }
        DbSet<MileageTransaction> MileageTransactions { get; }

        // ── Logs ───────────────────────────────────────────
        DbSet<NotificationLog> NotificationLogs { get; }
        DbSet<AuditLog> AuditLogs { get; }

        // ── Additional Services ────────────────────────────
        DbSet<AdditionalService> AdditionalServices { get; }
        DbSet<BookingService> BookingServices { get; }

        // ── EF Core Specifics for Use Cases ───────────────
        DatabaseFacade Database { get; }
        DbSet<TEntity> Set<TEntity>() where TEntity : class;
        Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
    }
}
