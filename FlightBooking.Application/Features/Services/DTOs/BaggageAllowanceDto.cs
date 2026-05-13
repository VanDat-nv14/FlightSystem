using FlightBooking.Domain.Enums;

namespace FlightBooking.Application.Features.Services.DTOs
{
    public class BaggageAllowanceDto
    {
        public int Id { get; set; }
        public SeatClassType ClassType { get; set; }
        public int MaxWeight { get; set; }
        public int MaxPieces { get; set; }
        public decimal AdditionalFee { get; set; }
    }
}
