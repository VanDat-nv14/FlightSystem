using System;
using System.Collections.Generic;

namespace FlightBooking.Application.Features.Flights.DTOs
{
    public class UpdateTicketCheckInStatusRequest
    {
        public string CheckInStatus { get; set; } = string.Empty;
    }

    public class PartnerBookingDto
    {
        public int BookingId { get; set; }
        public string BookingStatus { get; set; } = string.Empty;
        public DateTime BookingDate { get; set; }
        public decimal TotalAmount { get; set; }

        // Customer info
        public string CustomerName { get; set; } = string.Empty;
        public string CustomerEmail { get; set; } = string.Empty;

        // Tickets on this airline's flights
        public List<PartnerTicketDto> Tickets { get; set; } = new();
    }

    public class PartnerTicketDto
    {
        public int TicketId { get; set; }
        public int BookingId { get; set; }
        public string BookingCode { get; set; } = string.Empty;
        public string BookingStatus { get; set; } = string.Empty;
        public DateTime BookingDate { get; set; }
        public decimal BookingTotalAmount { get; set; }

        // Booker info
        public string BookerName { get; set; } = string.Empty;
        public string BookerEmail { get; set; } = string.Empty;
        public string? BookerPhoneNumber { get; set; }

        // Flight info
        public int FlightId { get; set; }
        public string FlightNumber { get; set; } = string.Empty;
        public string OriginCode { get; set; } = string.Empty;
        public string DestinationCode { get; set; } = string.Empty;
        public DateTime DepartureTime { get; set; }
        public DateTime ArrivalTime { get; set; }

        // Seat info
        public string SeatNumber { get; set; } = string.Empty;
        public string SeatClass { get; set; } = string.Empty;
        public decimal SeatPrice { get; set; }

        // Passenger info
        public string PassengerName { get; set; } = string.Empty;
        public string PassengerPassport { get; set; } = string.Empty;
        public string PassengerNationality { get; set; } = string.Empty;
        public DateTime? PassengerDateOfBirth { get; set; }
        public string PassengerGender { get; set; } = string.Empty;

        // Status
        public string CheckInStatus { get; set; } = string.Empty;
    }
}
