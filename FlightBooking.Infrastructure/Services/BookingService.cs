using FlightBooking.Application.Common.Exceptions;
using FlightBooking.Application.Features.Flights.DTOs;
using FlightBooking.Application.Features.Flights.Interfaces;
using FlightBooking.Domain.Entities.Bookings;
using FlightBooking.Domain.Entities.Seats;
using FlightBooking.Domain.Entities.Users;
using FlightBooking.Domain.Enums;
using FlightBooking.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace FlightBooking.Infrastructure.Services
{
    public class BookingService : IBookingService
    {
        private readonly FlightBookingDbContext _context;

        public BookingService(FlightBookingDbContext context)
        {
            _context = context;
        }

        public async Task<List<AdminBookingDto>> GetMyBookingsAsync(int userId)
        {
            var bookings = await _context.Bookings
                .Where(b => b.UserId == userId)
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

        public async Task<BookingCreateResponse> CreateAsync(CreateBookingRequest request, int userId)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                // 1. Tạo PNR ngẫu nhiên
                var pnr = GeneratePNR();

                // 2. Tạo Booking
                var booking = new Booking
                {
                    UserId = userId,
                    BookingDate = DateTime.UtcNow,
                    BookingCode = pnr,
                    TotalAmount = request.TotalAmount,
                    Status = request.PaymentType == "Deposit" ? BookingStatus.Pending : BookingStatus.Confirmed,
                    BookingType = BookingType.OneWay // Mặc định cho luồng đơn giản
                };

                _context.Bookings.Add(booking);
                await _context.SaveChangesAsync();

                // 3. Xử lý hành khách và vé
                foreach (var pDto in request.Passengers)
                {
                    // Tạo hành khách mới (hoặc tìm người đã lưu - đơn giản hóa bằng cách tạo mới)
                    var passenger = new Passenger
                    {
                        UserId = userId,
                        Title = pDto.Title,
                        FirstName = pDto.FirstName,
                        LastName = pDto.LastName,
                        DateOfBirth = pDto.DateOfBirth,
                        Nationality = pDto.Nationality,
                        PassportNumber = pDto.PassportNumber
                    };
                    _context.Passengers.Add(passenger);
                    await _context.SaveChangesAsync();

                    // Tìm ghế
                    var seat = await _context.FlightSeats
                        .FirstOrDefaultAsync(fs => fs.FlightId == request.FlightId && fs.SeatNumber == pDto.SeatNumber);

                    if (seat == null)
                        throw new BadRequestException($"Ghế {pDto.SeatNumber} không tồn tại cho chuyến bay này.");

                    if (seat.Status != SeatStatus.Available)
                        throw new BadRequestException($"Ghế {pDto.SeatNumber} đã có người đặt.");

                    // Cập nhật trạng thái ghế
                    seat.Status = SeatStatus.Booked;

                    // Tạo vé
                    var ticket = new Ticket
                    {
                        BookingId = booking.Id,
                        PassengerId = passenger.Id,
                        FlightSeatId = seat.Id,
                        CheckInStatus = CheckInStatus.NotCheckedIn
                    };
                    _context.Tickets.Add(ticket);
                }

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return new BookingCreateResponse
                {
                    BookingId = booking.Id,
                    Pnr = pnr,
                    TotalAmount = booking.TotalAmount,
                    Status = booking.Status.ToString()
                };
            }
            catch (Exception)
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        private string GeneratePNR()
        {
            const string chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
            var random = new Random();
            return new string(Enumerable.Repeat(chars, 6)
                .Select(s => s[random.Next(s.Length)]).ToArray());
        }
    }
}
