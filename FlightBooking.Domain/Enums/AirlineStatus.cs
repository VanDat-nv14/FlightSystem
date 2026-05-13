namespace FlightBooking.Domain.Enums;

public enum AirlineStatus
{
    Pending = 0,    // Chờ phê duyệt
    Approved = 1,   // Đã phê duyệt
    Rejected = 2,   // Từ chối
    Suspended = 3   // Tạm ngưng
}
