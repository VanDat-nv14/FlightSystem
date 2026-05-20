using FlightBooking.Domain.Common;

namespace FlightBooking.Domain.Entities.Users
{
    public class FavoriteItem : BaseEntity
    {
        public int UserId { get; set; }
        public ApplicationUser? User { get; set; }
        public string ItemType { get; set; } = string.Empty;
        public int ItemId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? Subtitle { get; set; }
        public string? ImageUrl { get; set; }
    }
}
