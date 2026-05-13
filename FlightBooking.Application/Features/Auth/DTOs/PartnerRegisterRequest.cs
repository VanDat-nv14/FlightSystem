using System;
using System.ComponentModel.DataAnnotations;

namespace FlightBooking.Application.Features.Auth.DTOs
{
    public class PartnerRegisterRequest
    {
        // Airline Information
        [Required]
        [StringLength(100)]
        public string AirlineName { get; set; } = string.Empty;

        [Required]
        [StringLength(10)]
        public string AirlineCode { get; set; } = string.Empty;

        [Required]
        [StringLength(100)]
        public string Country { get; set; } = string.Empty;

        // Manager Information
        [Required]
        [StringLength(100)]
        public string FullName { get; set; } = string.Empty;

        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;

        [Required]
        [StringLength(100, MinimumLength = 6)]
        public string Password { get; set; } = string.Empty;

        [Phone]
        public string? PhoneNumber { get; set; }
    }
}
