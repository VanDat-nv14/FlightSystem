using System;
using System.ComponentModel.DataAnnotations;

namespace FlightBooking.Application.Features.Auth.DTOs
{
    public class FlightManagerRegisterRequest
    {
        [Required]
        [EmailAddress]
        [StringLength(100)]
        public string Email { get; set; } = string.Empty;

        [Required]
        [StringLength(100, MinimumLength = 6)]
        public string Password { get; set; } = string.Empty;

        [Required]
        [StringLength(100)]
        public string FullName { get; set; } = string.Empty;

        [Phone]
        public string? PhoneNumber { get; set; }

        [Required]
        public int AirlineId { get; set; }
    }
}
