namespace FlightBooking.Application.Features.Promotions.DTOs
{
    public class PromotionDto
    {
        public int Id { get; set; }
        public string Code { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public int DiscountPercent { get; set; }
        public string StartDate { get; set; } = string.Empty;
        public string EndDate { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public int? AirlineId { get; set; }
        public string? AirlineName { get; set; }
        public string? AirlineLogoUrl { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class CreatePromotionRequest
    {
        public string Code { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public int DiscountPercent { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public string Status { get; set; } = "Active";
    }

    public class UpdatePromotionRequest
    {
        public string Name { get; set; } = string.Empty;
        public int DiscountPercent { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public string Status { get; set; } = "Active";
    }
}
