using FlightBooking.API.Controllers.Common;
using FlightBooking.Application.Features.Flights.DTOs;
using FlightBooking.Application.Features.Flights.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FlightBooking.API.Controllers.Flights
{
    [Route("api/[controller]")]
    [ApiController]
    public class SeatConfigurationController : BaseController
    {
        private readonly ISeatConfigurationService _seatConfigService;

        public SeatConfigurationController(ISeatConfigurationService seatConfigService)
        {
            _seatConfigService = seatConfigService;
        }

        [HttpGet("by-aircraft/{aircraftId}")]
        [Authorize(Roles = "Admin,AirlineManager")]
        public async Task<IActionResult> GetByAircraft(int aircraftId)
        {
            int? airlineId = null;
            if (User.IsInRole("AirlineManager"))
            {
                var claim = User.FindFirst("airlineId");
                if (claim != null) airlineId = int.Parse(claim.Value);
            }
            var configs = await _seatConfigService.GetByAircraftAsync(aircraftId, airlineId);
            return OkResponse(configs, "Lấy cấu hình ghế thành công.");
        }

        [HttpPost("bulk-create")]
        [Authorize(Roles = "Admin,AirlineManager")]
        public async Task<IActionResult> BulkCreate([FromBody] BulkCreateSeatConfigRequest request)
        {
            int? airlineId = null;
            if (User.IsInRole("AirlineManager"))
            {
                var claim = User.FindFirst("airlineId");
                if (claim != null) airlineId = int.Parse(claim.Value);
            }
            await _seatConfigService.BulkCreateAsync(request, airlineId);
            return OkResponse<object?>(null, "Tạo hàng loạt cấu hình ghế thành công.");
        }

        [HttpDelete("by-aircraft/{aircraftId}")]
        [Authorize(Roles = "Admin,AirlineManager")]
        public async Task<IActionResult> ClearByAircraft(int aircraftId)
        {
            int? airlineId = null;
            if (User.IsInRole("AirlineManager"))
            {
                var claim = User.FindFirst("airlineId");
                if (claim != null) airlineId = int.Parse(claim.Value);
            }
            await _seatConfigService.ClearByAircraftAsync(aircraftId, airlineId);
            return OkResponse<object?>(null, "Xóa cấu hình ghế thành công.");
        }
    }
}
