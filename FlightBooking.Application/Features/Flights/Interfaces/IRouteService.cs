using FlightBooking.Application.Features.Flights.DTOs;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FlightBooking.Application.Features.Flights.Interfaces
{
    public interface IRouteService
    {
            Task<List<RouteDto>> GetAllAsync();
            Task<RouteDto> GetByIdAsync(int id);
            Task<RouteDto> CreateAsync(CreateRouteRequest request);
            Task<bool> UpdateAsync(int id,UpdateRouteRequest request);
            Task<bool> DeleteAsync(int id);
    }
}
