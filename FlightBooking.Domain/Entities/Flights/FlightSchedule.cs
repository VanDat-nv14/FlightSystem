using FlightBooking.Domain.Common;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FlightBooking.Domain.Entities.Flights
{
    public class FlightSchedule : BaseEntity    
    {
        public string FlightNumber { get; set; } = string.Empty;
        // Lưu dạng "1,3,5" = Thứ 2, Thứ 4, Thứ 6 (0=CN, 1=T2, ..., 6=T7)
        public string DaysOfWeek { get; set; } = string.Empty;
        public DateTime StartDate { get; set; }
        public DateTime? EndDate { get; set; }

        public int RouteId { get; set; }
        public Route? Route { get; set; }
        public int AircraftId { get; set; }
        public Aircraft? Aircraft { get; set; }
        public TimeSpan DepartureTime { get; set; }  // Giờ khởi hành hàng ngày
        public TimeSpan ArrivalTime { get; set; }    // Giờ hạ cánh hàng ngày
        public decimal BasePrice { get; set; }
        public bool IsActive { get; set; } = true;
        public int? AirlineId { get; set; }            // Hãng bay sở hữu lịch này
        public Airline? Airline { get; set; }

        public ICollection<Flight> Flights { get; set; } = new List<Flight>();
    }
}
