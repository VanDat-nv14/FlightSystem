namespace FlightBooking.Domain.Enums;

public enum BookingStatus
{
    Pending = 0,    // Chờ thanh toán
    Confirmed = 1,  // Đã xác nhận
    Cancelled = 2,  // Đã hủy
    Completed = 3   // Hoàn thành (đã bay)
}
