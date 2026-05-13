using FlightBooking.Domain.Entities.Baggage;
using FlightBooking.Domain.Entities.Bookings;
using FlightBooking.Domain.Entities.Cancellations;
using FlightBooking.Domain.Entities.Flights;
using FlightBooking.Domain.Entities.Logs;
using FlightBooking.Domain.Entities.Loyalty;
using FlightBooking.Domain.Entities.Payments;
using FlightBooking.Domain.Entities.Seats;
using FlightBooking.Domain.Entities.Services;
using FlightBooking.Domain.Entities.Users;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace FlightBooking.Infrastructure.Persistence;

public class FlightBookingDbContext
    : IdentityDbContext<ApplicationUser, ApplicationRole, int>
{
    public FlightBookingDbContext(DbContextOptions<FlightBookingDbContext> options)
        : base(options) { }

    // ── Flight Management ──────────────────────────────
    public DbSet<Airport> Airports => Set<Airport>();
    public DbSet<Airline> Airlines => Set<Airline>();
    public DbSet<Aircraft> Aircrafts => Set<Aircraft>();
    public DbSet<Route> Routes => Set<Route>();
    public DbSet<FlightSchedule> FlightSchedules => Set<FlightSchedule>();
    public DbSet<Flight> Flights => Set<Flight>();

    // ── Seat Management ────────────────────────────────
    public DbSet<SeatConfiguration> SeatConfigurations => Set<SeatConfiguration>();
    public DbSet<FlightSeat> FlightSeats => Set<FlightSeat>();

    // ── Booking System ─────────────────────────────────
    public DbSet<GroupBooking> GroupBookings => Set<GroupBooking>();
    public DbSet<Booking> Bookings => Set<Booking>();
    public DbSet<Ticket> Tickets => Set<Ticket>();

    // ── User Management ────────────────────────────────
    public DbSet<Passenger> Passengers => Set<Passenger>();
    public DbSet<UserProfile> UserProfiles => Set<UserProfile>();
    public DbSet<UserAddress> UserAddresses => Set<UserAddress>();
    public DbSet<UserPreferences> UserPreferences => Set<UserPreferences>();
    public DbSet<UserSession> UserSessions => Set<UserSession>();
    public DbSet<UserLoginHistory> UserLoginHistories => Set<UserLoginHistory>();
    public DbSet<SavedPassenger> SavedPassengers => Set<SavedPassenger>();
    public DbSet<UserPaymentMethod> UserPaymentMethods => Set<UserPaymentMethod>();

    // ── Payment System ─────────────────────────────────
    public DbSet<Payment> Payments => Set<Payment>();
    public DbSet<Refund> Refunds => Set<Refund>();

    // ── Baggage ────────────────────────────────────────
    public DbSet<BaggageAllowance> BaggageAllowances => Set<BaggageAllowance>();
    public DbSet<BookingBaggage> BookingBaggages => Set<BookingBaggage>();

    // ── Cancellation & Changes ─────────────────────────
    public DbSet<CancellationPolicy> CancellationPolicies => Set<CancellationPolicy>();
    public DbSet<BookingCancellation> BookingCancellations => Set<BookingCancellation>();
    public DbSet<TicketChange> TicketChanges => Set<TicketChange>();

    // ── Loyalty Program ────────────────────────────────
    public DbSet<LoyaltyAccount> LoyaltyAccounts => Set<LoyaltyAccount>();
    public DbSet<MileageTransaction> MileageTransactions => Set<MileageTransaction>();

    // ── Logs ───────────────────────────────────────────
    public DbSet<NotificationLog> NotificationLogs => Set<NotificationLog>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();

    // ── Additional Services ────────────────────────────
    public DbSet<AdditionalService> AdditionalServices => Set<AdditionalService>();
    public DbSet<BookingService> BookingServices => Set<BookingService>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // ── Route ──────────────────────────────────────────────────────────────
        modelBuilder.Entity<Route>()
            .HasOne(r => r.OriginAirport)
            .WithMany(a => a.DepartureRoutes)
            .HasForeignKey(r => r.OriginAirportId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Route>()
            .HasOne(r => r.DestinationAirport)
            .WithMany(a => a.ArrivalRoutes)
            .HasForeignKey(r => r.DestinationAirportId)
            .OnDelete(DeleteBehavior.Restrict);

        // ── Flight ─────────────────────────────────────────────────────────────
        modelBuilder.Entity<Flight>()
            .HasIndex(f => new { f.DepartureTime, f.RouteId });

        modelBuilder.Entity<Flight>()
            .HasOne(f => f.Route).WithMany(r => r.Flights)
            .HasForeignKey(f => f.RouteId).OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Flight>()
            .HasOne(f => f.Aircraft).WithMany(a => a.Flights)
            .HasForeignKey(f => f.AircraftId).OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Flight>()
            .HasOne(f => f.Schedule).WithMany(s => s.Flights)
            .HasForeignKey(f => f.ScheduleId).OnDelete(DeleteBehavior.Restrict);

        // ── SeatConfiguration ──────────────────────────────────────────────────
        modelBuilder.Entity<SeatConfiguration>()
            .HasIndex(sc => new { sc.AircraftId, sc.SeatNumber }).IsUnique();

        // ── FlightSeat ─────────────────────────────────────────────────────────
        modelBuilder.Entity<FlightSeat>()
            .HasIndex(fs => new { fs.FlightId, fs.SeatNumber }).IsUnique();

        modelBuilder.Entity<FlightSeat>()
            .Property(fs => fs.RowVersion).IsRowVersion();

        // ── Booking ────────────────────────────────────────────────────────────
        modelBuilder.Entity<Booking>()
            .HasOne(b => b.User).WithMany(u => u.Bookings)
            .HasForeignKey(b => b.UserId).OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Booking>()
            .HasOne(b => b.ReturnBooking).WithOne()
            .HasForeignKey<Booking>(b => b.ReturnBookingId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Booking>()
            .HasOne(b => b.GroupBooking).WithMany(g => g.Bookings)
            .HasForeignKey(b => b.GroupBookingId).OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Booking>()
            .Property(b => b.TotalAmount).HasColumnType("decimal(18,2)");

        // ── Ticket ─────────────────────────────────────────────────────────────
        modelBuilder.Entity<Ticket>()
            .HasOne(t => t.FlightSeat).WithMany()
            .HasForeignKey(t => t.FlightSeatId).OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Ticket>()
            .HasOne(t => t.Passenger).WithMany(p => p.Tickets)
            .HasForeignKey(t => t.PassengerId).OnDelete(DeleteBehavior.Restrict);

        // ── Passenger ──────────────────────────────────────────────────────────
        modelBuilder.Entity<Passenger>()
            .HasIndex(p => p.PassportNumber);

        modelBuilder.Entity<Passenger>()
            .HasOne(p => p.User).WithMany(u => u.Passengers)
            .HasForeignKey(p => p.UserId).OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<UserProfile>()
            .HasOne(up => up.User).WithOne(u => u.UserProfile)
            .HasForeignKey<UserProfile>(up => up.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<ApplicationUser>()
            .HasOne(u => u.Airline)
            .WithMany()
            .HasForeignKey(u => u.AirlineId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<UserProfile>()
            .HasIndex(up => up.IdCardNumber);
        modelBuilder.Entity<UserProfile>()
            .HasIndex(up => up.PassportNumber);

        // ── UserPreferences ────────────────────────────────────────────────────
        modelBuilder.Entity<UserPreferences>()
            .HasOne(up => up.User).WithOne(u => u.UserPreferences)
            .HasForeignKey<UserPreferences>(up => up.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        // ── UserSession ────────────────────────────────────────────────────────
        modelBuilder.Entity<UserSession>()
            .HasIndex(s => s.RefreshToken).IsUnique();

        modelBuilder.Entity<UserSession>()
            .HasIndex(s => new { s.UserId, s.IsRevoked });

        // ── UserLoginHistory ───────────────────────────────────────────────────
        modelBuilder.Entity<UserLoginHistory>()
            .HasIndex(h => new { h.UserId, h.LoginAt });

        modelBuilder.Entity<UserLoginHistory>()
            .HasIndex(h => h.IpAddress);

        modelBuilder.Entity<UserLoginHistory>()
            .HasOne(h => h.User).WithMany(u => u.UserLoginHistories)
            .HasForeignKey(h => h.UserId)
            .IsRequired(false)
            .OnDelete(DeleteBehavior.Restrict);

        // ── Payment ────────────────────────────────────────────────────────────
        modelBuilder.Entity<Payment>()
            .HasIndex(p => p.TransactionId).IsUnique();

        modelBuilder.Entity<Payment>()
            .Property(p => p.Amount).HasColumnType("decimal(18,2)");

        // ── Refund ─────────────────────────────────────────────────────────────
        modelBuilder.Entity<Refund>()
            .Property(r => r.Amount).HasColumnType("decimal(18,2)");

        // ── BookingBaggage ─────────────────────────────────────────────────────
        modelBuilder.Entity<BookingBaggage>()
            .HasOne(bb => bb.Passenger).WithMany()
            .HasForeignKey(bb => bb.PassengerId).OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<BookingBaggage>()
            .Property(bb => bb.Weight).HasColumnType("decimal(5,2)");
        modelBuilder.Entity<BookingBaggage>()
            .Property(bb => bb.ExtraFee).HasColumnType("decimal(18,2)");

        // ── CancellationPolicy ─────────────────────────────────────────────────
        modelBuilder.Entity<CancellationPolicy>()
            .Property(c => c.RefundPercentage).HasColumnType("decimal(5,2)");
        modelBuilder.Entity<CancellationPolicy>()
            .Property(c => c.FeeAmount).HasColumnType("decimal(18,2)");

        // ── TicketChange ───────────────────────────────────────────────────────
        modelBuilder.Entity<TicketChange>()
            .HasOne(tc => tc.OriginalTicket).WithMany()
            .HasForeignKey(tc => tc.OriginalTicketId).OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<TicketChange>()
            .HasOne(tc => tc.NewFlightSeat).WithMany()
            .HasForeignKey(tc => tc.NewFlightSeatId).OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<TicketChange>()
            .Property(tc => tc.ChangeFee).HasColumnType("decimal(18,2)");
        modelBuilder.Entity<TicketChange>()
            .Property(tc => tc.PriceDifference).HasColumnType("decimal(18,2)");

        // ── LoyaltyAccount ─────────────────────────────────────────────────────
        modelBuilder.Entity<LoyaltyAccount>()
            .HasIndex(la => la.MembershipNumber).IsUnique();

        modelBuilder.Entity<LoyaltyAccount>()
            .HasOne(la => la.User).WithOne(u => u.LoyaltyAccount)
            .HasForeignKey<LoyaltyAccount>(la => la.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        // ── GroupBooking ───────────────────────────────────────────────────────
        modelBuilder.Entity<GroupBooking>()
            .Property(g => g.DiscountPercentage).HasColumnType("decimal(5,2)");

        // ── Additional Services ────────────────────────────────────────────────
        modelBuilder.Entity<AdditionalService>()
            .Property(s => s.Price).HasColumnType("decimal(18,2)");

        modelBuilder.Entity<BookingService>()
            .Property(bs => bs.PriceAtBooking).HasColumnType("decimal(18,2)");

        modelBuilder.Entity<BookingService>()
            .HasOne(bs => bs.Booking).WithMany()
            .HasForeignKey(bs => bs.BookingId).OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<BookingService>()
            .HasOne(bs => bs.AdditionalService).WithMany()
            .HasForeignKey(bs => bs.AdditionalServiceId).OnDelete(DeleteBehavior.Restrict);
    }
}
    