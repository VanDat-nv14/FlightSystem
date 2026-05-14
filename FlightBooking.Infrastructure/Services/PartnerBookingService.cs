using FlightBooking.Application.Features.Flights.DTOs;
using FlightBooking.Application.Features.Flights.Interfaces;
using FlightBooking.Application.Common.Exceptions;
using FlightBooking.Domain.Entities.Bookings;
using FlightBooking.Domain.Enums;
using FlightBooking.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace FlightBooking.Infrastructure.Services
{
    public class PartnerBookingService : IPartnerBookingService
    {
        private readonly FlightBookingDbContext _context;

        public PartnerBookingService(FlightBookingDbContext context)
        {
            _context = context;
        }

        public async Task<List<PartnerTicketDto>> GetTicketsByAirlineAsync(int airlineId)
        {
            // Traverse: Ticket → FlightSeat → Flight → Aircraft → Airline
            var tickets = await _context.Tickets
                .Include(t => t.FlightSeat)
                    .ThenInclude(fs => fs!.Flight)
                        .ThenInclude(f => f!.Route)
                            .ThenInclude(r => r!.OriginAirport)
                .Include(t => t.FlightSeat)
                    .ThenInclude(fs => fs!.Flight)
                        .ThenInclude(f => f!.Route)
                            .ThenInclude(r => r!.DestinationAirport)
                .Include(t => t.FlightSeat)
                    .ThenInclude(fs => fs!.Flight)
                        .ThenInclude(f => f!.Aircraft)
                .Include(t => t.Passenger)
                .Include(t => t.Booking)
                    .ThenInclude(b => b!.User)
                .Where(t =>
                    t.FlightSeat != null &&
                    t.FlightSeat.Flight != null &&
                    t.FlightSeat.Flight.Aircraft != null &&
                    t.FlightSeat.Flight.Aircraft.AirlineId == airlineId)
                .OrderByDescending(t => t.Booking!.BookingDate)
                .ToListAsync();

            return tickets.Select(MapToDto).ToList();
        }

        public async Task<PartnerTicketDto> UpdateTicketCheckInStatusAsync(int airlineId, int ticketId, UpdateTicketCheckInStatusRequest request)
        {
            if (!Enum.TryParse<CheckInStatus>(request.CheckInStatus, true, out var status))
                throw new BadRequestException("Trạng thái check-in không hợp lệ.");

            var ticket = await _context.Tickets
                .Include(t => t.FlightSeat)
                    .ThenInclude(fs => fs!.Flight)
                        .ThenInclude(f => f!.Route)
                            .ThenInclude(r => r!.OriginAirport)
                .Include(t => t.FlightSeat)
                    .ThenInclude(fs => fs!.Flight)
                        .ThenInclude(f => f!.Route)
                            .ThenInclude(r => r!.DestinationAirport)
                .Include(t => t.FlightSeat)
                    .ThenInclude(fs => fs!.Flight)
                        .ThenInclude(f => f!.Aircraft)
                .Include(t => t.Passenger)
                .Include(t => t.Booking)
                    .ThenInclude(b => b!.Tickets)
                .Include(t => t.Booking)
                    .ThenInclude(b => b!.User)
                .FirstOrDefaultAsync(t =>
                    t.Id == ticketId &&
                    t.FlightSeat != null &&
                    t.FlightSeat.Flight != null &&
                    t.FlightSeat.Flight.Aircraft != null &&
                    t.FlightSeat.Flight.Aircraft.AirlineId == airlineId)
                ?? throw new NotFoundException("Ticket", ticketId);

            if (!IsValidCheckInTransition(ticket.CheckInStatus, status))
                throw new BadRequestException("Không thể chuyển trạng thái check-in theo thứ tự này.");

            ticket.CheckInStatus = status;
            ticket.CheckInTime = status == CheckInStatus.CheckedIn || status == CheckInStatus.Boarded
                ? DateTime.UtcNow
                : null;

            if (ticket.Booking != null && ticket.Booking.Tickets.Any())
            {
                if (ticket.Booking.Tickets.All(t => t.CheckInStatus == CheckInStatus.Boarded || t.CheckInStatus == CheckInStatus.NoShow))
                    ticket.Booking.Status = BookingStatus.Completed;
                else if (ticket.Booking.Status == BookingStatus.Completed)
                    ticket.Booking.Status = BookingStatus.Confirmed;
            }

            await _context.SaveChangesAsync();
            return MapToDto(ticket);
        }

        private static bool IsValidCheckInTransition(CheckInStatus current, CheckInStatus next)
        {
            if (current == next) return true;

            return current switch
            {
                CheckInStatus.NotCheckedIn => next == CheckInStatus.CheckedIn || next == CheckInStatus.NoShow,
                CheckInStatus.CheckedIn => next == CheckInStatus.Boarded || next == CheckInStatus.NoShow,
                CheckInStatus.Boarded => false,
                CheckInStatus.NoShow => false,
                _ => false
            };
        }

        private static PartnerTicketDto MapToDto(Ticket t) => new()
        {
            TicketId = t.Id,
            BookingId = t.BookingId,
            BookingCode = t.Booking?.BookingCode ?? "",
            BookingStatus = t.Booking?.Status.ToString() ?? "",
            BookingDate = t.Booking?.BookingDate ?? default,
            BookingTotalAmount = t.Booking?.TotalAmount ?? 0,

            BookerName = t.Booking?.User?.FullName ?? "",
            BookerEmail = t.Booking?.User?.Email ?? "",
            BookerPhoneNumber = t.Booking?.User?.PhoneNumber,

            FlightId = t.FlightSeat!.FlightId,
            FlightNumber = t.FlightSeat.Flight?.FlightNumber ?? "",
            OriginCode = t.FlightSeat.Flight?.Route?.OriginAirport?.Code ?? "",
            DestinationCode = t.FlightSeat.Flight?.Route?.DestinationAirport?.Code ?? "",
            DepartureTime = t.FlightSeat.Flight?.DepartureTime ?? default,
            ArrivalTime = t.FlightSeat.Flight?.ArrivalTime ?? default,

            SeatNumber = t.FlightSeat.SeatNumber,
            SeatClass = t.FlightSeat.ClassType.ToString(),
            SeatPrice = t.FlightSeat.Price,

            PassengerName = t.Passenger?.FullName ?? "",
            PassengerPassport = t.Passenger?.PassportNumber ?? "",
            PassengerNationality = t.Passenger?.Nationality ?? "",
            PassengerDateOfBirth = t.Passenger?.DateOfBirth,
            PassengerGender = t.Passenger?.Gender.ToString() ?? "",

            CheckInStatus = t.CheckInStatus.ToString()
        };
    }
}
