using FlightBooking.Application.Features.Flights.DTOs;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FlightBooking.Application.Features.Flights.Interfaces
{
    public interface IFlightService
    {
            Task<List<FlightDto>> GetAllAsync();
            Task<FlightDto> GetByIdAsync(int id);
            Task<List<FlightDto>> GetByAirlineAsync(int airlineId);
            Task<FlightDto> CreateAsync(CreateFlightRequest request, int? currentAirlineId = null);
            Task<bool> UpdateAsync(int id, UpdateFlightRequest request);
            Task<List<FlightDto>> SearchAsync(SearchFlightRequest request);
            Task<bool> DeleteAsync(int id);
            Task<List<FlightSeatDto>> GetSeatsByFlightIdAsync(int flightId);
            Task<bool> HoldSeatsAsync(int flightId, List<string> seatNumbers);
            Task ReleaseHeldSeatsAsync(int flightId, List<string> seatNumbers);
            Task<bool> UpdateStatusAsync(int id, string newStatus, string? airportCode, string userRole, int? currentAirlineId = null, string? delayReason = null);
            Task<List<FlightDto>> GetByAirportAsync(string airportCode);
            Task<int> AutoCompleteArrivedFlightsAsync();
    }
}
