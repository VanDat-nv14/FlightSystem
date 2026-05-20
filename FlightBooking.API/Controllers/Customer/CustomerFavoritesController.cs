using FlightBooking.API.Controllers.Common;
using FlightBooking.Application.Features.Customer.DTOs;
using FlightBooking.Application.Features.Customer.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace FlightBooking.API.Controllers.Customer
{
    [Authorize]
    public class CustomerFavoritesController : BaseController
    {
        private readonly ICustomerFavoriteService _favoriteService;

        public CustomerFavoritesController(ICustomerFavoriteService favoriteService)
        {
            _favoriteService = favoriteService;
        }

        [HttpGet]
        public async Task<IActionResult> GetMyFavorites([FromQuery] string? itemType)
        {
            var favorites = await _favoriteService.GetMyFavoritesAsync(GetCurrentUserId(), itemType);
            return OkResponse(favorites, "Lay danh sach yeu thich thanh cong.");
        }

        [HttpGet("check")]
        public async Task<IActionResult> Check([FromQuery] string itemType, [FromQuery] int itemId)
        {
            var isFavorited = await _favoriteService.IsFavoritedAsync(GetCurrentUserId(), itemType, itemId);
            return OkResponse(isFavorited, "Kiem tra yeu thich thanh cong.");
        }

        [HttpPost("toggle")]
        public async Task<IActionResult> Toggle([FromBody] ToggleFavoriteRequest request)
        {
            var result = await _favoriteService.ToggleAsync(GetCurrentUserId(), request);
            return OkResponse(result, result.IsFavorited ? "Da them vao yeu thich." : "Da bo yeu thich.");
        }

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Remove(int id)
        {
            await _favoriteService.RemoveAsync(GetCurrentUserId(), id);
            return OkResponse(true, "Da xoa khoi yeu thich.");
        }

        private int GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)
                           ?? User.FindFirst(JwtRegisteredClaimNames.Sub);

            if (userIdClaim != null && int.TryParse(userIdClaim.Value, out var userId))
                return userId;

            throw new InvalidOperationException("Khong xac dinh duoc danh tinh nguoi dung.");
        }
    }
}
