using FlightBooking.API.Controllers.Common;
using FlightBooking.Application.Features.Flights.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FlightBooking.API.Controllers.Partner
{
    [Route("api/partner/dashboard")]
    [ApiController]
    [Authorize(Roles = "Admin,AirlineManager")]
    public class PartnerDashboardController : BaseController
    {
        private readonly IPartnerDashboardService _dashboardService;

        public PartnerDashboardController(IPartnerDashboardService dashboardService)
        {
            _dashboardService = dashboardService;
        }

        [HttpGet]
        public async Task<IActionResult> GetDashboard()
        {
            var claim = User.FindFirst("airlineId");
            if (claim == null || !int.TryParse(claim.Value, out int airlineId))
                return BadRequest("Không tìm thấy thông tin hãng bay trong token.");

            var data = await _dashboardService.GetDashboardAsync(airlineId);
            return OkResponse(data, "Lấy dữ liệu dashboard thành công.");
        }
    }
}
