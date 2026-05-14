using FlightBooking.Application.Features.Account.DTOs;

namespace FlightBooking.Application.Features.Account.Interfaces
{
    public interface IAccountService
    { 
        Task<UserProfileResponse> GetUserProfileAsync(int userId);
        Task<bool> UpdateProfileAsync(int userId, UpdateProfileRequest request);

        // User Management (Admin)
        Task<List<UserListItem>> GetAllUsersAsync();
        Task<UserListItem> CreateUserAsync(CreateUserRequest request);
        Task<bool> UpdateUserAsync(int userId, UpdateUserRequest request);
        Task<bool> DeleteUserAsync(int userId);
        Task<bool> ToggleLockUserAsync(int userId);

        // Partner team management
        Task<List<UserListItem>> GetAirlineUsersAsync(int airlineId);
        Task<UserListItem> CreateAirlineUserAsync(int airlineId, CreateUserRequest request);
        Task<bool> UpdateAirlineUserAsync(int airlineId, int userId, UpdateUserRequest request);
        Task<bool> ToggleLockAirlineUserAsync(int airlineId, int userId);
    }
}
