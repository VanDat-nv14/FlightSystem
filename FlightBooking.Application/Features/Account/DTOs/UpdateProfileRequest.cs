using FlightBooking.Domain.Enums;

namespace FlightBooking.Application.Features.Account.DTOs
{
    public class UpdateProfileRequest
    {
        public string FullName { get; set; } = string.Empty;
        public string? PhoneNumber { get; set; }

        public DateTime? DateOfBirth { get; set; }
        public Gender? Gender { get; set; }
        public string? Nationality { get; set; }
        public string? IdCardNumber { get; set; }
        public string? PassportNumber { get; set; }
        public DateTime? PassportExpiry { get; set; }
        public string? UrlAvatar { get; set; }
    }
}
