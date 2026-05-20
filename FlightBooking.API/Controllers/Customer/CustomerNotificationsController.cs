using FlightBooking.API.Controllers.Common;
using FlightBooking.Application.Features.Customer.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace FlightBooking.API.Controllers.Customer
{
    [Authorize]
    public class CustomerNotificationsController : BaseController
    {
        private readonly ICustomerNotificationService _notificationService;

        public CustomerNotificationsController(ICustomerNotificationService notificationService)
        {
            _notificationService = notificationService;
        }

        [HttpGet]
        public async Task<IActionResult> GetMyNotifications()
        {
            var notifications = await _notificationService.GetMyNotificationsAsync(GetCurrentUserId());
            return OkResponse(notifications, "Lay danh sach thong bao thanh cong.");
        }

        [HttpGet("unread-count")]
        public async Task<IActionResult> GetUnreadCount()
        {
            var count = await _notificationService.GetUnreadCountAsync(GetCurrentUserId());
            return OkResponse(count, "Lay so thong bao chua doc thanh cong.");
        }

        [HttpPut("{id:int}/read")]
        public async Task<IActionResult> MarkAsRead(int id)
        {
            await _notificationService.MarkAsReadAsync(GetCurrentUserId(), id);
            return OkResponse(true, "Da danh dau thong bao la da doc.");
        }

        [HttpPut("read-all")]
        public async Task<IActionResult> MarkAllAsRead()
        {
            await _notificationService.MarkAllAsReadAsync(GetCurrentUserId());
            return OkResponse(true, "Da danh dau tat ca thong bao la da doc.");
        }

        private int GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)
                           ?? User.FindFirst(JwtRegisteredClaimNames.Sub);

            if (userIdClaim != null && int.TryParse(userIdClaim.Value, out var userId))
                return userId;

            throw new InvalidOperationException("Khong xac dinh duoc danh tinh nguoi dung.");
        }
    }
}
