using FlightBooking.API.Controllers.Common;
using FlightBooking.Application.Features.Flights.DTOs;
using FlightBooking.Application.Features.Flights.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FlightBooking.API.Controllers.Flights
{
    [Route("api/[controller]")]
    [ApiController]
    public class AirlineController : BaseController
    {
        private readonly IAirlineService _airlineService;

        public AirlineController(IAirlineService airlineService)
        {
            _airlineService = airlineService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
            => OkResponse(await _airlineService.GetAllAsync(), "Lấy danh sách hãng bay thành công.");

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
            => OkResponse(await _airlineService.GetByIdAsync(id), "Lấy thông tin hãng bay thành công.");

        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Create([FromBody] CreateAirlineRequest request)
            => OkResponse(await _airlineService.CreateAsync(request), "Tạo hãng bay thành công.");

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateAirlineRequest request)
            => OkResponse(await _airlineService.UpdateAsync(id, request), "Cập nhật hãng bay thành công.");

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Delete(int id)
            => OkResponse(await _airlineService.DeleteAsync(id), "Xóa hãng bay thành công.");
    }
}
