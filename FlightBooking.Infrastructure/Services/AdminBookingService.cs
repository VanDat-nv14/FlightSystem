using FlightBooking.Application.Common.Exceptions;
using FlightBooking.Application.Features.Flights.DTOs;
using FlightBooking.Application.Features.Flights.Interfaces;
using FlightBooking.Domain.Enums;
using FlightBooking.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace FlightBooking.Infrastructure.Services
{
    public class AdminBookingService : IAdminBookingService
    {
        private readonly FlightBookingDbContext _context;

        public AdminBookingService(FlightBookingDbContext context)
        {
            _context = context;
        }

        public async Task<List<AdminBookingDto>> GetAllAsync()
        {
            var bookings = await _context.Bookings
                .Include(b => b.User)
                .Include(b => b.Tickets)
                    .ThenInclude(t => t.FlightSeat)
                        .ThenInclude(fs => fs!.Flight)
                            .ThenInclude(f => f!.Aircraft)
                                .ThenInclude(a => a!.Airline)
                .Include(b => b.Tickets)
                    .ThenInclude(t => t.FlightSeat)
                        .ThenInclude(fs => fs!.Flight)
                            .ThenInclude(f => f!.Route)
                                .ThenInclude(r => r!.OriginAirport)
                .Include(b => b.Tickets)
                    .ThenInclude(t => t.FlightSeat)
                        .ThenInclude(fs => fs!.Flight)
                            .ThenInclude(f => f!.Route)
                                .ThenInclude(r => r!.DestinationAirport)
                .Include(b => b.Tickets)
                    .ThenInclude(t => t.Passenger)
                .OrderByDescending(b => b.BookingDate)
                .ToListAsync();

            return bookings.Select(b => new AdminBookingDto
            {
                BookingId = b.Id,
                BookingStatus = b.Status.ToString(),
                BookingType = b.BookingType.ToString(),
                BookingDate = b.BookingDate,
                TotalAmount = b.TotalAmount,
                CustomerId = b.UserId,
                CustomerName = b.User?.FullName ?? "N/A",
                CustomerEmail = b.User?.Email ?? "",
                TicketCount = b.Tickets.Count,
                Tickets = b.Tickets.Select(t => new AdminTicketSummaryDto
                {
                    TicketId = t.Id,
                    FlightNumber = t.FlightSeat?.Flight?.FlightNumber ?? "",
                    AirlineName = t.FlightSeat?.Flight?.Aircraft?.Airline?.Name ?? "",
                    AirlineCode = t.FlightSeat?.Flight?.Aircraft?.Airline?.Code ?? "",
                    OriginCode = t.FlightSeat?.Flight?.Route?.OriginAirport?.Code ?? "",
                    DestinationCode = t.FlightSeat?.Flight?.Route?.DestinationAirport?.Code ?? "",
                    DepartureTime = t.FlightSeat?.Flight?.DepartureTime ?? default,
                    SeatNumber = t.FlightSeat?.SeatNumber ?? "",
                    SeatClass = t.FlightSeat?.ClassType.ToString() ?? "",
                    SeatPrice = t.FlightSeat?.Price ?? 0,
                    PassengerName = t.Passenger?.FullName ?? "",
                    CheckInStatus = t.CheckInStatus.ToString()
                }).ToList()
            }).ToList();
        }

        public async Task<AdminBookingDto> GetByIdAsync(int bookingId)
        {
            var all = await GetAllAsync();
            return all.FirstOrDefault(b => b.BookingId == bookingId)
                ?? throw new NotFoundException("Booking", bookingId);
        }

        public async Task<bool> UpdateStatusAsync(int bookingId, UpdateBookingStatusRequest request)
        {
            var booking = await _context.Bookings.FindAsync(bookingId)
                ?? throw new NotFoundException("Booking", bookingId);

            if (!System.Enum.TryParse<BookingStatus>(request.Status, out var newStatus))
                throw new BadRequestException($"Trạng thái '{request.Status}' không hợp lệ.");

            booking.Status = newStatus;
            await _context.SaveChangesAsync();
            return true;
        }
    }
}
