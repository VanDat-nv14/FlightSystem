using FlightBooking.Application.Common.Exceptions;
using FlightBooking.Application.Common.Interfaces;
using FlightBooking.Application.Features.Email.Interfaces;
using FlightBooking.Application.Features.Flights.DTOs;
using FlightBooking.Application.Features.Flights.Interfaces;
using FlightBooking.Domain.Entities.Cancellations;
using FlightBooking.Domain.Entities.Logs;
using FlightBooking.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace FlightBooking.Application.Features.Flights.Services
{
    public class CancellationService : ICancellationService
    {
        private readonly IApplicationDbContext _context;
        private readonly IEmailService _emailService;

        public CancellationService(IApplicationDbContext context, IEmailService emailService)
        {
            _context = context;
            _emailService = emailService;
        }

        // ── Preview ────────────────────────────────────────────────────────────
        public async Task<CancellationPreviewDto> PreviewCancellationAsync(int bookingId, int userId)
        {
            var booking = await _context.Bookings
                .Include(b => b.Tickets)
                    .ThenInclude(t => t.FlightSeat)
                        .ThenInclude(fs => fs!.Flight)
                .FirstOrDefaultAsync(b => b.Id == bookingId)
                ?? throw new NotFoundException("Booking", bookingId);

            // Kiểm tra quyền sở hữu
            if (booking.UserId != userId)
                throw new BadRequestException("Bạn không có quyền hủy booking này.");

            var preview = new CancellationPreviewDto
            {
                BookingId = bookingId,
                BookingCode = booking.BookingCode,
                CanCancel = true
            };

            // Validate: không hủy nếu đã check-in hoặc đã khởi hành
            if (booking.Status == BookingStatus.Cancelled)
            {
                preview.CanCancel = false;
                preview.CannotCancelReason = "Booking này đã bị hủy trước đó.";
                return preview;
            }

            if (booking.Status == BookingStatus.Completed)
            {
                preview.CanCancel = false;
                preview.CannotCancelReason = "Không thể hủy booking đã hoàn thành.";
                return preview;
            }

            var hasCheckedIn = booking.Tickets.Any(t =>
                t.CheckInStatus == CheckInStatus.CheckedIn || t.CheckInStatus == CheckInStatus.Boarded);
            if (hasCheckedIn)
            {
                preview.CanCancel = false;
                preview.CannotCancelReason = "Không thể hủy booking đã có hành khách check-in.";
                return preview;
            }

            // Lấy thời gian khởi hành sớm nhất trong booking
            var earliestDeparture = booking.Tickets
                .Where(t => t.FlightSeat?.Flight != null)
                .Select(t => t.FlightSeat!.Flight!.DepartureTime)
                .OrderBy(d => d)
                .FirstOrDefault();

            if (earliestDeparture == default || earliestDeparture <= DateTime.UtcNow)
            {
                preview.CanCancel = false;
                preview.CannotCancelReason = "Không thể hủy booking có chuyến bay đã khởi hành.";
                return preview;
            }

            // Tính số ngày trước khi bay
            var daysBefore = (int)Math.Floor((earliestDeparture - DateTime.UtcNow).TotalDays);
            preview.DaysBeforeDeparture = daysBefore;

            // Tính tổng đã thanh toán
            var totalPaid = await _context.Payments
                .Where(p => p.BookingId == bookingId && p.Status == PaymentStatus.Completed)
                .SumAsync(p => p.Amount);
            preview.TotalPaid = totalPaid;

            // Tìm CancellationPolicy phù hợp nhất
            // Policy áp dụng khi DaysBefore của policy <= daysBefore thực tế (lấy policy cao nhất)
            var policies = await _context.CancellationPolicies
                .OrderByDescending(p => p.DaysBefore)
                .ToListAsync();

            var applicablePolicy = policies.FirstOrDefault(p => daysBefore >= p.DaysBefore);

            if (applicablePolicy != null)
            {
                preview.RefundPercentage = applicablePolicy.RefundPercentage;
                preview.CancellationFee = applicablePolicy.FeeAmount;
                preview.RefundAmount = Math.Max(0,
                    totalPaid * applicablePolicy.RefundPercentage / 100m - applicablePolicy.FeeAmount);
                preview.PolicyDescription =
                    $"Hủy trước {applicablePolicy.DaysBefore} ngày bay: hoàn {applicablePolicy.RefundPercentage}%" +
                    (applicablePolicy.FeeAmount > 0 ? $", phí hủy {applicablePolicy.FeeAmount:N0}đ" : "");
            }
            else
            {
                // Không có policy phù hợp → không hoàn tiền
                preview.RefundPercentage = 0;
                preview.CancellationFee = totalPaid;
                preview.RefundAmount = 0;
                preview.PolicyDescription = "Hủy trong thời gian gần ngày bay: không hoàn tiền.";
            }

            return preview;
        }

        // ── Cancel ─────────────────────────────────────────────────────────────
        public async Task<CancellationResultDto> CancelBookingAsync(int bookingId, int userId, string reason)
        {
            var preview = await PreviewCancellationAsync(bookingId, userId);

            if (!preview.CanCancel)
                throw new BadRequestException(preview.CannotCancelReason ?? "Không thể hủy booking.");

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var booking = await _context.Bookings
                    .Include(b => b.Tickets)
                        .ThenInclude(t => t.FlightSeat)
                    .Include(b => b.User)
                    .FirstAsync(b => b.Id == bookingId);

                // 1. Cập nhật trạng thái booking
                booking.Status = BookingStatus.Cancelled;

                // 2. Giải phóng tất cả ghế
                foreach (var ticket in booking.Tickets)
                {
                    if (ticket.FlightSeat != null)
                        ticket.FlightSeat.Status = SeatStatus.Available;
                }

                // 3. Tạo BookingCancellation record
                _context.BookingCancellations.Add(new BookingCancellation
                {
                    BookingId = bookingId,
                    CancelledAt = DateTime.UtcNow,
                    Reason = string.IsNullOrWhiteSpace(reason) ? "Khách hàng yêu cầu hủy" : reason,
                    RefundAmount = preview.RefundAmount
                });

                // 4. Tạo Notification
                _context.NotificationLogs.Add(new NotificationLog
                {
                    UserId = booking.UserId,
                    Type = NotificationType.Push,
                    Subject = "Hủy vé thành công",
                    Content = $"Booking {booking.BookingCode} đã được hủy. Số tiền hoàn: {preview.RefundAmount:N0}đ.",
                    SentAt = DateTime.UtcNow,
                    IsRead = false
                });

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                // 5. Gửi email xác nhận hủy (ngoài transaction)
                if (!string.IsNullOrEmpty(booking.User?.Email))
                {
                    try
                    {
                        await _emailService.SendCancellationConfirmAsync(
                            booking.User.Email,
                            booking.User.FullName ?? "Khách hàng",
                            booking.BookingCode,
                            preview.RefundAmount,
                            reason,
                            preview.PolicyDescription);
                    }
                    catch
                    {
                        // Email fail không rollback nghiệp vụ
                    }
                }

                return new CancellationResultDto
                {
                    Success = true,
                    BookingCode = booking.BookingCode,
                    RefundAmount = preview.RefundAmount,
                    Message = preview.RefundAmount > 0
                        ? $"Hủy thành công. Bạn sẽ được hoàn {preview.RefundAmount:N0}đ trong 3-5 ngày làm việc."
                        : "Hủy thành công. Theo chính sách, đơn hàng này không được hoàn tiền.",
                    CancelledAt = DateTime.UtcNow
                };
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        // ── Hangfire: Nhắc nhở Deposit sắp hết hạn (còn < 24h) ───────────────
        public async Task<int> SendDepositRemindersAsync()
        {
            var now = DateTime.UtcNow;
            var reminderThreshold = now.AddHours(24); // Nhắc khi còn dưới 24h

            var expiringBookings = await _context.Bookings
                .Include(b => b.User)
                .Where(b => b.IsDepositBooking
                         && b.Status == BookingStatus.Pending
                         && b.DepositDeadline.HasValue
                         && b.DepositDeadline.Value > now
                         && b.DepositDeadline.Value <= reminderThreshold)
                .ToListAsync();

            int count = 0;
            foreach (var booking in expiringBookings)
            {
                if (booking.User?.Email == null || !booking.RemainingAmount.HasValue) continue;
                try
                {
                    await _emailService.SendDepositReminderAsync(
                        booking.User.Email,
                        booking.User.FullName ?? "Khách hàng",
                        booking.BookingCode,
                        booking.RemainingAmount.Value,
                        booking.DepositDeadline!.Value);
                    count++;
                }
                catch
                {
                    // Log failure, tiếp tục với booking tiếp theo
                }
            }
            return count;
        }

        // ── Hangfire: Auto-cancel Deposit quá hạn ─────────────────────────────
        public async Task<int> AutoCancelExpiredDepositsAsync()
        {
            var now = DateTime.UtcNow;

            var expiredBookings = await _context.Bookings
                .Include(b => b.Tickets)
                    .ThenInclude(t => t.FlightSeat)
                .Include(b => b.User)
                .Where(b => b.IsDepositBooking
                         && b.Status == BookingStatus.Pending
                         && b.DepositDeadline.HasValue
                         && b.DepositDeadline.Value <= now)
                .ToListAsync();

            int count = 0;
            foreach (var booking in expiredBookings)
            {
                try
                {
                    // Hủy booking và giải phóng ghế
                    booking.Status = BookingStatus.Cancelled;

                    foreach (var ticket in booking.Tickets)
                    {
                        if (ticket.FlightSeat != null)
                            ticket.FlightSeat.Status = SeatStatus.Available;
                    }

                    _context.BookingCancellations.Add(new BookingCancellation
                    {
                        BookingId = booking.Id,
                        CancelledAt = now,
                        Reason = "Hủy tự động: quá hạn thanh toán phần còn lại (72 giờ).",
                        RefundAmount = 0 // Deposit không hoàn tiền khi quá hạn
                    });

                    _context.NotificationLogs.Add(new NotificationLog
                    {
                        UserId = booking.UserId,
                        Type = NotificationType.Push,
                        Subject = "Booking bị hủy tự động",
                        Content = $"Booking {booking.BookingCode} đã bị hủy do quá hạn thanh toán 72 giờ.",
                        SentAt = now,
                        IsRead = false
                    });

                    await _context.SaveChangesAsync();

                    // Gửi email thông báo
                    if (!string.IsNullOrEmpty(booking.User?.Email))
                    {
                        try
                        {
                            await _emailService.SendDepositExpiredAsync(
                                booking.User.Email,
                                booking.User.FullName ?? "Khách hàng",
                                booking.BookingCode);
                        }
                        catch { /* Email fail không ảnh hưởng job */ }
                    }

                    count++;
                }
                catch
                {
                    // Tiếp tục với booking tiếp theo nếu có lỗi
                }
            }
            return count;
        }
    }
}
