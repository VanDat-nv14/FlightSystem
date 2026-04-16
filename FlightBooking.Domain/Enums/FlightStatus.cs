namespace FlightBooking.Domain.Enums;

public enum FlightStatus
{
    Scheduled = 0,  // Đã lên lịch
    Delayed = 1,    // Trễ
    Cancelled = 2,  // Hủy
    Completed = 3,  // Hoàn thành
    Boarding = 4    // Đang lên máy bay
}
