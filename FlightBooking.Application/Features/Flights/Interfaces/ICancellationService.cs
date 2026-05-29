using FlightBooking.Application.Features.Flights.DTOs;

namespace FlightBooking.Application.Features.Flights.Interfaces
{
    public interface ICancellationService
    {
        /// <summary>Xem trước thông tin hủy vé (số tiền hoàn, phí hủy) trước khi xác nhận.</summary>
        Task<CancellationPreviewDto> PreviewCancellationAsync(int bookingId, int userId);

        /// <summary>Khách hàng hủy vé của mình, tính hoàn tiền theo CancellationPolicy.</summary>
        Task<CancellationResultDto> CancelBookingAsync(int bookingId, int userId, string reason);

        /// <summary>Hangfire Job: Gửi email nhắc nhở các Deposit booking sắp hết hạn (trong vòng 24h).</summary>
        Task<int> SendDepositRemindersAsync();

        /// <summary>Hangfire Job: Tự động hủy các Deposit booking đã quá hạn 72h mà chưa thanh toán đủ.</summary>
        Task<int> AutoCancelExpiredDepositsAsync();
    }
}
