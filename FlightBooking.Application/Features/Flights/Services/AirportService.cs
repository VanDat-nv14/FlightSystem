using FlightBooking.Application.Common.Exceptions;
using FlightBooking.Application.Common.Interfaces;
using FlightBooking.Application.Features.Flights.DTOs;
using FlightBooking.Application.Features.Flights.Interfaces;
using FlightBooking.Domain.Entities.Flights;
using Microsoft.EntityFrameworkCore;

namespace FlightBooking.Application.Features.Flights.Services
{
    public class AirportService : IAirportService
    {
        private readonly IApplicationDbContext _context;
        private readonly ICacheService _cache;
        private const string AirportsCacheKey = "airports:all";

        public AirportService(IApplicationDbContext context, ICacheService cache)
        {
            _context = context;
            _cache = cache;
        }

        public async Task<AirportDto> CreateAsync(CreateAirportRequest request)
        {
            var exists = await _context.Airports.AnyAsync(a => a.Code == request.Code);
            if (exists) throw new BadRequestException($"Mã sân bay '{request.Code}' đã tồn tại.");

            var airport = new Airport
            {
                Code = request.Code.ToUpper(),
                Name = request.Name,
                City = request.City,
                Country = request.Country,
                IsFeatured = request.IsFeatured,
                FeaturedImageUrl = request.FeaturedImageUrl,
                FeaturedDescription = request.FeaturedDescription,
                FeaturedDisplayOrder = request.FeaturedDisplayOrder
            };
            _context.Airports.Add(airport);
            await _context.SaveChangesAsync();
            await _cache.RemoveAsync(AirportsCacheKey);
            return await GetByIdAsync(airport.Id);
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var airport = await _context.Airports.FindAsync(id)
                ?? throw new NotFoundException("Airport", id);

            var hasRoutes = await _context.Routes.AnyAsync(r =>
                r.OriginAirportId == id || r.DestinationAirportId == id);
            if (hasRoutes) throw new BadRequestException("Không thể xóa sân bay đang có tuyến bay.");

            _context.Airports.Remove(airport);
            await _context.SaveChangesAsync();
            await _cache.RemoveAsync(AirportsCacheKey);
            return true;
        }

        public async Task<List<AirportDto>> GetAllAsync()
        {
            return await _cache.GetOrSetAsync(
                AirportsCacheKey,
                async () => await _context.Airports
                    .Select(a => new AirportDto
                    {
                        Id = a.Id,
                        Name = a.Name,
                        Code = a.Code,
                        City = a.City,
                        Country = a.Country,
                        IsFeatured = a.IsFeatured,
                        FeaturedImageUrl = a.FeaturedImageUrl,
                        FeaturedDescription = a.FeaturedDescription,
                        FeaturedDisplayOrder = a.FeaturedDisplayOrder
                    })
                    .OrderByDescending(a => a.IsFeatured)
                    .ThenBy(a => a.FeaturedDisplayOrder)
                    .ThenBy(a => a.Code)
                    .ToListAsync(),
                TimeSpan.FromHours(1)) ?? new List<AirportDto>();
        }

        public async Task<AirportDto> GetByIdAsync(int id)
        {
            var airport = await _context.Airports.FindAsync(id)
                ?? throw new NotFoundException("Airport", id);

            return new AirportDto
            {
                Id = airport.Id,
                Code = airport.Code,
                Name = airport.Name,
                City = airport.City,
                Country = airport.Country,
                IsFeatured = airport.IsFeatured,
                FeaturedImageUrl = airport.FeaturedImageUrl,
                FeaturedDescription = airport.FeaturedDescription,
                FeaturedDisplayOrder = airport.FeaturedDisplayOrder
            };
        }

        public async Task<bool> UpdateAsync(int id, UpdateAirportRequest request)
        {
            var airport = await _context.Airports.FindAsync(id)
                ?? throw new NotFoundException("Airport", id);

            airport.Name = request.Name;
            airport.City = request.City;
            airport.Country = request.Country;
            airport.IsFeatured = request.IsFeatured;
            airport.FeaturedImageUrl = request.FeaturedImageUrl;
            airport.FeaturedDescription = request.FeaturedDescription;
            airport.FeaturedDisplayOrder = request.FeaturedDisplayOrder;
            await _context.SaveChangesAsync();
            await _cache.RemoveAsync(AirportsCacheKey);
            return true;
        }
    }
}
