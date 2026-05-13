using FlightBooking.Application.Features.Flights.DTOs;
using FlightBooking.Application.Features.Flights.Interfaces;
using FlightBooking.API.Controllers.Common;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FlightBooking.API.Controllers.Flights
{
    [ApiController]
    [Route("api/[controller]")]
    public class FlightController : BaseController
    {
        private readonly IFlightService _flightService;

        public FlightController(IFlightService flightService)
        {
            _flightService = flightService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
            => OkResponse(await _flightService.GetAllAsync(), "Lấy danh sách chuyến bay thành công.");

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
            => OkResponse(await _flightService.GetByIdAsync(id), "Lấy thông tin chuyến bay thành công.");

        [HttpGet("{id}/seats")]
        public async Task<IActionResult> GetSeats(int id)
            => OkResponse(await _flightService.GetSeatsByFlightIdAsync(id), "Lấy danh sách ghế chuyến bay thành công.");

        [HttpGet("by-airline/{airlineId}")]
        public async Task<IActionResult> GetByAirline(int airlineId)
            => OkResponse(await _flightService.GetByAirlineAsync(airlineId), "Lấy danh sách chuyến bay theo hãng thành công.");

        [HttpGet("search")]
        public async Task<IActionResult> Search([FromQuery] SearchFlightRequest request)
            => OkResponse(await _flightService.SearchAsync(request), "Tìm kiếm chuyến bay thành công.");

        [HttpPost]
        [Authorize(Roles = "Admin,AirlineManager")]
        public async Task<IActionResult> Create([FromBody] CreateFlightRequest request)
        {
            int? airlineId = null;
            if (User.IsInRole("AirlineManager"))
            {
                var claim = User.FindFirst("airlineId");
                if (claim != null) airlineId = int.Parse(claim.Value);
            }
            return OkResponse(await _flightService.CreateAsync(request, airlineId), "Tạo chuyến bay thành công.");
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin,Staff")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateFlightRequest request)
            => OkResponse(await _flightService.UpdateAsync(id, request), "Cập nhật chuyến bay thành công.");

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Delete(int id)
            => OkResponse(await _flightService.DeleteAsync(id), "Xóa chuyến bay thành công.");
    }
}
