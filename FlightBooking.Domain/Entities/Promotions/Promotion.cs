using FlightBooking.Domain.Common;
using FlightBooking.Domain.Entities.Flights;

namespace FlightBooking.Domain.Entities.Promotions
{
    public class Promotion : BaseEntity
    {
        public string Code { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public int DiscountPercent { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public string Status { get; set; } = "Active"; // Active | Paused | Expired

        // Hãng hàng không tạo ưu đãi (null = áp dụng toàn hệ thống)
        public int? AirlineId { get; set; }
        public Airline? Airline { get; set; }
    }
}
