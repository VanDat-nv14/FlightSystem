using System;
using System.Collections.Generic;

namespace FlightBooking.Application.Features.Flights.DTOs
{
    public class PartnerDashboardDto
    {
        // KPIs
        public decimal TotalRevenue { get; set; }
        public decimal TodayRevenue { get; set; }
        public int TotalTickets { get; set; }
        public int TodayTickets { get; set; }
        public int TotalFlights { get; set; }
        public int TodayFlights { get; set; }
        public int TotalAircrafts { get; set; }
        public double LoadFactor { get; set; } // %

        // Upcoming flights (next 5)
        public List<UpcomingFlightDto> UpcomingFlights { get; set; } = new();

        // Revenue last 7 days
        public List<DailyRevenueDto> RevenueChart { get; set; } = new();

        // Seat class breakdown
        public int EconomyTickets { get; set; }
        public int BusinessTickets { get; set; }
        public int FirstClassTickets { get; set; }
    }

    public class UpcomingFlightDto
    {
        public int FlightId { get; set; }
        public string FlightNumber { get; set; } = string.Empty;
        public string OriginCode { get; set; } = string.Empty;
        public string DestinationCode { get; set; } = string.Empty;
        public DateTime DepartureTime { get; set; }
        public string AircraftModel { get; set; } = string.Empty;
        public int TotalSeats { get; set; }
        public int BookedSeats { get; set; }
        public string Status { get; set; } = string.Empty;
    }

    public class DailyRevenueDto
    {
        public string Date { get; set; } = string.Empty; // "dd/MM"
        public decimal Revenue { get; set; }
        public int Tickets { get; set; }
    }
}
