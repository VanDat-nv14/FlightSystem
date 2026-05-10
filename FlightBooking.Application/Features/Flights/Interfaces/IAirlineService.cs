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
        Task<AirlineDto> CreateAsync(CreateAirlineRequest request);
        Task<bool> UpdateAsync(int id, UpdateAirlineRequest request);
        Task<bool> DeleteAsync(int id);
    }
}
