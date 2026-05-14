using FlightBooking.API.Controllers.Common;
using FlightBooking.Application.Features.Flights.DTOs;
using FlightBooking.Application.Features.Flights.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FlightBooking.API.Controllers.Partner
{
    [Route("api/partner/airline")]
    [ApiController]
    [Authorize(Roles = "AirlineManager")]
    public class PartnerAirlineController : BaseController
    {
        private readonly IAirlineService _airlineService;

        public PartnerAirlineController(IAirlineService airlineService)
        {
            _airlineService = airlineService;
        }

        [HttpGet]
        public async Task<IActionResult> GetMyAirline()
        {
            var airlineId = GetAirlineId();
            var data = await _airlineService.GetPartnerAirlineAsync(airlineId);
            return OkResponse(data, "Lấy thông tin hãng bay thành công.");
        }

        [HttpPut]
        public async Task<IActionResult> UpdateMyAirline([FromBody] UpdateAirlineRequest request)
        {
            var airlineId = GetAirlineId();
            var data = await _airlineService.UpdatePartnerAirlineAsync(airlineId, request);
            return OkResponse(data, "Cập nhật thông tin hãng bay thành công.");
        }

        private int GetAirlineId()
        {
            var claim = User.FindFirst("airlineId");
            if (claim == null || !int.TryParse(claim.Value, out var airlineId))
                throw new UnauthorizedAccessException("Không tìm thấy thông tin hãng bay trong token.");

            return airlineId;
        }
    }
}
