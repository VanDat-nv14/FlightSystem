using FlightBooking.API.Controllers.Common;
using FlightBooking.Application.Features.Account.DTOs;
using FlightBooking.Application.Features.Account.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace FlightBooking.API.Controllers.Account
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class AccountController : BaseController
    {
        private readonly IAccountService? _accountService;
        public AccountController(IAccountService accountService)
        {
            _accountService = accountService;
        }
        private int GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)
                           ?? User.FindFirst(JwtRegisteredClaimNames.Sub);
            if (userIdClaim != null && int.TryParse(userIdClaim.Value, out int userId))
                return userId;

            throw new Exception("Không xác định được danh tính người dùng.");
        }

        [HttpGet("profile")]
        public async Task<IActionResult> GetProfile()
        {
            try
            {
                var userId = GetCurrentUserId(); 
                var profile = await _accountService.GetUserProfileAsync(userId);
                return OkResponse(profile, "Lấy thông tin thành công");
            }
            catch (Exception ex)
            {
                return ErrorResponse(ex.Message, 400);
            }
        }

        [HttpPut("profile")]
        public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileRequest request)
        {
            try
            {
                var userId = GetCurrentUserId();
                await _accountService.UpdateProfileAsync(userId, request);
                return OkResponse<object>(null!, "Cập nhật thông tin thành công");
            }
            catch (Exception ex)
            {
                return ErrorResponse(ex.Message, 400);
            }
        }
    }
}
