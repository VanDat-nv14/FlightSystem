using FlightBooking.API.Controllers.Common;
using FlightBooking.Application.Features.Flights.DTOs;
using FlightBooking.Application.Features.Flights.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FlightBooking.API.Controllers.Flights
{
    [Route("api/[controller]")]
    [ApiController]
    public class RouteController : BaseController
    {
        private readonly IRouteService _routeService;

        public RouteController(IRouteService routeService)
        {
            _routeService = routeService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
            => OkResponse(await _routeService.GetAllAsync(), "Lấy danh sách tuyến bay thành công.");

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
            => OkResponse(await _routeService.GetByIdAsync(id), "Lấy thông tin tuyến bay thành công.");

        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Create([FromBody] CreateRouteRequest request)
            => OkResponse(await _routeService.CreateAsync(request), "Tạo tuyến bay thành công.");

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateRouteRequest request)
            => OkResponse(await _routeService.UpdateAsync(id, request), "Cập nhật tuyến bay thành công.");

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Delete(int id)
            => OkResponse(await _routeService.DeleteAsync(id), "Xóa tuyến bay thành công.");
    }
}
