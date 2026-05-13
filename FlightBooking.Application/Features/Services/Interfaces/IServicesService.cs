using FlightBooking.Application.Features.Services.DTOs;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace FlightBooking.Application.Features.Services.Interfaces
{
    public interface IServicesService
    {
        Task<List<AdditionalServiceDto>> GetAdditionalServicesAsync();
        Task<List<BaggageAllowanceDto>> GetBaggageAllowancesAsync();
    }
}
