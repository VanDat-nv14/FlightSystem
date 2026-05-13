using System;
using System.Collections.Generic;

namespace FlightBooking.Application.Features.Flights.DTOs
{
    public class AdminBookingDto
    {
        public int BookingId { get; set; }
        public string BookingStatus { get; set; } = string.Empty;
        public string BookingType { get; set; } = string.Empty;
        public DateTime BookingDate { get; set; }
        public decimal TotalAmount { get; set; }

        // Customer
        public int CustomerId { get; set; }
        public string CustomerName { get; set; } = string.Empty;
        public string CustomerEmail { get; set; } = string.Empty;

        // Tickets summary
        public int TicketCount { get; set; }
        public List<AdminTicketSummaryDto> Tickets { get; set; } = new();
    }

    public class AdminTicketSummaryDto
    {
        public int TicketId { get; set; }

        // Flight
        public string FlightNumber { get; set; } = string.Empty;
        public string AirlineName { get; set; } = string.Empty;
        public string AirlineCode { get; set; } = string.Empty;
        public string OriginCode { get; set; } = string.Empty;
        public string DestinationCode { get; set; } = string.Empty;
        public DateTime DepartureTime { get; set; }

        // Seat
        public string SeatNumber { get; set; } = string.Empty;
        public string SeatClass { get; set; } = string.Empty;
        public decimal SeatPrice { get; set; }

        // Passenger
        public string PassengerName { get; set; } = string.Empty;

        // Status
        public string CheckInStatus { get; set; } = string.Empty;
    }

    public class UpdateBookingStatusRequest
    {
        public string Status { get; set; } = string.Empty; // Confirmed, Cancelled, Refunded
    }
}
