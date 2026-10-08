using FlightBooking.Application.Common.Interfaces;
using Microsoft.AspNetCore.SignalR;
using System.Threading.Tasks;

namespace FlightBooking.API.Hubs
{
    public class SeatHub : Hub<ISeatHubClient>
    {
        public async Task JoinFlight(int flightId)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, $"flight-{flightId}");
        }

        public async Task LeaveFlight(int flightId)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"flight-{flightId}");
        }
    }
}
