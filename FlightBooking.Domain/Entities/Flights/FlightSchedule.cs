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

        public ICollection<Flight> Flights { get; set; } = new List<Flight>();
    }
}
