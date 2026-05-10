using FlightBooking.Application.Common.Exceptions;
using FlightBooking.Application.Features.Flights.DTOs;
using FlightBooking.Application.Features.Flights.Interfaces;
using FlightBooking.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace FlightBooking.Infrastructure.Services
{
    public class RouteService : IRouteService
    {
        private readonly FlightBookingDbContext _context;

        public RouteService(FlightBookingDbContext context)
        {
            _context = context;
        }

        public async Task<RouteDto> CreateAsync(CreateRouteRequest request)
        {
            if (request.OriginAirportId == request.DestinationAirportId)
                throw new BadRequestException("Điểm đi và điểm đến không được trùng nhau.");

            var duplicate = await _context.Routes.AnyAsync(r =>
                r.OriginAirportId == request.OriginAirportId &&
                r.DestinationAirportId == request.DestinationAirportId);
            if (duplicate)
                throw new BadRequestException("Tuyến đường này đã tồn tại.");

            var route = new Domain.Entities.Flights.Route
            {
                OriginAirportId = request.OriginAirportId,
                DestinationAirportId = request.DestinationAirportId,
                DistanceKm = request.DistanceKm,
                EstimatedDurationMinutes = request.EstimatedDurationMinutes,
                IsActive = true
            };

            _context.Routes.Add(route);
            await _context.SaveChangesAsync();
            return await GetByIdAsync(route.Id);
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var route = await _context.Routes.FindAsync(id)
                ?? throw new NotFoundException("Route", id);

            var hasFlights = await _context.Flights.AnyAsync(f => f.RouteId == id);
            if (hasFlights) throw new BadRequestException("Không thể xóa tuyến bay đang có chuyến bay.");

            _context.Routes.Remove(route);
            await _context.SaveChangesAsync();
            return true;
        }

        public Task<List<RouteDto>> GetAllAsync()
        {
            return _context.Routes
                .Include(r => r.OriginAirport)
                .Include(r => r.DestinationAirport)
                .Select(r => new RouteDto
                {
                    Id = r.Id,
                    OriginAirportId = r.OriginAirportId,
                    OriginCode = r.OriginAirport!.Code,
                    OriginCity = r.OriginAirport.City,
                    DestinationAirportId = r.DestinationAirportId,
                    DestinationCode = r.DestinationAirport!.Code,
                    DestinationCity = r.DestinationAirport.City,
                    DistanceKm = r.DistanceKm,
                    EstimatedDurationMinutes = r.EstimatedDurationMinutes,
                    IsActive = r.IsActive
                }).ToListAsync();
        }

        public async Task<RouteDto> GetByIdAsync(int id)
        {
            var route = await _context.Routes
                .Include(r => r.OriginAirport)
                .Include(r => r.DestinationAirport)
                .FirstOrDefaultAsync(r => r.Id == id)
                ?? throw new NotFoundException("Route", id);

            return new RouteDto
            {
                Id = route.Id,
                OriginAirportId = route.OriginAirportId,
                OriginCode = route.OriginAirport!.Code,
                OriginCity = route.OriginAirport.City,
                DestinationAirportId = route.DestinationAirportId,
                DestinationCode = route.DestinationAirport!.Code,
                DestinationCity = route.DestinationAirport.City,
                DistanceKm = route.DistanceKm,
                EstimatedDurationMinutes = route.EstimatedDurationMinutes,
                IsActive = route.IsActive
            };
        }

        public async Task<bool> UpdateAsync(int id, UpdateRouteRequest request)
        {
            var route = await _context.Routes.FindAsync(id)
                ?? throw new NotFoundException("Route", id);

            route.DistanceKm = request.DistanceKm;
            route.EstimatedDurationMinutes = request.EstimatedDurationMinutes;
            route.IsActive = request.IsActive;

            await _context.SaveChangesAsync();
            return true;
        }
    }
}