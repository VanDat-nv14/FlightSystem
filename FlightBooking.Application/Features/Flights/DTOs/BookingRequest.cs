using System;
using System.Collections.Generic;

namespace FlightBooking.Application.Features.Flights.DTOs
{
    public class CreateBookingRequest
    {
        public int FlightId { get; set; }
        public decimal TotalAmount { get; set; }
        public string PaymentType { get; set; } = "Full"; // Full, Deposit
        public List<BookingPassengerDto> Passengers { get; set; } = new();
    }

    public class BookingPassengerDto
    {
        public string Title { get; set; } = string.Empty;
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public DateTime DateOfBirth { get; set; }
        public string Nationality { get; set; } = "Vietnam";
        public string PassportNumber { get; set; } = string.Empty;
        public string SeatNumber { get; set; } = string.Empty;
    }

    public class BookingCreateResponse
    {
        public int BookingId { get; set; }
        public string Pnr { get; set; } = string.Empty;
        public decimal TotalAmount { get; set; }
        public string Status { get; set; } = string.Empty;
    }
}
