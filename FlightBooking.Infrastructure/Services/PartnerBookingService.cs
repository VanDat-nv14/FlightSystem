using FlightBooking.Application.Features.Flights.DTOs;
using FlightBooking.Application.Features.Flights.Interfaces;
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

            return tickets.Select(t => new PartnerTicketDto
            {
                TicketId = t.Id,
                BookingId = t.BookingId,

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

                CheckInStatus = t.CheckInStatus.ToString()
            }).ToList();
        }
    }
}
