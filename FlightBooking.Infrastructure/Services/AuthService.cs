using FlightBooking.Application.Common.Exceptions;
using FlightBooking.Application.Features.Auth.DTOs;
using FlightBooking.Application.Features.Auth.Interfaces;
using FlightBooking.Domain.Entities.Users;
using FlightBooking.Domain.Enums;
using FlightBooking.Domain.Entities.Flights;
using FlightBooking.Infrastructure.Persistence;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;

namespace FlightBooking.Infrastructure.Services
{
    public class AuthService : IAuthService
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly IConfiguration _configuration;
        private readonly FlightBookingDbContext _context;

        public AuthService(
            UserManager<ApplicationUser> userManager,
            IConfiguration configuration,
            FlightBookingDbContext context)
        {
            _userManager = userManager;
            _configuration = configuration;
            _context = context;
        }

        public async Task<AuthResponse> RegisterAsync(RegisterRequest request)
        {
            var existingUser = await _userManager.FindByEmailAsync(request.Email);
            if (existingUser != null)
                throw new BadRequestException("Email này đã được đăng ký.");

            var user = new ApplicationUser
            {
                UserName = request.Email,
                Email = request.Email,
                FullName = request.FullName,
                PhoneNumber = request.PhoneNumber,
                Role = UserRole.Customer
            };

            var result = await _userManager.CreateAsync(user, request.Password);
            if (!result.Succeeded)
                throw new BadRequestException(string.Join(", ", result.Errors.Select(e => e.Description)));

            // Gán role Customer cho user mới
            await _userManager.AddToRoleAsync(user, "Customer");

            return await GenerateAuthResponse(user);
        }

