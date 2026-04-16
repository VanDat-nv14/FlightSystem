namespace FlightBooking.Domain.Enums;

public enum RefundStatus
{
    Pending = 0,    // Chờ xử lý
    Approved = 1,   // Đã duyệt
    Processing = 2, // Đang hoàn tiền
    Completed = 3,  // Hoàn thành
    Rejected = 4    // Từ chối
}
