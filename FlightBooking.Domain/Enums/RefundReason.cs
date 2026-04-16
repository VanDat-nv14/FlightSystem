namespace FlightBooking.Domain.Enums;

public enum RefundReason
{
    CancelledByCustomer = 0,    // Khách hủy
    FlightCancelled = 1,        // Hãng hủy chuyến
    FlightDelayed = 2,          // Chuyến bay trễ quá lâu
    Duplicate = 3,              // Đặt trùng
    Other = 4                   // Lý do khác
}
