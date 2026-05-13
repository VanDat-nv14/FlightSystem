using FlightBooking.API.Controllers.Common;
using FlightBooking.Application.Features.Flights.Interfaces;
using FlightBooking.Application.Features.Flights.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using System.IdentityModel.Tokens.Jwt;

namespace FlightBooking.API.Controllers.Bookings
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class BookingController : BaseController
    {
        private readonly IBookingService _bookingService;

        public BookingController(IBookingService bookingService)
        {
            _bookingService = bookingService;
        }

        private int GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)
                           ?? User.FindFirst(JwtRegisteredClaimNames.Sub);
            
            if (userIdClaim != null && int.TryParse(userIdClaim.Value, out int userId))
                return userId;

            throw new Exception("Không xác định được danh tính người dùng.");
        }

        [HttpGet("my-bookings")]
        public async Task<IActionResult> GetMyBookings()
        {
            try
            {
                var userId = GetCurrentUserId();
                var bookings = await _bookingService.GetMyBookingsAsync(userId);
                return OkResponse(bookings, "Lấy danh sách booking của bạn thành công.");
            }
            catch (Exception ex)
            {
                return ErrorResponse(ex.Message, 400);
            }
        }

        [HttpPost("create")]
        public async Task<IActionResult> CreateBooking([FromBody] CreateBookingRequest request)
        {
            try
            {
                var userId = GetCurrentUserId();
                var result = await _bookingService.CreateAsync(request, userId);
                return OkResponse(result, "Đặt vé thành công.");
            }
            catch (Exception ex)
            {
                return ErrorResponse(ex.Message, 400);
            }
        }
    }
}
