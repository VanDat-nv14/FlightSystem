namespace FlightBooking.Application.Features.Customer.DTOs
{
    public class CustomerFavoriteDto
    {
        public int Id { get; set; }
        public string ItemType { get; set; } = string.Empty;
        public int ItemId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? Subtitle { get; set; }
        public string? ImageUrl { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class ToggleFavoriteRequest
    {
        public string ItemType { get; set; } = string.Empty;
        public int ItemId { get; set; }
    }

    public class ToggleFavoriteResponse
    {
        public bool IsFavorited { get; set; }
        public CustomerFavoriteDto? Favorite { get; set; }
    }
}
