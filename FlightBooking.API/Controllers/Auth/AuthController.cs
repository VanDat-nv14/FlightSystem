using FlightBooking.API.Controllers.Common;
using FlightBooking.Application.Features.Auth.DTOs;
using FlightBooking.Application.Features.Auth.Interfaces;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Google;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text.Json;

namespace FlightBooking.API.Controllers.Auth
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : BaseController
    {
        private readonly IAuthService _authService;
        private readonly IConfiguration _configuration;

        public AuthController(IAuthService authService, IConfiguration configuration)
        {
            _authService = authService;
            _configuration = configuration;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterRequest request)
        {
            var result = await _authService.RegisterAsync(request);
            SetRefreshTokenCookie(result.RefreshToken);
            result.RefreshToken = string.Empty;
            return OkResponse(result, "Đăng ký thành công.");
        }

        [HttpPost("register-partner")]
        public async Task<IActionResult> RegisterPartner([FromBody] PartnerRegisterRequest request)
        {
            await _authService.RegisterPartnerAsync(request);
            return OkResponse<object>(null!, "Đăng ký thành công. Vui lòng chờ Admin phê duyệt.");
        }

        [HttpPost("register-flight-manager")]
        public async Task<IActionResult> RegisterFlightManager([FromBody] FlightManagerRegisterRequest request)
        {
            var result = await _authService.RegisterFlightManagerAsync(request);
            SetRefreshTokenCookie(result.RefreshToken);
            result.RefreshToken = string.Empty;
            return OkResponse(result, "Đăng ký tài khoản Quản lý hãng bay thành công.");
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            var result = await _authService.LoginAsync(request);
            SetRefreshTokenCookie(result.RefreshToken);
            result.RefreshToken = string.Empty;
            return OkResponse(result, "Đăng nhập thành công.");
        }

        [HttpGet("login-google")]
        public IActionResult LoginGoogle()
        {
            var properties = new AuthenticationProperties
            {
                RedirectUri = Url.Action(nameof(GoogleResponse))
            };

            return Challenge(properties, GoogleDefaults.AuthenticationScheme);
        }

        [HttpGet("google-response")]
        public async Task<IActionResult> GoogleResponse()
        {
            var authenticateResult = await HttpContext.AuthenticateAsync(
                Microsoft.AspNetCore.Authentication.Cookies.CookieAuthenticationDefaults.AuthenticationScheme);

            if (!authenticateResult.Succeeded)
            {
                System.Console.WriteLine($"[GoogleResponse Error] Authentication failed: {authenticateResult.Failure?.Message}");
                if (authenticateResult.Failure != null)
                {
                    System.Console.WriteLine(authenticateResult.Failure.StackTrace);
                }
                return Redirect(BuildFrontendUrl("/login?error=google_failed"));
            }

            var email = authenticateResult.Principal?.FindFirstValue(ClaimTypes.Email) ?? string.Empty;
            var name = authenticateResult.Principal?.FindFirstValue(ClaimTypes.Name) ?? string.Empty;
            var picture = authenticateResult.Principal?.FindFirstValue("urn:google:picture")
                          ?? authenticateResult.Principal?.FindFirstValue("picture")
                          ?? authenticateResult.Principal?.FindFirstValue("image")
                          ?? string.Empty;

            if (string.IsNullOrWhiteSpace(email))
                return Redirect(BuildFrontendUrl("/login?error=google_missing_email"));

            try
            {
                var authResponse = await _authService.LoginWithGoogleAsync(email, name, picture);
                SetRefreshTokenCookie(authResponse.RefreshToken);

                var userJson = JsonSerializer.Serialize(authResponse.User, new JsonSerializerOptions
                {
                    PropertyNamingPolicy = JsonNamingPolicy.CamelCase
                });

                var fragment = string.Join("&", new[]
                {
                    $"accessToken={Uri.EscapeDataString(authResponse.AccessToken)}",
                    $"refreshToken={Uri.EscapeDataString(authResponse.RefreshToken)}",
                    $"expiresAt={Uri.EscapeDataString(authResponse.ExpiresAt.ToString("O"))}",
                    $"user={Uri.EscapeDataString(userJson)}"
                });

                return Redirect($"{BuildFrontendUrl("/auth/google-callback")}#{fragment}");
            }
            catch (Exception ex)
            {
                System.Console.WriteLine($"[GoogleResponse Error] Exception: {ex.Message}");
                System.Console.WriteLine(ex.StackTrace);
                return Redirect(BuildFrontendUrl("/login?error=google_failed"));
            }
        }

        [HttpPost("logout")]
        [Authorize]
        public async Task<IActionResult> Logout()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)
                           ?? User.FindFirst(JwtRegisteredClaimNames.Sub);

            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
                return ErrorResponse("Không xác định được người dùng.", 401);

            await _authService.LogoutAsync(userId);
            Response.Cookies.Delete("refreshToken");

            return OkResponse<object>(null!, "Đăng xuất thành công.");
        }

        [HttpPost("refresh")]
        public async Task<IActionResult> Refresh([FromBody] RefreshTokenRequest? request)
        {
            var refreshToken = Request.Cookies["refreshToken"];
            if (string.IsNullOrEmpty(refreshToken) && request != null)
            {
                refreshToken = request.RefreshToken;
            }

            if (string.IsNullOrEmpty(refreshToken))
            {
                return ErrorResponse("Không tìm thấy Refresh Token.", 400);
            }

            var result = await _authService.RefreshTokenAsync(new RefreshTokenRequest
            {
                RefreshToken = refreshToken
            });

            SetRefreshTokenCookie(result.RefreshToken);
            result.RefreshToken = string.Empty;

            return OkResponse(result, "Làm mới token thành công.");
        }

        private void SetRefreshTokenCookie(string token)
        {
            var cookieOptions = new CookieOptions
            {
                HttpOnly = true,
                Secure = Request.IsHttps,
                SameSite = SameSiteMode.Lax,
                Expires = DateTime.UtcNow.AddDays(7)
            };
            Response.Cookies.Append("refreshToken", token, cookieOptions);
        }

        private string BuildFrontendUrl(string path)
        {
            var baseUrl = _configuration["Frontend:BaseUrl"] ?? "http://localhost:5173";
            return $"{baseUrl.TrimEnd('/')}/{path.TrimStart('/')}";
        }
    }
}
