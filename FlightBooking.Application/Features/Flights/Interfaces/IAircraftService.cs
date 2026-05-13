using FlightBooking.Application.Features.Flights.DTOs;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FlightBooking.Application.Features.Flights.Interfaces
{
    public interface IAircraftService
    {
        Task<List<AircraftDto>> GetAllAsync();
        Task<AircraftDto> GetByIdAsync(int id);
        Task<AircraftDto> CreateAsync(CreateAircraftRequest request, int? currentAirlineId = null);
        Task<bool> UpdateAsync(int id, UpdateAircraftRequest request, int? currentAirlineId = null);
        Task<List<AircraftDto>> GetByAirlineAsync(int airlineId);
        Task<bool> DeleteAsync(int id, int? currentAirlineId = null);
    }
}
