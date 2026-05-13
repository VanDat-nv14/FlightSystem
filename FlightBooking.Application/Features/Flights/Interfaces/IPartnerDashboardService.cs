using FlightBooking.Application.Features.Flights.DTOs;
using System.Threading.Tasks;

namespace FlightBooking.Application.Features.Flights.Interfaces
{
    public interface IPartnerDashboardService
    {
        Task<PartnerDashboardDto> GetDashboardAsync(int airlineId);
    }
}
