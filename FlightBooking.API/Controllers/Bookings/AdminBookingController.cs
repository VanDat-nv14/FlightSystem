using FlightBooking.API.Controllers.Common;
using FlightBooking.Application.Features.Flights.DTOs;
using FlightBooking.Application.Features.Flights.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FlightBooking.API.Controllers.Bookings
{
    [Route("api/admin/bookings")]
    [ApiController]
    [Authorize(Roles = "Admin")]
    public class AdminBookingController : BaseController
    {
        private readonly IAdminBookingService _adminBookingService;

        public AdminBookingController(IAdminBookingService adminBookingService)
        {
            _adminBookingService = adminBookingService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
            => OkResponse(await _adminBookingService.GetAllAsync(), "Lấy danh sách booking thành công.");

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
            => OkResponse(await _adminBookingService.GetByIdAsync(id), "Lấy chi tiết booking thành công.");

        [HttpPatch("{id}/status")]
        public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdateBookingStatusRequest request)
            => OkResponse(await _adminBookingService.UpdateStatusAsync(id, request), "Cập nhật trạng thái booking thành công.");
    }
}
