using FlightBooking.Application.Features.Customer.DTOs;

namespace FlightBooking.Application.Features.Customer.Interfaces
{
    public interface ICustomerFavoriteService
    {
        Task<List<CustomerFavoriteDto>> GetMyFavoritesAsync(int userId, string? itemType);
        Task<bool> IsFavoritedAsync(int userId, string itemType, int itemId);
        Task<ToggleFavoriteResponse> ToggleAsync(int userId, ToggleFavoriteRequest request);
        Task RemoveAsync(int userId, int favoriteId);
    }
}
