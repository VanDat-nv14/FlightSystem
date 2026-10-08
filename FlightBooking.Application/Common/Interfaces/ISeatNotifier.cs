using System.Collections.Generic;
using System.Threading.Tasks;

namespace FlightBooking.Application.Common.Interfaces
{
    public interface ISeatNotifier
    {
        Task NotifySeatHeldAsync(int flightId, List<string> seatNumbers);
        Task NotifySeatReleasedAsync(int flightId, List<string> seatNumbers);
        Task NotifySeatBookedAsync(int flightId, List<string> seatNumbers);
    }
}
