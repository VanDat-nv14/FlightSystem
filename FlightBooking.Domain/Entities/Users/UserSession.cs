using FlightBooking.Domain.Common;
using FlightBooking.Domain.Entities.Users;
using FlightBooking.Domain.Enums;


namespace FlightBooking.Domain.Entities.Users
{
    public class UserSession : BaseEntity
    {
        public int UserId { get; set; }
        public ApplicationUser? User { get; set; }

        public string RefreshToken { get; set; } = string.Empty;
        public string? DeviceInfo { get; set; }
        public DeviceType? DeviceType { get; set; }
        public string? IPAddress { get; set; }
        public DateTime ExpiresAt { get; set; }
        public bool IsRevoked { get; set; } = false;
        public DateTime? RevokedAt { get; set; }
        public string? RevokeReason { get; set; }
    }
}
