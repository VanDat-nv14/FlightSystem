using FlightBooking.Application.Common.Exceptions;
using FlightBooking.Application.Common.Interfaces;
using FlightBooking.Application.Features.Promotions.DTOs;
using FlightBooking.Application.Features.Promotions.Interfaces;
using FlightBooking.Domain.Entities.Promotions;
using Microsoft.EntityFrameworkCore;

namespace FlightBooking.Application.Features.Promotions.Services
{
    public class PromotionService : IPromotionService
    {
        private readonly IApplicationDbContext _context;

        public PromotionService(IApplicationDbContext context)
        {
            _context = context;
        }

        // Tự động cập nhật trạng thái dựa trên ngày
        private static string ComputeStatus(Promotion p)
        {
            if (p.Status == "Paused") return "Paused";
            var today = DateTime.Today;
            if (p.EndDate < today) return "Expired";
            if (p.StartDate > today) return "Upcoming";
            return "Active";
        }

        public async Task<List<PromotionDto>> GetActiveAsync()
        {
            var today = DateTime.Today;
            return await _context.Promotions
                .AsNoTracking()
                .Include(p => p.Airline)
                .Where(p => p.Status == "Active"
                         && p.StartDate <= today
                         && p.EndDate >= today)
                .OrderByDescending(p => p.DiscountPercent)
                .Select(p => ToDto(p))
                .ToListAsync();
        }

        public async Task<List<PromotionDto>> GetByAirlineAsync(int airlineId)
        {
            return await _context.Promotions
                .AsNoTracking()
                .Include(p => p.Airline)
                .Where(p => p.AirlineId == airlineId)
                .OrderByDescending(p => p.CreatedAt)
                .Select(p => ToDto(p))
                .ToListAsync();
        }

        public async Task<PromotionDto> CreateAsync(int airlineId, CreatePromotionRequest request)
        {
            var codeUpper = request.Code.Trim().ToUpperInvariant();

            // Kiểm tra mã trùng
            if (await _context.Promotions.AnyAsync(p => p.Code == codeUpper))
                throw new BadRequestException($"Mã khuyến mãi '{codeUpper}' đã tồn tại.");

            var promotion = new Promotion
            {
                Code = codeUpper,
                Name = request.Name.Trim(),
                DiscountPercent = Math.Clamp(request.DiscountPercent, 1, 100),
                StartDate = request.StartDate.Date,
                EndDate = request.EndDate.Date,
                Status = request.Status,
                AirlineId = airlineId,
                CreatedAt = DateTime.Now,
                UpdatedAt = DateTime.Now
            };

            _context.Promotions.Add(promotion);
            await _context.SaveChangesAsync();

            // Reload để có Airline
            await _context.Promotions.Entry(promotion)
                .Reference(p => p.Airline).LoadAsync();

            return ToDto(promotion);
        }

        public async Task<PromotionDto> UpdateAsync(int promotionId, int airlineId, UpdatePromotionRequest request)
        {
            var promotion = await _context.Promotions
                .Include(p => p.Airline)
                .FirstOrDefaultAsync(p => p.Id == promotionId && p.AirlineId == airlineId)
                ?? throw new NotFoundException("Promotion", promotionId);

            promotion.Name = request.Name.Trim();
            promotion.DiscountPercent = Math.Clamp(request.DiscountPercent, 1, 100);
            promotion.StartDate = request.StartDate.Date;
            promotion.EndDate = request.EndDate.Date;
            promotion.Status = request.Status;
            promotion.UpdatedAt = DateTime.Now;

            await _context.SaveChangesAsync();
            return ToDto(promotion);
        }

        public async Task DeleteAsync(int promotionId, int airlineId)
        {
            var promotion = await _context.Promotions
                .FirstOrDefaultAsync(p => p.Id == promotionId && p.AirlineId == airlineId)
                ?? throw new NotFoundException("Promotion", promotionId);

            _context.Promotions.Remove(promotion);
            await _context.SaveChangesAsync();
        }

        private static PromotionDto ToDto(Promotion p) => new()
        {
            Id = p.Id,
            Code = p.Code,
            Name = p.Name,
            DiscountPercent = p.DiscountPercent,
            StartDate = p.StartDate.ToString("yyyy-MM-dd"),
            EndDate = p.EndDate.ToString("yyyy-MM-dd"),
            Status = ComputeStatus(p),
            AirlineId = p.AirlineId,
            AirlineName = p.Airline?.Name,
            AirlineLogoUrl = p.Airline?.LogoUrl,
            CreatedAt = p.CreatedAt
        };
    }
}
