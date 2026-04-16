using FlightBooking.Application.Features.Auth.DTOs;
using FlightBooking.Application.Features.Auth.Interfaces;
using FlightBooking.Domain.Entities.Users;
using FlightBooking.Domain.Enums;
using FlightBooking.Infrastructure.Persistence;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using System;
using System.Collections.Generic;
using System.Composition;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;

namespace FlightBooking.Infrastructure.Services
{
    public class AuthService : IAuthService
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly IConfiguration _configuration;
        private readonly FlightBookingDbContext _context;
        private object jwtSettings;

        public AuthService(UserManager<ApplicationUser> userManager, IConfiguration configuration,FlightBookingDbContext context)
        {
            _userManager = userManager;
            _configuration = configuration;
            _context = context;
        }

        public async Task<AuthResponse> RegisterAsync(RegisterRequest request)
        {
            var existingUser = await _userManager.FindByEmailAsync(request.Email);
            if (existingUser != null)
            {
                throw new Exception("Email already exists");
            }

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
            {
                throw new Exception(string.Join(", ", result.Errors.Select(e => e.Description)));
            }

            return await GenerateAuthResponse(user);
        }

        public Task<AuthResponse> RefreshTokenAsync(RefreshTokenRequest request)
        {
            throw new NotImplementedException();
        }

        public async Task<AuthResponse> LoginAsync(LoginRequest request)
        {
            var user = await _userManager.FindByEmailAsync(request.Email);
            if (user == null || !await _userManager.CheckPasswordAsync(user, request.Password))
                throw new Exception("Email hoặc mật khẩu không đúng.");
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
            var user = await _userManager.FindByEmailAsync(email);

            // Nếu chưa có user thì tạo mới
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
                    throw new Exception("Không thể tạo tài khoản qua Google");

                await _userManager.AddToRoleAsync(user, UserRole.Customer.ToString());
            }

            return await GenerateAuthResponse(user);
        }

        private async Task<AuthResponse> GenerateAuthResponse(ApplicationUser user)
        {
            var jwtSettings = _configuration.GetSection("JwtSettings");
            var key = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(jwtSettings["SecurityKey"]!));  
            var expiresAt = DateTime.UtcNow.AddMinutes(
                double.Parse(jwtSettings["ExpiryInMinutes"]!));         

            var claims = new[]
            {
        new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
        new Claim(JwtRegisteredClaimNames.Email, user.Email!),
        new Claim(ClaimTypes.Role, user.Role.ToString()),
        new Claim("fullName", user.FullName ?? "")
    };

            var token = new JwtSecurityToken(
                issuer: jwtSettings["Issuer"],      
                audience: jwtSettings["Audience"],  
                claims: claims,
                expires: expiresAt,                 
                signingCredentials: new SigningCredentials(key, SecurityAlgorithms.HmacSha256)
            );

            return new AuthResponse
            {
                AccessToken = new JwtSecurityTokenHandler().WriteToken(token),
                RefreshToken = GenerateRefreshToken(),
                ExpiresAt = expiresAt,               
                User = new UserDto
                {
                    Id = user.Id,
                    FullName = user.FullName ?? "",
                    Email = user.Email!,
                    Role = user.Role.ToString()
                }
            };
        }

        private static string GenerateRefreshToken()
        {
            var bytes = new byte[64];
            RandomNumberGenerator.Fill(bytes);
            return Convert.ToBase64String(bytes);
        }

        public async Task LogoutAsync(int userId)
        {
            // Lấy tất cả session đang còn hiệu lực của user này
            var activeSessions = await _context.UserSessions
                .Where(s => s.UserId == userId && !s.IsRevoked)
                .ToListAsync();
            // Đánh dấu thu hồi toàn bộ session
            foreach (var session in activeSessions)
            {
                session.IsRevoked = true;
                session.RevokedAt = DateTime.UtcNow;
                session.RevokeReason = "User logged out";
            }
            await _context.SaveChangesAsync();
        }
    }
}
