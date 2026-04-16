using FlightBooking.Application.Features.Auth.DTOs;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FlightBooking.Application.Features.Auth.Interfaces
{
    public interface IAuthService
    {
        Task<AuthResponse> RegisterAsync(RegisterRequest request);
        Task<AuthResponse> LoginAsync(LoginRequest request);
        Task<AuthResponse> LoginWithGoogleAsync(string email, string fullName);
        Task<AuthResponse> RefreshTokenAsync(RefreshTokenRequest request);
        Task LogoutAsync(int userId);
    }
}
