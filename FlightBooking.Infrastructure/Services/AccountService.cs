using FlightBooking.Application.Features.Account.DTOs;
using FlightBooking.Application.Features.Account.Interfaces;
using FlightBooking.Domain.Entities.Users;
using FlightBooking.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace FlightBooking.Infrastructure.Services
{
    public class AccountService : IAccountService
    {
        private readonly FlightBookingDbContext _context;
        public AccountService(FlightBookingDbContext context)
        {
            _context = context;
        }

        public async Task<UserProfileResponse> GetUserProfileAsync(int userId)
        {
            var user = await _context.Users.Include(u => u.UserProfile).FirstOrDefaultAsync(u => u.Id == userId);
            if (user == null)
                throw new Exception("Không tìm thấy người dùng.");


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
            var user = await _context.Users.Include(u => u.UserProfile).FirstOrDefaultAsync(u => u.Id == userId);
            if (user == null)
                throw new Exception("Không tìm thấy người dùng.");
            user.FullName = request.FullName;
            user.PhoneNumber = request.PhoneNumber;

            // Nếu User chưa có Profile (chưa tạo bao giờ) thì tạo record mới
            if (user.UserProfile == null)
            {
                user.UserProfile = new UserProfile { UserId = userId };
                await _context.Set<UserProfile>().AddAsync(user.UserProfile);
            }
            // Cập nhật thông tin chi tiết vào bảng UserProfiles
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

    }
}
