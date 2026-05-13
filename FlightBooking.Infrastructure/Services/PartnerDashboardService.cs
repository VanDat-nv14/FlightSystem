using FlightBooking.Application.Features.Flights.DTOs;
using FlightBooking.Application.Features.Flights.Interfaces;
using FlightBooking.Domain.Enums;
using FlightBooking.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace FlightBooking.Infrastructure.Services
{
    public class PartnerDashboardService : IPartnerDashboardService
    {
        private readonly FlightBookingDbContext _context;

        public PartnerDashboardService(FlightBookingDbContext context)
        {
            _context = context;
        }

        public async Task<PartnerDashboardDto> GetDashboardAsync(int airlineId)
        {
            var today = DateTime.UtcNow.Date;
            var sevenDaysAgo = today.AddDays(-6);

            // ── 1. All tickets for this airline ─────────────────────────────
            var allTickets = await _context.Tickets
                .Include(t => t.FlightSeat)
                    .ThenInclude(fs => fs!.Flight)
                        .ThenInclude(f => f!.Aircraft)
                .Include(t => t.FlightSeat)
                    .ThenInclude(fs => fs!.Flight)
                        .ThenInclude(f => f!.Route)
                            .ThenInclude(r => r!.OriginAirport)
                .Include(t => t.FlightSeat)
                    .ThenInclude(fs => fs!.Flight)
                        .ThenInclude(f => f!.Route)
                            .ThenInclude(r => r!.DestinationAirport)
                .Include(t => t.Booking)
                .Where(t =>
                    t.FlightSeat != null &&
                    t.FlightSeat.Flight != null &&
                    t.FlightSeat.Flight.Aircraft != null &&
                    t.FlightSeat.Flight.Aircraft.AirlineId == airlineId)
                .ToListAsync();

            // ── 2. All flights for this airline ─────────────────────────────
            var allFlights = await _context.Flights
                .Include(f => f.Aircraft)
                .Include(f => f.Route)
                    .ThenInclude(r => r!.OriginAirport)
                .Include(f => f.Route)
                    .ThenInclude(r => r!.DestinationAirport)
                .Include(f => f.FlightSeats)
                .Where(f => f.Aircraft != null && f.Aircraft.AirlineId == airlineId)
                .OrderBy(f => f.DepartureTime)
                .ToListAsync();

            // ── 3. Aircrafts for this airline ────────────────────────────────
            var totalAircrafts = await _context.Aircrafts
                .CountAsync(a => a.AirlineId == airlineId);

            // ── 4. KPI Calculations ─────────────────────────────────────────
            var confirmedTickets = allTickets
                .Where(t => t.Booking?.Status != BookingStatus.Cancelled)
                .ToList();

            var todayTickets = confirmedTickets
                .Where(t => t.Booking?.BookingDate.Date == today)
                .ToList();

            var totalRevenue = confirmedTickets.Sum(t => t.FlightSeat?.Price ?? 0);
            var todayRevenue = todayTickets.Sum(t => t.FlightSeat?.Price ?? 0);

            var todayFlights = allFlights.Count(f => f.DepartureTime.Date == today);

            // Load Factor: booked seats / total seats across all flights
            var totalSeatsCapacity = allFlights.Sum(f => f.FlightSeats.Count);
            var bookedSeatsCount = allFlights.Sum(f => f.FlightSeats.Count(s => s.Status == SeatStatus.Booked));
            var loadFactor = totalSeatsCapacity > 0
                ? Math.Round((double)bookedSeatsCount / totalSeatsCapacity * 100, 1)
                : 0;

            // ── 5. Seat class breakdown ──────────────────────────────────────
            var economyCount = confirmedTickets.Count(t => t.FlightSeat?.ClassType == SeatClassType.Economy);
            var businessCount = confirmedTickets.Count(t => t.FlightSeat?.ClassType == SeatClassType.Business);
            var firstClassCount = confirmedTickets.Count(t => t.FlightSeat?.ClassType == SeatClassType.FirstClass);

            // ── 6. Revenue chart (last 7 days) ───────────────────────────────
            var revenueChart = new List<DailyRevenueDto>();
            for (int i = 0; i < 7; i++)
            {
                var day = sevenDaysAgo.AddDays(i);
                var dayTickets = confirmedTickets
                    .Where(t => t.Booking?.BookingDate.Date == day)
                    .ToList();
                revenueChart.Add(new DailyRevenueDto
                {
                    Date = day.ToString("dd/MM"),
                    Revenue = dayTickets.Sum(t => t.FlightSeat?.Price ?? 0),
                    Tickets = dayTickets.Count
                });
            }

            // ── 7. Upcoming flights (next 5) ─────────────────────────────────
            var upcomingFlights = allFlights
                .Where(f => f.DepartureTime > DateTime.UtcNow &&
                            f.Status != FlightStatus.Cancelled)
                .OrderBy(f => f.DepartureTime)
                .Take(5)
                .Select(f => new UpcomingFlightDto
                {
                    FlightId = f.Id,
                    FlightNumber = f.FlightNumber,
                    OriginCode = f.Route?.OriginAirport?.Code ?? "",
                    DestinationCode = f.Route?.DestinationAirport?.Code ?? "",
                    DepartureTime = f.DepartureTime,
                    AircraftModel = f.Aircraft?.Model ?? "",
                    TotalSeats = f.FlightSeats.Count,
                    BookedSeats = f.FlightSeats.Count(s => s.Status == SeatStatus.Booked),
                    Status = f.Status.ToString()
                }).ToList();

            return new PartnerDashboardDto
            {
                TotalRevenue = totalRevenue,
                TodayRevenue = todayRevenue,
                TotalTickets = confirmedTickets.Count,
                TodayTickets = todayTickets.Count,
                TotalFlights = allFlights.Count,
                TodayFlights = todayFlights,
                TotalAircrafts = totalAircrafts,
                LoadFactor = loadFactor,
                UpcomingFlights = upcomingFlights,
                RevenueChart = revenueChart,
                EconomyTickets = economyCount,
                BusinessTickets = businessCount,
                FirstClassTickets = firstClassCount
            };
        }
    }
}
