using FlightBooking.Application.Common.Exceptions;
using FlightBooking.Application.Common.Interfaces;
using FlightBooking.Application.Features.Email.Interfaces;
using FlightBooking.Application.Features.Flights.DTOs;
using FlightBooking.Application.Features.Flights.Interfaces;
using FlightBooking.Domain.Entities.Baggage;
using FlightBooking.Domain.Entities.Bookings;
using FlightBooking.Domain.Entities.Payments;
using FlightBooking.Domain.Entities.Seats;
using FlightBooking.Domain.Entities.Users;
using FlightBooking.Domain.Entities.Logs;
using FlightBooking.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace FlightBooking.Application.Features.Flights.Services
{
    public class BookingService : IBookingService
    {
        private readonly IApplicationDbContext _context;
        private readonly IEmailService _emailService;
        private readonly ICacheService _cache;

        public BookingService(IApplicationDbContext context, IEmailService emailService, ICacheService cache)
        {
            _context = context;
            _emailService = emailService;
            _cache = cache;
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

            var ticketIds = bookings.SelectMany(b => b.Tickets).Select(t => t.Id).ToList();
            var baggageTags = await _context.BaggageTags
                .Include(bt => bt.BookingBaggage)
                .Where(bt => ticketIds.Contains(bt.TicketId))
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
                    CheckInStatus = t.CheckInStatus.ToString(),
                    BaggageTags = baggageTags
                        .Where(bt => bt.TicketId == t.Id)
                        .Select(bt => new BaggageTagDto
                        {
                            Id = bt.Id,
                            TagCode = bt.TagCode,
                            Weight = bt.BookingBaggage?.Weight ?? 0,
                            ExtraFee = bt.BookingBaggage?.ExtraFee ?? 0,
                            Status = bt.Status.ToString(),
                            CreatedAt = bt.CreatedAt,
                            CheckedInAt = bt.CheckedInAt,
                            LoadedAt = bt.LoadedAt,
                            ArrivedAt = bt.ArrivedAt,
                            ClaimedAt = bt.ClaimedAt
                        }).ToList()
                }).ToList()
            }).ToList();
        }

        public async Task<BookingCreateResponse> CreateAsync(CreateBookingRequest request, int userId)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                ValidateBookingRequest(request);

                // 1. Tạo PNR ngẫu nhiên
                var pnr = await GenerateUniquePNRAsync();
                decimal calculatedTotalAmount = 0;
                var paymentMethod = MapPaymentMethod(request.PaymentMethod);
                var isBankTransfer = paymentMethod == PaymentMethod.BankTransfer;
                var isDeposit = request.PaymentType == "Deposit";

                // 2. Tạo Booking
                var booking = new Booking
                {
                    UserId = userId,
                    BookingDate = DateTime.UtcNow,
                    BookingCode = pnr,
                    TotalAmount = 0,
                    Status = isDeposit || isBankTransfer ? BookingStatus.Pending : BookingStatus.Confirmed,
                    BookingType = BookingType.OneWay // Mặc định cho luồng đơn giản
                };

                _context.Bookings.Add(booking);
                await _context.SaveChangesAsync();

                // 3. Xử lý hành khách và vé
                foreach (var pDto in request.Passengers)
                {
                    var seatNumber = pDto.SeatNumber.Trim();

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

                    // Atomically book the seat only if it is still available.
                    var bookedSeatCount = await _context.FlightSeats
                        .Where(fs =>
                            fs.FlightId == request.FlightId &&
                            fs.SeatNumber == seatNumber &&
                            (fs.Status == SeatStatus.Available || fs.Status == SeatStatus.Reserved))
                        .ExecuteUpdateAsync(setters => setters
                            .SetProperty(fs => fs.Status, SeatStatus.Booked));

                    if (bookedSeatCount == 0)
                    {
                        var seatExists = await _context.FlightSeats
                            .AnyAsync(fs => fs.FlightId == request.FlightId && fs.SeatNumber == seatNumber);

                        if (!seatExists)
                            throw new BadRequestException($"Ghế {seatNumber} không tồn tại cho chuyến bay này.");

                        throw new BadRequestException($"Ghế {seatNumber} vừa được người khác đặt. Vui lòng chọn ghế khác.");
                    }

                    // Xóa hold key khỏi Redis nếu có
                    await _cache.RemoveAsync($"seat:hold:{request.FlightId}:{seatNumber}");

                    var seat = await _context.FlightSeats
                        .AsNoTracking()
                        .FirstAsync(fs => fs.FlightId == request.FlightId && fs.SeatNumber == seatNumber);
                    calculatedTotalAmount += seat.Price;

                    // Tạo vé
                    var ticket = new Ticket
                    {
                        BookingId = booking.Id,
                        PassengerId = passenger.Id,
                        FlightSeatId = seat.Id,
                        CheckInStatus = CheckInStatus.NotCheckedIn
                    };
                    _context.Tickets.Add(ticket);
                    await _context.SaveChangesAsync();

                    if (pDto.BaggageAllowanceId.HasValue)
                    {
                        var allowance = await _context.BaggageAllowances.FindAsync(pDto.BaggageAllowanceId.Value)
                            ?? throw new BadRequestException("Gói hành lý không hợp lệ.");

                        var bookingBaggage = new BookingBaggage
                        {
                            BookingId = booking.Id,
                            TicketId = ticket.Id,
                            PassengerId = passenger.Id,
                            Weight = allowance.MaxWeight,
                            ExtraFee = allowance.AdditionalFee
                        };
                        _context.BookingBaggages.Add(bookingBaggage);
                        await _context.SaveChangesAsync();

                        var airlineCode = await _context.Flights
                            .Where(f => f.Id == request.FlightId)
                            .Select(f => f.Aircraft != null && f.Aircraft.Airline != null ? f.Aircraft.Airline.Code : "SKY")
                            .FirstOrDefaultAsync() ?? "SKY";

                        _context.BaggageTags.Add(new BaggageTag
                        {
                            BookingBaggageId = bookingBaggage.Id,
                            TicketId = ticket.Id,
                            FlightId = request.FlightId,
                            TagCode = $"BAG-{airlineCode}{request.FlightId}-{booking.Id}-{ticket.Id}",
                            Status = BaggageTagStatus.Registered
                        });

                        calculatedTotalAmount += allowance.AdditionalFee;
                    }

                    var additionalServiceIds = pDto.AdditionalServiceIds?.Distinct().ToList() ?? new List<int>();
                    if (additionalServiceIds.Count > 0)
                    {
                        var additionalServices = await _context.AdditionalServices
                            .Where(s => additionalServiceIds.Contains(s.Id))
                            .ToListAsync();

                        if (additionalServices.Count != additionalServiceIds.Count)
                            throw new BadRequestException("Dịch vụ đi kèm không hợp lệ.");

                        foreach (var service in additionalServices)
                        {
                            _context.BookingServices.Add(new FlightBooking.Domain.Entities.Services.BookingService
                            {
                                BookingId = booking.Id,
                                AdditionalServiceId = service.Id,
                                PassengerId = passenger.Id,
                                PriceAtBooking = service.Price
                            });

                            calculatedTotalAmount += service.Price;
                        }
                    }
                }

                booking.TotalAmount = calculatedTotalAmount;
                var amountToPay = isDeposit
                    ? Math.Ceiling(calculatedTotalAmount * 0.30m)
                    : calculatedTotalAmount;

                if (isDeposit)
                {
                    booking.IsDepositBooking = true;
                    booking.DepositDeadline = DateTime.UtcNow.AddHours(72);
                    booking.RemainingAmount = calculatedTotalAmount - amountToPay;
                }

                _context.Payments.Add(new Payment
                {
                    BookingId = booking.Id,
                    Amount = amountToPay,
                    Method = paymentMethod,
                    Status = isBankTransfer ? PaymentStatus.Pending : PaymentStatus.Completed,
                    TransactionId = $"{(isBankTransfer ? "PENDING" : "MOCK")}-{booking.BookingCode}-{DateTime.UtcNow:yyyyMMddHHmmss}",
                    PaidAt = isBankTransfer ? null : DateTime.UtcNow
                });

                _context.NotificationLogs.Add(new NotificationLog
                {
                    UserId = userId,
                    Type = NotificationType.Push,
                    Subject = "Đặt vé thành công",
                    Content = $"Đơn đặt vé {booking.BookingCode} đã được tạo thành công với tổng tiền {calculatedTotalAmount:N0} VND.",
                    SentAt = DateTime.UtcNow,
                    IsRead = false
                });

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                // Gửi email xác nhận đặt vé (ngoài transaction để tránh ảnh hưởng luồng chính nếu lỗi gửi mail)
                try
                {
                    var user = await _context.Users.FindAsync(userId);
                    if (user != null && !string.IsNullOrEmpty(user.Email))
                    {
                        await _emailService.SendBookingConfirmAsync(
                            user.Email,
                            user.FullName ?? "Khách hàng",
                            booking.BookingCode,
                            booking.TotalAmount,
                            booking.IsDepositBooking,
                            booking.IsDepositBooking ? amountToPay : null,
                            booking.DepositDeadline
                        );
                    }
                }
                catch
                {
                    // Lỗi gửi email không làm ảnh hưởng đến việc tạo booking thành công
                }

                return new BookingCreateResponse
                {
                    BookingId = booking.Id,
                    Pnr = pnr,
                    TotalAmount = booking.TotalAmount,
                    Status = booking.Status.ToString()
                };
            }
            catch (DbUpdateConcurrencyException)
            {
                await transaction.RollbackAsync();
                throw new BadRequestException("Ghế vừa được người khác đặt. Vui lòng chọn ghế khác.");
            }
            catch (Exception)
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        private static void ValidateBookingRequest(CreateBookingRequest request)
        {
            if (request.Passengers.Count == 0)
                throw new BadRequestException("Vui lòng nhập ít nhất một hành khách.");

            var seatNumbers = request.Passengers
                .Select(p => p.SeatNumber?.Trim())
                .Where(s => !string.IsNullOrWhiteSpace(s))
                .ToList();

            if (seatNumbers.Count != request.Passengers.Count)
                throw new BadRequestException("Số ghế phải khớp với số hành khách.");

            if (seatNumbers.Distinct(StringComparer.OrdinalIgnoreCase).Count() != request.Passengers.Count)
                throw new BadRequestException("Mỗi hành khách phải chọn một ghế khác nhau.");
        }

        private static PaymentMethod MapPaymentMethod(string paymentMethod)
        {
            return paymentMethod?.ToLowerInvariant() switch
            {
                "banking" or "banktransfer" => PaymentMethod.BankTransfer,
                "momo" => PaymentMethod.Momo,
                "card" or "creditcard" => PaymentMethod.CreditCard,
                _ => PaymentMethod.CreditCard
            };
        }

        private async Task<string> GenerateUniquePNRAsync()
        {
            string pnr;
            do
            {
                pnr = GeneratePNR();
            }
            while (await _context.Bookings.AnyAsync(b => b.BookingCode == pnr));

            return pnr;
        }

        private static string GeneratePNR()
        {
            const string chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
            var random = new Random();
            return new string(Enumerable.Repeat(chars, 6)
                .Select(s => s[random.Next(s.Length)]).ToArray());
        }
    }
}
