namespace FlightBooking.Application.Features.Account.DTOs
{
    public class UserProfileResponse
    {
        public int UserId { get; set; }
        public string Email { get; set; } = string.Empty;
        public string? PhoneNumber { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        // Profile Info
        public string? UrlAvatar { get; set; }
        public DateTime? DateOfBirth { get; set; }
        public string? Gender { get; set; } // Chuyển từ Enum gốc sang String
        public string? Nationality { get; set; }
        public string? IdCardNumber { get; set; }
        public string? PassportNumber { get; set; }
        public DateTime? PassportExpiry { get; set; }
    }
}
