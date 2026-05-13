using FlightBooking.Application.Features.Flights.DTOs;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FlightBooking.Application.Features.Flights.Interfaces
{
    public interface ISeatConfigurationService
    {
        Task<List<SeatConfigurationDto>> GetByAircraftAsync(int aircraftId, int? currentAirlineId = null);
        Task<bool> BulkCreateAsync(BulkCreateSeatConfigRequest request, int? currentAirlineId = null);
        Task<bool> ClearByAircraftAsync(int aircraftId, int? currentAirlineId = null);
    }
}
