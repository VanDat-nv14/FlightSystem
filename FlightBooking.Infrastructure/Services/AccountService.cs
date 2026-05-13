using FlightBooking.Application.Common.Exceptions;
using FlightBooking.Application.Features.Account.DTOs;
using FlightBooking.Application.Features.Account.Interfaces;
using FlightBooking.Domain.Entities.Users;
using FlightBooking.Domain.Enums;
using FlightBooking.Infrastructure.Persistence;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace FlightBooking.Infrastructure.Services
{
    public class AccountService : IAccountService
    {
        private readonly FlightBookingDbContext _context;
        private readonly UserManager<ApplicationUser> _userManager;

        public AccountService(FlightBookingDbContext context, UserManager<ApplicationUser> userManager)
        {
            _context = context;
            _userManager = userManager;
        }

        public async Task<UserProfileResponse> GetUserProfileAsync(int userId)
        {
            var user = await _context.Users
            .Include(u => u.UserProfile)
            .FirstOrDefaultAsync(u => u.Id == userId)
            ?? throw new NotFoundException("User", userId);

            return new UserProfileResponse
            {
                UserId = user.Id,
                Email = user.Email ?? "",
                PhoneNumber = user.PhoneNumber,
                FullName = user.FullName ?? "",
                Role = user.Role.ToString(),
                UrlAvatar = user.UserProfile?.UrlAvatar,
                DateOfBirth = user.UserProfile?.DateOfBirth,
                Gender = user.UserProfile?.Gender?.ToString(),
                Nationality = user.UserProfile?.Nationality,
                IdCardNumber = user.UserProfile?.IdCardNumber,
                PassportNumber = user.UserProfile?.PassportNumber,
                PassportExpiry = user.UserProfile?.PassportExpiry,
            };
        }

        public async Task<bool> UpdateProfileAsync(int userId, UpdateProfileRequest request)
        {
            var user = await _context.Users
                .Include(u => u.UserProfile)
                .FirstOrDefaultAsync(u => u.Id == userId)
                ?? throw new NotFoundException("User", userId);

            user.FullName = request.FullName;
            user.PhoneNumber = request.PhoneNumber;

            if (user.UserProfile == null)
            {
                user.UserProfile = new UserProfile { UserId = userId };
                await _context.Set<UserProfile>().AddAsync(user.UserProfile);
            }

            user.UserProfile.DateOfBirth = request.DateOfBirth;
            user.UserProfile.Gender = request.Gender;
            user.UserProfile.Nationality = request.Nationality;
            user.UserProfile.IdCardNumber = request.IdCardNumber;
            user.UserProfile.PassportNumber = request.PassportNumber;
            user.UserProfile.PassportExpiry = request.PassportExpiry;

            if (!string.IsNullOrEmpty(request.UrlAvatar))
                user.UserProfile.UrlAvatar = request.UrlAvatar;

            user.UpdatedAt = DateTime.Now;
            await _context.SaveChangesAsync();
            return true;
        }

        // ── User Management (Admin) ────────────────────────────────────────

        public async Task<List<UserListItem>> GetAllUsersAsync()
        {
            var users = await _context.Users
                .Include(u => u.Airline)
                .ToListAsync();
            return users.Select(u => new UserListItem
            {
                Id = u.Id,
                FullName = u.FullName ?? "",
                Email = u.Email ?? "",
                PhoneNumber = u.PhoneNumber,
                Role = u.Role.ToString(),
                CreatedAt = u.CreateAt,
                IsLocked = u.LockoutEnd.HasValue && u.LockoutEnd > DateTimeOffset.UtcNow,
                AirlineId = u.AirlineId,
                AirlineName = u.Airline?.Name
            }).OrderBy(u => u.Id).ToList();
        }

        public async Task<UserListItem> CreateUserAsync(CreateUserRequest request)
        {
            var existing = await _userManager.FindByEmailAsync(request.Email);
            if (existing != null)
                throw new BadRequestException("Email này đã được đăng ký.");

            if (!Enum.TryParse<UserRole>(request.Role, true, out var roleEnum))
                roleEnum = UserRole.Customer;

            var user = new ApplicationUser
            {
                UserName = request.Email,
                Email = request.Email,
                FullName = request.FullName,
                PhoneNumber = request.PhoneNumber,
                Role = roleEnum,
                EmailConfirmed = true,
                AirlineId = roleEnum == UserRole.AirlineManager ? request.AirlineId : null
            };

            var result = await _userManager.CreateAsync(user, request.Password);
            if (!result.Succeeded)
                throw new BadRequestException(string.Join(", ", result.Errors.Select(e => e.Description)));

            await _userManager.AddToRoleAsync(user, request.Role);

            return new UserListItem
            {
                Id = user.Id,
                FullName = user.FullName ?? "",
                Email = user.Email ?? "",
                PhoneNumber = user.PhoneNumber,
                Role = user.Role.ToString(),
                CreatedAt = user.CreateAt,
                IsLocked = false,
                AirlineId = user.AirlineId
            };
        }

        public async Task<bool> UpdateUserAsync(int userId, UpdateUserRequest request)
        {
            var user = await _context.Users.FindAsync(userId)
                ?? throw new NotFoundException("User", userId);

            var oldRole = user.Role.ToString();

            if (!Enum.TryParse<UserRole>(request.Role, true, out var roleEnum))
                roleEnum = UserRole.Customer;

            user.FullName = request.FullName;
            user.PhoneNumber = request.PhoneNumber;
            user.Role = roleEnum;
            user.AirlineId = roleEnum == UserRole.AirlineManager ? request.AirlineId : null;
            user.UpdatedAt = DateTime.Now;

            // Cập nhật Identity Role nếu thay đổi
            if (!string.Equals(oldRole, request.Role, StringComparison.OrdinalIgnoreCase))
            {
                await _userManager.RemoveFromRoleAsync(user, oldRole);
                await _userManager.AddToRoleAsync(user, request.Role);
            }

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> DeleteUserAsync(int userId)
        {
            var user = await _context.Users.FindAsync(userId)
                ?? throw new NotFoundException("User", userId);

            var result = await _userManager.DeleteAsync(user);
            return result.Succeeded;
        }

        public async Task<bool> ToggleLockUserAsync(int userId)
        {
            var user = await _context.Users.FindAsync(userId)
                ?? throw new NotFoundException("User", userId);

            bool isLocked = user.LockoutEnd.HasValue && user.LockoutEnd > DateTimeOffset.UtcNow;
            if (isLocked)
            {
                await _userManager.SetLockoutEndDateAsync(user, null); // mở khóa
            }
            else
            {
                await _userManager.SetLockoutEndDateAsync(user, DateTimeOffset.UtcNow.AddYears(100)); // khóa vĩnh viễn
            }
            return true;
        }
    }
}
