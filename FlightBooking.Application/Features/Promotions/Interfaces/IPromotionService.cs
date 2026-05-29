using FlightBooking.Application.Features.Promotions.DTOs;

namespace FlightBooking.Application.Features.Promotions.Interfaces
{
    public interface IPromotionService
    {
        // Public - tất cả người dùng xem ưu đãi đang hoạt động
        Task<List<PromotionDto>> GetActiveAsync();

        // Manager - xem ưu đãi của hãng mình
        Task<List<PromotionDto>> GetByAirlineAsync(int airlineId);

        Task<PromotionDto> CreateAsync(int airlineId, CreatePromotionRequest request);
        Task<PromotionDto> UpdateAsync(int promotionId, int airlineId, UpdatePromotionRequest request);
        Task DeleteAsync(int promotionId, int airlineId);
    }
}
