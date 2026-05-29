using FlightBooking.Application.Features.Flights.DTOs;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace FlightBooking.Application.Features.Flights.Interfaces
{
    public interface IFlightScheduleService
    {
        Task<List<FlightScheduleDto>> GetAllAsync();
        Task<List<FlightScheduleDto>> GetByAirlineAsync(int airlineId);
        Task<FlightScheduleDto> CreateAsync(CreateFlightScheduleRequest request, int? airlineId);
        Task<bool> UpdateAsync(int id, UpdateFlightScheduleRequest request);
        Task<bool> DeleteAsync(int id);
        Task<int> GenerateFlightsForDateAsync(DateTime date); // Manual trigger
        Task<int> EnsureNext30DaysAsync(); // Hangfire job
    }
}
