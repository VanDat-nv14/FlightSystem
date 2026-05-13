using FlightBooking.Domain.Enums;
using System.ComponentModel.DataAnnotations;

namespace FlightBooking.Application.Features.Flights.DTOs
{
    public class SeatConfigurationDto
    {
        public int Id { get; set; }
        public int AircraftId { get; set; }
        public string SeatNumber { get; set; } = string.Empty;
        public decimal PriceMultiplier { get; set; }
        public string ClassType { get; set; } = string.Empty;
        public string Position { get; set; } = string.Empty;
    }

    public class ClassConfigurationRequest
    {
        [Required]
        public string ClassType { get; set; } = string.Empty; // Economy, Business, FirstClass
        
        [Required]
        [Range(1, 1000)]
        public int NumberOfSeats { get; set; }
        
        [Required]
        [Range(0.1, 100.0)]
        public decimal PriceMultiplier { get; set; }
    }

    public class BulkCreateSeatConfigRequest
    {
        [Required]
        public int AircraftId { get; set; }
        
        [Required]
        [Range(1, 10)]
        public int SeatsPerRow { get; set; } // Ví dụ: 6 ghế một hàng (ABC-DEF)

        [Required]
        [MinLength(1)]
        public List<ClassConfigurationRequest> Classes { get; set; } = new();
    }
}
