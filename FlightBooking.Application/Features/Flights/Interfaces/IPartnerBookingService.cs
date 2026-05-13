using FlightBooking.Application.Features.Flights.DTOs;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace FlightBooking.Application.Features.Flights.Interfaces
{
    public interface IPartnerBookingService
    {
        Task<List<PartnerTicketDto>> GetTicketsByAirlineAsync(int airlineId);
    }
}
