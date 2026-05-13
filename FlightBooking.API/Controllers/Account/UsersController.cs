using FlightBooking.API.Controllers.Common;
using FlightBooking.Application.Features.Account.DTOs;
using FlightBooking.Application.Features.Account.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FlightBooking.API.Controllers.Account
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin")]
    public class UsersController : BaseController
    {
        private readonly IAccountService _accountService;

        public UsersController(IAccountService accountService)
        {
            _accountService = accountService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var users = await _accountService.GetAllUsersAsync();
            return OkResponse(users, "Lấy danh sách người dùng thành công.");
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateUserRequest request)
        {
            var user = await _accountService.CreateUserAsync(request);
            return OkResponse(user, "Tạo người dùng thành công.");
        }

        [HttpPut("{id:int}")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateUserRequest request)
        {
            var result = await _accountService.UpdateUserAsync(id, request);
            return OkResponse(result, "Cập nhật người dùng thành công.");
        }

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id)
        {
            var result = await _accountService.DeleteUserAsync(id);
            return OkResponse(result, "Xóa người dùng thành công.");
        }

        [HttpPatch("{id:int}/toggle-lock")]
        public async Task<IActionResult> ToggleLock(int id)
        {
            var result = await _accountService.ToggleLockUserAsync(id);
            return OkResponse(result, "Cập nhật trạng thái khóa thành công.");
        }
    }
}
