using FlightBooking.API.Controllers.Common;
using FlightBooking.Application.Features.Account.DTOs;
using FlightBooking.Application.Features.Account.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FlightBooking.API.Controllers.Partner
{
    [Route("api/partner/team")]
    [ApiController]
    [Authorize(Roles = "AirlineManager")]
    public class PartnerTeamController : BaseController
    {
        private readonly IAccountService _accountService;

        public PartnerTeamController(IAccountService accountService)
        {
            _accountService = accountService;
        }

        [HttpGet]
        public async Task<IActionResult> GetTeam()
        {
            var data = await _accountService.GetAirlineUsersAsync(GetAirlineId());
            return OkResponse(data, "Lấy danh sách nhân sự thành công.");
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateUserRequest request)
        {
            var data = await _accountService.CreateAirlineUserAsync(GetAirlineId(), request);
            return OkResponse(data, "Tạo nhân sự thành công.");
        }

        [HttpPut("{id:int}")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateUserRequest request)
        {
            var data = await _accountService.UpdateAirlineUserAsync(GetAirlineId(), id, request);
            return OkResponse(data, "Cập nhật nhân sự thành công.");
        }

        [HttpPatch("{id:int}/toggle-lock")]
        public async Task<IActionResult> ToggleLock(int id)
        {
            var data = await _accountService.ToggleLockAirlineUserAsync(GetAirlineId(), id);
            return OkResponse(data, "Cập nhật trạng thái nhân sự thành công.");
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
