using FlightBooking.Application.Features.Flights.DTOs;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace FlightBooking.Application.Features.Flights.Interfaces
{
    public interface IAdminBookingService
    {
        Task<List<AdminBookingDto>> GetAllAsync();
        Task<AdminBookingDto> GetByIdAsync(int bookingId);
        Task<bool> UpdateStatusAsync(int bookingId, UpdateBookingStatusRequest request);
    }
}