        public async Task<AuthResponse> RegisterPartnerAsync(PartnerRegisterRequest request)
        {
            var existingUser = await _userManager.FindByEmailAsync(request.Email);
            if (existingUser != null)
                throw new BadRequestException("Email này đã được đăng ký.");

            var existingAirline = await _context.Airlines.FirstOrDefaultAsync(a => a.Code == request.AirlineCode);
            if (existingAirline != null)
                throw new BadRequestException("Mã Hãng bay này đã tồn tại trong hệ thống.");

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var airline = new Airline
                {
                    Name = request.AirlineName,
                    Code = request.AirlineCode,
                    Country = request.Country,
                    Status = AirlineStatus.Pending,
                    IsActive = false
                };
                _context.Airlines.Add(airline);
                await _context.SaveChangesAsync();

                var user = new ApplicationUser
                {
                    UserName = request.Email,
                    Email = request.Email,
                    FullName = request.FullName,
                    PhoneNumber = request.PhoneNumber,
                    Role = UserRole.AirlineManager,
                    AirlineId = airline.Id,
                    EmailConfirmed = true
                };

                var result = await _userManager.CreateAsync(user, request.Password);
                if (!result.Succeeded)
                    throw new BadRequestException(string.Join(", ", result.Errors.Select(e => e.Description)));

                await _userManager.AddToRoleAsync(user, "AirlineManager");

                await transaction.CommitAsync();

                return new AuthResponse { AccessToken = string.Empty, RefreshToken = string.Empty, User = null! };
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        public async Task<AuthResponse> LoginAsync(LoginRequest request)
        {
            var user = await _context.Users
                .Include(u => u.Airline)
                .FirstOrDefaultAsync(u => u.Email == request.Email);

            if (user == null || !await _userManager.CheckPasswordAsync(user, request.Password))
                throw new BadRequestException("Email hoặc mật khẩu không đúng.");

            if (user.Role == UserRole.AirlineManager && user.Airline != null && user.Airline.Status != AirlineStatus.Approved)
            {
                if (user.Airline.Status == AirlineStatus.Pending)
                    throw new BadRequestException("Tài khoản Hãng bay đang chờ Admin phê duyệt.");
                if (user.Airline.Status == AirlineStatus.Suspended)
                    throw new BadRequestException("Hãng bay đã bị đình chỉ hoạt động.");
                if (user.Airline.Status == AirlineStatus.Rejected)
                    throw new BadRequestException("Đăng ký Hãng bay đã bị từ chối.");
            }

            var authResponse = await GenerateAuthResponse(user);

            // Lưu Refresh Token vào DB
            var session = new UserSession
            {
                UserId = user.Id,
                RefreshToken = authResponse.RefreshToken,
                ExpiresAt = DateTime.UtcNow.AddDays(7),
                IsRevoked = false
            };
            _context.UserSessions.Add(session);
            await _context.SaveChangesAsync();
            return authResponse;
        }

        public async Task<AuthResponse> LoginWithGoogleAsync(string email, string fullName)
        {
            if (string.IsNullOrWhiteSpace(email))
                throw new BadRequestException("Google account does not provide an email address.");

            var user = await _context.Users
                .Include(u => u.Airline)
                .FirstOrDefaultAsync(u => u.Email == email);

            if (user == null)
            {
                user = new ApplicationUser
                {
                    UserName = email,
                    Email = email,
                    FullName = fullName,
                    Role = UserRole.Customer,
                    EmailConfirmed = true
                };

                var result = await _userManager.CreateAsync(user);
                if (!result.Succeeded)
                    throw new BadRequestException("Không thể tạo tài khoản qua Google.");

                await _userManager.AddToRoleAsync(user, UserRole.Customer.ToString());
            }

            var authResponse = await GenerateAuthResponse(user);
            var session = new UserSession
            {
                UserId = user.Id,
                RefreshToken = authResponse.RefreshToken,
                ExpiresAt = DateTime.UtcNow.AddDays(7),
                IsRevoked = false
            };

            _context.UserSessions.Add(session);
            await _context.SaveChangesAsync();

            return authResponse;
        }

        public Task<AuthResponse> RefreshTokenAsync(RefreshTokenRequest request)
        {
            // TODO: Implement Refresh Token validation logic (Phase 2)
            throw new NotImplementedException("Chức năng RefreshToken chưa được triển khai.");
        }

        public async Task LogoutAsync(int userId)
        {
            var activeSessions = await _context.UserSessions
                .Where(s => s.UserId == userId && !s.IsRevoked)
                .ToListAsync();

            foreach (var session in activeSessions)
            {
                session.IsRevoked = true;
                session.RevokedAt = DateTime.UtcNow;
                session.RevokeReason = "User logged out";
            }
            await _context.SaveChangesAsync();
        }

        private async Task<AuthResponse> GenerateAuthResponse(ApplicationUser user)
        {
            var urlAvatar = await _context.UserProfiles
                .Where(p => p.UserId == user.Id)
                .Select(p => p.UrlAvatar)
                .FirstOrDefaultAsync();

            var jwtSettings = _configuration.GetSection("JwtSettings");
            var key = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(jwtSettings["SecurityKey"]!));
            var expiresAt = DateTime.UtcNow.AddMinutes(
                double.Parse(jwtSettings["ExpiryInMinutes"]!));

            var claims = new List<Claim>
            {
                new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
                new Claim(JwtRegisteredClaimNames.Email, user.Email!),
                new Claim(ClaimTypes.Role, user.Role.ToString()),
                new Claim("fullName", user.FullName ?? "")
            };

            if (user.AirlineId.HasValue)
            {
                claims.Add(new Claim("airlineId", user.AirlineId.Value.ToString()));
            }

            var token = new JwtSecurityToken(
                issuer: jwtSettings["Issuer"],
                audience: jwtSettings["Audience"],
                claims: claims,
                expires: expiresAt,
                signingCredentials: new SigningCredentials(key, SecurityAlgorithms.HmacSha256)
            );

            return await Task.FromResult(new AuthResponse
            {
                AccessToken = new JwtSecurityTokenHandler().WriteToken(token),
                RefreshToken = GenerateRefreshToken(),
                ExpiresAt = expiresAt,
                User = new UserDto
                {
                    Id = user.Id,
                    FullName = user.FullName ?? "",
                    Email = user.Email!,
                    Role = user.Role.ToString(),
                    UrlAvatar = urlAvatar,
                    AirlineId = user.AirlineId
                }
            });
        }

        private static string GenerateRefreshToken()
        {
            var bytes = new byte[64];
            RandomNumberGenerator.Fill(bytes);
            return Convert.ToBase64String(bytes);
        }
    }
}
