using FlightBooking.Domain.Common;
using FlightBooking.Domain.Entities.Seats;
using FlightBooking.Domain.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FlightBooking.Domain.Entities.Flights
{
    public class Flight : BaseEntity    
    {
        public FlightSchedule? Schedule { get; set; }
        public int RouteId { get; set; }
        public Route? Route { get; set; } // Navigation property
        public int AircraftId { get; set; }
        public Aircraft? Aircraft { get; set; } // Navigation property
        public int? ScheduleId { get; set; }
        public DateTime DepartureTime { get; set; }
        public DateTime ArrivalTime { get; set; }
        public decimal BasePrice { get; set; }

        public string FlightNumber { get; set; } = string.Empty;

        public FlightStatus Status { get; set; } = FlightStatus.Scheduled;

        // Navigation
        public ICollection<FlightSeat> FlightSeats { get; set; } = new List<FlightSeat>();
    }
}
