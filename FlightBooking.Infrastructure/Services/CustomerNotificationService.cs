using FlightBooking.Application.Features.Customer.DTOs;
using FlightBooking.Application.Features.Customer.Interfaces;
using FlightBooking.Application.Common.Exceptions;
using FlightBooking.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace FlightBooking.Infrastructure.Services
{
    public class CustomerNotificationService : ICustomerNotificationService
    {
        private readonly FlightBookingDbContext _context;

        public CustomerNotificationService(FlightBookingDbContext context)
        {
            _context = context;
        }

        public async Task<List<CustomerNotificationDto>> GetMyNotificationsAsync(int userId)
        {
            return await _context.NotificationLogs
                .AsNoTracking()
                .Where(n => n.UserId == userId)
                .OrderByDescending(n => n.SentAt)
                .Take(50)
                .Select(n => new CustomerNotificationDto
                {
                    Id = n.Id,
                    Type = n.Type.ToString(),
                    Subject = n.Subject,
                    Content = n.Content,
                    SentAt = n.SentAt,
                    IsRead = n.IsRead
                })
                .ToListAsync();
        }

        public async Task<int> GetUnreadCountAsync(int userId)
        {
            return await _context.NotificationLogs
                .CountAsync(n => n.UserId == userId && !n.IsRead);
        }

        public async Task MarkAsReadAsync(int userId, int notificationId)
        {
            var notification = await _context.NotificationLogs
                .FirstOrDefaultAsync(n => n.Id == notificationId && n.UserId == userId)
                ?? throw new NotFoundException("Notification", notificationId);

            notification.IsRead = true;
            await _context.SaveChangesAsync();
        }

        public async Task MarkAllAsReadAsync(int userId)
        {
            await _context.NotificationLogs
                .Where(n => n.UserId == userId && !n.IsRead)
                .ExecuteUpdateAsync(setters => setters.SetProperty(n => n.IsRead, true));
        }
    }
}
