using FlightBooking.Application.Features.Flights.DTOs;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FlightBooking.Application.Features.Flights.Interfaces
{
    public interface IAirlineService
    {
        Task<List<AirlineDto>> GetAllAsync();
        Task<AirlineDto> GetByIdAsync(int id);
        Task<AirlineDto> GetPartnerAirlineAsync(int airlineId);
        Task<AirlineDto> CreateAsync(CreateAirlineRequest request);
        Task<bool> UpdateAsync(int id, UpdateAirlineRequest request);
        Task<AirlineDto> UpdatePartnerAirlineAsync(int airlineId, UpdateAirlineRequest request);
        Task<bool> UpdateStatusAsync(int id, UpdateAirlineStatusRequest request);
        Task<bool> DeleteAsync(int id);
    }
}
