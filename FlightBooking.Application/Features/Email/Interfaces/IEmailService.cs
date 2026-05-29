namespace FlightBooking.Application.Features.Email.Interfaces
{
    public interface IEmailService
    {
        /// <summary>Gửi email xác nhận đặt vé thành công.</summary>
        Task SendBookingConfirmAsync(string toEmail, string fullName, string bookingCode,
            decimal totalAmount, bool isDeposit, decimal? depositPaid, DateTime? depositDeadline);

        /// <summary>Gửi email nhắc nhở thanh toán phần còn lại của Deposit booking.</summary>
        Task SendDepositReminderAsync(string toEmail, string fullName, string bookingCode,
            decimal remainingAmount, DateTime deadline);

        /// <summary>Gửi email xác nhận hủy vé và hoàn tiền.</summary>
        Task SendCancellationConfirmAsync(string toEmail, string fullName, string bookingCode,
            decimal refundAmount, string reason, string policyDescription);

        /// <summary>Gửi email thông báo booking bị tự động hủy do quá hạn Deposit.</summary>
        Task SendDepositExpiredAsync(string toEmail, string fullName, string bookingCode);
    }
}
