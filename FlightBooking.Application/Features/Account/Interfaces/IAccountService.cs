using FlightBooking.Application.Features.Account.DTOs;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FlightBooking.Application.Features.Account.Interfaces
{
    public interface IAccountService
    { 
        Task<UserProfileResponse> GetUserProfileAsync(int userId);
        Task<bool> UpdateProfileAsync(int userId, UpdateProfileRequest request);
    }
}
