using FlightBooking.Domain.Common;
using FlightBooking.Domain.Entities.Seats;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FlightBooking.Domain.Entities.Flights
{
    public class Aircraft : BaseEntity
    {
        public required string Model { get; set; }
        public int TotalSeats { get; set; }

        public int AirlineId { get; set; }
        public Airline? Airline { get; set; } // Navigation property

       

        // Tạm thời comment lại nếu bạn chưa viết Entities cho phân hệ Seats/Flights
        public ICollection<SeatConfiguration> SeatConfigurations { get; set; } = new List<SeatConfiguration>();
        public ICollection<Flight> Flights { get; set; } = new List<Flight>();
        public bool IsActive { get; set; }
        public string RegistrationNumber { get; set; }
    }
}
