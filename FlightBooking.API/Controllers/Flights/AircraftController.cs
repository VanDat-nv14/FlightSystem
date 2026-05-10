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
    public class AircraftController : BaseController
    {
        private readonly IAircraftService _aircraftService;

        public AircraftController(IAircraftService aircraftService)
        {
            _aircraftService = aircraftService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAllAircrafts()
        {
            var aircrafts = await _aircraftService.GetAllAsync();
            return OkResponse(aircrafts, "Lấy thông tin tàu bay thành công.");
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetByID(int id)
        {
            var aircraft = await _aircraftService.GetByIdAsync(id);
            return OkResponse(aircraft, "Lấy tàu bay theo hãng thành công.");
        }

        [HttpGet("by-airline/{airlineId}")]
        public async Task<IActionResult> GetByAirline(int airlineId)
        {
            var aircrafts = await _aircraftService.GetByAirlineAsync(airlineId);
            return OkResponse(aircrafts, "Lấy tàu bay theo hãng thành công.");
        }

        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> CreateAircraft([FromBody] CreateAircraftRequest request)
        { 
            var aircraft = await _aircraftService.CreateAsync(request);
            return OkResponse(aircraft, "Tạo máy bay thành công.");
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateAircraft(int id, [FromBody] UpdateAircraftRequest request)
        {
            var aircraft = await _aircraftService.UpdateAsync(id, request);
            return OkResponse(aircraft, "Cập nhật máy bay thành công.");
        }
        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Delete(int id)
           => OkResponse(await _aircraftService.DeleteAsync(id), "Xóa tàu bay thành công.");
    }
}
