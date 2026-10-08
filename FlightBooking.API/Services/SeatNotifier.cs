using FlightBooking.API.Hubs;
using FlightBooking.Application.Common.Interfaces;
using Microsoft.AspNetCore.SignalR;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace FlightBooking.API.Services
{
    public class SeatNotifier : ISeatNotifier
    {
        private readonly IHubContext<SeatHub, ISeatHubClient> _hubContext;

        public SeatNotifier(IHubContext<SeatHub, ISeatHubClient> hubContext)
        {
            _hubContext = hubContext;
        }

        public async Task NotifySeatHeldAsync(int flightId, List<string> seatNumbers)
        {
            await _hubContext.Clients.Group($"flight-{flightId}").SeatHeld(flightId, seatNumbers);
        }

        public async Task NotifySeatReleasedAsync(int flightId, List<string> seatNumbers)
        {
            await _hubContext.Clients.Group($"flight-{flightId}").SeatReleased(flightId, seatNumbers);
        }

        public async Task NotifySeatBookedAsync(int flightId, List<string> seatNumbers)
        {
            await _hubContext.Clients.Group($"flight-{flightId}").SeatBooked(flightId, seatNumbers);
        }
    }
}
