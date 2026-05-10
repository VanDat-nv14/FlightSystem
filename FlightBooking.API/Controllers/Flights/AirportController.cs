using FlightBooking.API.Controllers.Common;
using FlightBooking.Application.Features.Flights.DTOs;
using FlightBooking.Application.Features.Flights.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace FlightBooking.API.Controllers.Flights
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class AirportController : BaseController
    {
        private readonly IAirportService _airportService;

        public AirportController(IAirportService airportService)
        {
            _airportService = airportService;
        }

        [HttpGet]
        [AllowAnonymous]
        public async Task<IActionResult> GetAllAsync()
        {
            var result = await _airportService.GetAllAsync();
            return OkResponse(result, "Lấy danh sách sân bay thành công.");
        }

        [HttpGet("{id}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetByIdAsync(int id)
        {
            try
            {
                var result = await _airportService.GetByIdAsync(id);
                return OkResponse(result, "Lấy thông tin sân bay thành công.");
            }
            catch (Exception ex)
            {
                return ErrorResponse(ex.Message, 404);
            }
        }

        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Create([FromBody] CreateAirportRequest request)
        {
            var result = await _airportService.CreateAsync(request);
            return OkResponse(result, "Tạo sân bay thành công.");
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateAirportRequest request)
        {
            var result = await _airportService.UpdateAsync(id, request);
            return OkResponse(result, "Cập nhật sân bay thành công.");
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Delete(int id)
        {
            var result = await _airportService.DeleteAsync(id);
            return OkResponse(result, "Xóa sân bay thành công.");
        }
    }
}

