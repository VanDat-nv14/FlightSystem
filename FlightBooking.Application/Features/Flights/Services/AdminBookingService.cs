using FlightBooking.Application.Common.Exceptions;
using FlightBooking.Application.Common.Interfaces;
using FlightBooking.Application.Features.Flights.DTOs;
using FlightBooking.Application.Features.Flights.Interfaces;
using FlightBooking.Domain.Entities.Logs;
using FlightBooking.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace FlightBooking.Application.Features.Flights.Services
{
    public class AdminBookingService : IAdminBookingService
    {
        private readonly IApplicationDbContext _context;

        public AdminBookingService(IApplicationDbContext context)
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
                BookingCode = b.BookingCode,
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
            var booking = await _context.Bookings
                .Include(b => b.Tickets)
                    .ThenInclude(t => t.FlightSeat)
                        .ThenInclude(fs => fs!.Flight)
                .FirstOrDefaultAsync(b => b.Id == bookingId)
                ?? throw new NotFoundException("Booking", bookingId);

            if (!Enum.TryParse<BookingStatus>(request.Status, out var newStatus))
                throw new BadRequestException($"Trang thai '{request.Status}' khong hop le.");

            ValidateStatusTransition(booking.Status, newStatus);

            if (newStatus == BookingStatus.Cancelled)
                ValidateCanCancel(booking);

            if (newStatus == BookingStatus.Completed)
                ValidateCanComplete(booking);

            booking.Status = newStatus;

            if (newStatus == BookingStatus.Cancelled)
            {
                foreach (var ticket in booking.Tickets)
                {
                    if (ticket.FlightSeat != null)
                        ticket.FlightSeat.Status = SeatStatus.Available;
                }
            }

            string statusVi = newStatus switch
            {
                BookingStatus.Pending => "Chờ thanh toán",
                BookingStatus.Confirmed => "Đã xác nhận",
                BookingStatus.Completed => "Hoàn thành",
                BookingStatus.Cancelled => "Đã hủy",
                _ => newStatus.ToString()
            };

            _context.NotificationLogs.Add(new NotificationLog
            {
                UserId = booking.UserId,
                Type = NotificationType.Push,
                Subject = "Cập nhật trạng thái đặt vé",
                Content = $"Đơn đặt vé {booking.BookingCode} đã được chuyển sang trạng thái {statusVi}.",
                SentAt = DateTime.UtcNow,
                IsRead = false
            });

            await _context.SaveChangesAsync();
            return true;
        }

        private static void ValidateStatusTransition(BookingStatus currentStatus, BookingStatus newStatus)
        {
            if (currentStatus == newStatus)
                throw new BadRequestException("Booking dang o trang thai nay.");

            if (currentStatus == BookingStatus.Cancelled)
                throw new BadRequestException("Booking da huy la trang thai ket thuc, khong the cap nhat tiep.");

            if (currentStatus == BookingStatus.Completed)
                throw new BadRequestException("Booking da hoan thanh la trang thai ket thuc, khong the huy hoac cap nhat tiep.");

            var allowed = currentStatus switch
            {
                BookingStatus.Pending => new[] { BookingStatus.Confirmed, BookingStatus.Cancelled },
                BookingStatus.Confirmed => new[] { BookingStatus.Completed, BookingStatus.Cancelled },
                _ => Array.Empty<BookingStatus>()
            };

            if (!allowed.Contains(newStatus))
                throw new BadRequestException($"Khong the chuyen booking tu {currentStatus} sang {newStatus}.");
        }

        private static void ValidateCanCancel(FlightBooking.Domain.Entities.Bookings.Booking booking)
        {
            if (booking.Tickets.Any(t => t.CheckInStatus == CheckInStatus.CheckedIn || t.CheckInStatus == CheckInStatus.Boarded))
                throw new BadRequestException("Khong the huy booking da check-in hoac da boarding.");

            if (booking.Tickets.Any(t => t.FlightSeat?.Flight?.DepartureTime <= DateTime.UtcNow))
                throw new BadRequestException("Khong the huy booking co chuyen bay da khoi hanh.");
        }

        private static void ValidateCanComplete(FlightBooking.Domain.Entities.Bookings.Booking booking)
        {
            if (booking.Status != BookingStatus.Confirmed)
                throw new BadRequestException("Chi booking da xac nhan moi co the chuyen sang hoan thanh.");

            if (booking.Tickets.Any(t => t.FlightSeat?.Flight?.ArrivalTime > DateTime.UtcNow))
                throw new BadRequestException("Chi co the hoan thanh booking sau khi tat ca chuyen bay da ha canh.");
        }
    }
}
