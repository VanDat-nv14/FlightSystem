using FlightBooking.Application.Common.Exceptions;
using FlightBooking.Application.Features.Customer.DTOs;
using FlightBooking.Application.Features.Customer.Interfaces;
using FlightBooking.Domain.Entities.Users;
using FlightBooking.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace FlightBooking.Infrastructure.Services
{
    public class CustomerFavoriteService : ICustomerFavoriteService
    {
        private const string AirportType = "Airport";
        private const string FlightType = "Flight";
        private readonly FlightBookingDbContext _context;

        public CustomerFavoriteService(FlightBookingDbContext context)
        {
            _context = context;
        }

        public async Task<List<CustomerFavoriteDto>> GetMyFavoritesAsync(int userId, string? itemType)
        {
            var query = _context.FavoriteItems
                .AsNoTracking()
                .Where(f => f.UserId == userId);

            if (!string.IsNullOrWhiteSpace(itemType))
            {
                var normalizedType = NormalizeType(itemType);
                query = query.Where(f => f.ItemType == normalizedType);
            }

            return await query
                .OrderByDescending(f => f.CreatedAt)
                .Select(f => ToDto(f))
                .ToListAsync();
        }

        public async Task<bool> IsFavoritedAsync(int userId, string itemType, int itemId)
        {
            var normalizedType = NormalizeType(itemType);
            return await _context.FavoriteItems.AnyAsync(f =>
                f.UserId == userId &&
                f.ItemType == normalizedType &&
                f.ItemId == itemId);
        }

        public async Task<ToggleFavoriteResponse> ToggleAsync(int userId, ToggleFavoriteRequest request)
        {
            var normalizedType = NormalizeType(request.ItemType);
            if (request.ItemId <= 0)
                throw new BadRequestException("ItemId khong hop le.");

            var existing = await _context.FavoriteItems.FirstOrDefaultAsync(f =>
                f.UserId == userId &&
                f.ItemType == normalizedType &&
                f.ItemId == request.ItemId);

            if (existing != null)
            {
                _context.FavoriteItems.Remove(existing);
                await _context.SaveChangesAsync();
                return new ToggleFavoriteResponse { IsFavorited = false };
            }

            var favorite = await BuildFavoriteAsync(userId, normalizedType, request.ItemId);
            _context.FavoriteItems.Add(favorite);
            await _context.SaveChangesAsync();

            return new ToggleFavoriteResponse
            {
                IsFavorited = true,
                Favorite = ToDto(favorite)
            };
        }

        public async Task RemoveAsync(int userId, int favoriteId)
        {
            var favorite = await _context.FavoriteItems
                .FirstOrDefaultAsync(f => f.Id == favoriteId && f.UserId == userId)
                ?? throw new NotFoundException("Favorite", favoriteId);

            _context.FavoriteItems.Remove(favorite);
            await _context.SaveChangesAsync();
        }

        private async Task<FavoriteItem> BuildFavoriteAsync(int userId, string itemType, int itemId)
        {
            if (itemType == AirportType)
            {
                var airport = await _context.Airports
                    .AsNoTracking()
                    .FirstOrDefaultAsync(a => a.Id == itemId)
                    ?? throw new NotFoundException("Airport", itemId);

                return new FavoriteItem
                {
                    UserId = userId,
                    ItemType = AirportType,
                    ItemId = airport.Id,
                    Title = $"{airport.City} ({airport.Code})",
                    Subtitle = $"{airport.Name}, {airport.Country}",
                    ImageUrl = airport.FeaturedImageUrl
                };
            }

            if (itemType == FlightType)
            {
                var flight = await _context.Flights
                    .AsNoTracking()
                    .Include(f => f.Route)
                        .ThenInclude(r => r!.OriginAirport)
                    .Include(f => f.Route)
                        .ThenInclude(r => r!.DestinationAirport)
                    .Include(f => f.Aircraft)
                        .ThenInclude(a => a!.Airline)
                    .FirstOrDefaultAsync(f => f.Id == itemId)
                    ?? throw new NotFoundException("Flight", itemId);

                var origin = flight.Route?.OriginAirport?.Code ?? "";
                var destination = flight.Route?.DestinationAirport?.Code ?? "";
                var airline = flight.Aircraft?.Airline?.Name ?? "SkyBooking";

                return new FavoriteItem
                {
                    UserId = userId,
                    ItemType = FlightType,
                    ItemId = flight.Id,
                    Title = $"{origin} -> {destination}",
                    Subtitle = $"{flight.FlightNumber} - {airline}",
                    ImageUrl = flight.Aircraft?.Airline?.LogoUrl
                };
            }

            throw new BadRequestException("Loai yeu thich chua duoc ho tro.");
        }

        private static CustomerFavoriteDto ToDto(FavoriteItem favorite) => new()
        {
            Id = favorite.Id,
            ItemType = favorite.ItemType,
            ItemId = favorite.ItemId,
            Title = favorite.Title,
            Subtitle = favorite.Subtitle,
            ImageUrl = favorite.ImageUrl,
            CreatedAt = favorite.CreatedAt
        };

        private static string NormalizeType(string itemType)
        {
            return itemType.Trim().ToLowerInvariant() switch
            {
                "airport" or "destination" => AirportType,
                "flight" => FlightType,
                _ => throw new BadRequestException("Loai yeu thich chua duoc ho tro.")
            };
        }
    }
}
