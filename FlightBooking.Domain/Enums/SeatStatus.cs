namespace FlightBooking.Domain.Enums;

public enum SeatStatus
{
    Available = 0,  // Còn trống
    Reserved = 1,   // Đang giữ chỗ (chưa thanh toán)
    Booked = 2      // Đã đặt (đã thanh toán)
}
