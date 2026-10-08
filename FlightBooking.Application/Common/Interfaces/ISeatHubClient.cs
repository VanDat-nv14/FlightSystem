using System.Collections.Generic;
using System.Threading.Tasks;

namespace FlightBooking.Application.Common.Interfaces
{
    public interface ISeatHubClient
    {
        Task SeatHeld(int flightId, List<string> seatNumbers);
        Task SeatReleased(int flightId, List<string> seatNumbers);
        Task SeatBooked(int flightId, List<string> seatNumbers);
    }
}
