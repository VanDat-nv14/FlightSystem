using FlightBooking.Application.Features.Customer.DTOs;

namespace FlightBooking.Application.Features.Customer.Interfaces
{
    public interface ICustomerNotificationService
    {
        Task<List<CustomerNotificationDto>> GetMyNotificationsAsync(int userId);
        Task<int> GetUnreadCountAsync(int userId);
        Task MarkAsReadAsync(int userId, int notificationId);
        Task MarkAllAsReadAsync(int userId);
    }
}
