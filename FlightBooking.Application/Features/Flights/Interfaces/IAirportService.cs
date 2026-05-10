using FlightBooking.Application.Features.Flights.DTOs;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FlightBooking.Application.Features.Flights.Interfaces
{
    public interface IAirportService
    {
        Task<List<AirportDto>> GetAllAsync();
        Task<AirportDto> GetByIdAsync(int id);
        Task<AirportDto> CreateAsync(CreateAirportRequest request);
        Task<bool> UpdateAsync(int id,UpdateAirportRequest request);
        Task<bool> DeleteAsync(int id);
    }
}
