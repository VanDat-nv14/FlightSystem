namespace FlightBooking.Application.Features.Customer.DTOs
{
    public class CustomerNotificationDto
    {
        public int Id { get; set; }
        public string Type { get; set; } = string.Empty;
        public string Subject { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
        public DateTime SentAt { get; set; }
        public bool IsRead { get; set; }
    }
}
