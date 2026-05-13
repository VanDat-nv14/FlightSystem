using FlightBooking.Application.Features.Flights.DTOs;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace FlightBooking.Application.Features.Flights.Interfaces
{
    public interface IBookingService
    {
        Task<List<AdminBookingDto>> GetMyBookingsAsync(int userId);
        Task<BookingCreateResponse> CreateAsync(CreateBookingRequest request, int userId);
    }
}
