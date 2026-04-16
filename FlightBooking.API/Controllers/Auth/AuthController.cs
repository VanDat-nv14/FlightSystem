using FlightBooking.API.Common;
using FlightBooking.API.Controllers.Common;
using FlightBooking.Application.Features.Auth.DTOs;
using FlightBooking.Application.Features.Auth.Interfaces;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Google;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace FlightBooking.API.Controllers.Auth
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : BaseController
    {
        private readonly IAuthService _authService;

        public AuthController(IAuthService authService)
        {
            _authService = authService;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterRequest request)
        {
            var result = await _authService.RegisterAsync(request);
            return Ok(result);
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            var result = await _authService.LoginAsync(request);
            return Ok(result);
        }

        [HttpGet("login-google")]
        public IActionResult LoginGoogle()
        {
            var properties = new AuthenticationProperties { RedirectUri = Url.Action("GoogleResponse") };
            return Challenge(properties, GoogleDefaults.AuthenticationScheme);
        }
        // 2. Endpoint xử lý callback từ Google
        [HttpGet("google-response")]
        public async Task<IActionResult> GoogleResponse()
        {
            // Đọc thông tin từ Cookie tạm thời do bước SignInScheme lưu lại
            var authenticateResult = await HttpContext.AuthenticateAsync(Microsoft.AspNetCore.Authentication.Cookies.CookieAuthenticationDefaults.AuthenticationScheme);
            
            if (!authenticateResult.Succeeded) 
                return BadRequest("Lỗi xác thực từ Google");
                
            var email = authenticateResult.Principal.FindFirstValue(ClaimTypes.Email);
            var name = authenticateResult.Principal.FindFirstValue(ClaimTypes.Name);
            var authResponse = await _authService.LoginWithGoogleAsync(email, name);
            return OkResponse(authResponse, "Đăng nhập Google thành công");
        }

        [HttpPost("logout")]
        [Authorize]
        public async Task<IActionResult> Logout()
        {
            // Lấy UserId từ JWT Token đang gửi lên
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)
                           ?? User.FindFirst(JwtRegisteredClaimNames.Sub);
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
                return ErrorResponse("Không xác định được người dùng.", 401);
            await _authService.LogoutAsync(userId);
            return OkResponse<object>(null!, "Đăng xuất thành công.");
        }

        [HttpPost("refresh")]
        public async Task<IActionResult> Refresh([FromBody] RefreshTokenRequest request)
        {
            var result = await _authService.RefreshTokenAsync(request);
            return Ok(result);
        }
    }
}
