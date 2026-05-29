namespace FlightBooking.Application.Features.Flights.DTOs
{
    /// <summary>Kết quả xem trước hủy vé: số tiền được hoàn, phí hủy, policy áp dụng.</summary>
    public class CancellationPreviewDto
    {
        public int BookingId { get; set; }
        public string BookingCode { get; set; } = string.Empty;
        public decimal TotalPaid { get; set; }
        public decimal CancellationFee { get; set; }
        public decimal RefundAmount { get; set; }
        public decimal RefundPercentage { get; set; }
        public int DaysBeforeDeparture { get; set; }
        public string PolicyDescription { get; set; } = string.Empty;
        public bool CanCancel { get; set; }
        public string? CannotCancelReason { get; set; }
    }

    /// <summary>Kết quả sau khi hủy vé thành công.</summary>
    public class CancellationResultDto
    {
        public bool Success { get; set; }
        public string BookingCode { get; set; } = string.Empty;
        public decimal RefundAmount { get; set; }
        public string Message { get; set; } = string.Empty;
        public DateTime CancelledAt { get; set; }
    }
}
