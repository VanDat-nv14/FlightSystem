namespace FlightBooking.Domain.Enums;

public enum PaymentStatus
{
    Pending = 0,    // Chờ thanh toán
    Processing = 1, // Đang xử lý
    Completed = 2,  // Thành công
    Failed = 3,     // Thất bại
    Refunded = 4    // Đã hoàn tiền
}
