namespace FlightBooking.Application.Features.Services.DTOs
{
    public class AdditionalServiceDto
    {
        public int Id { get; set; }
        public string ServiceName { get; set; } = string.Empty;
        public string? Description { get; set; }
        public decimal Price { get; set; }
        public string ServiceType { get; set; } = string.Empty;
    }
}
