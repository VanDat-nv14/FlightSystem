using FlightBooking.Application.Common.Exceptions;
using FlightBooking.Application.Features.Flights.DTOs;
using FlightBooking.Application.Features.Flights.Interfaces;
using FlightBooking.Domain.Entities.Flights;
using FlightBooking.Domain.Enums;
using FlightBooking.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace FlightBooking.Infrastructure.Services
{
    public class AirlineService : IAirlineService
    {
        private readonly FlightBookingDbContext _context;

        public AirlineService(FlightBookingDbContext context)
        {
            _context = context;
        }

        public async Task<List<AirlineDto>> GetAllAsync()
        {
            return await _context.Airlines
                .Include(a => a.Aircrafts)
                .Select(a => new AirlineDto
                {
                    Id = a.Id,
                    Code = a.Code,
                    Name = a.Name,
                    LogoUrl = a.LogoUrl,
                    Country = a.Country,
                    IsActive = a.IsActive,
                    Status = a.Status.ToString(),
                    AircraftCount = a.Aircrafts != null ? a.Aircrafts.Count : 0
                }).ToListAsync();
        }

        public async Task<AirlineDto> GetByIdAsync(int id)
        {
            var airline = await _context.Airlines
                .Include(a => a.Aircrafts)
                .FirstOrDefaultAsync(a => a.Id == id)
                ?? throw new NotFoundException("Airline", id);

            return new AirlineDto
            {
                Id = airline.Id,
                Code = airline.Code,
                Name = airline.Name,
                LogoUrl = airline.LogoUrl,
                Country = airline.Country,
                IsActive = airline.IsActive,
                Status = airline.Status.ToString(),
                AircraftCount = airline.Aircrafts?.Count ?? 0
            };
        }

        public async Task<AirlineDto> CreateAsync(CreateAirlineRequest request)
        {
            var exists = await _context.Airlines.AnyAsync(a => a.Code == request.Code);
            if (exists) throw new BadRequestException($"Mã hãng '{request.Code}' đã tồn tại.");

            var airline = new Airline
            {
                Code = request.Code.ToUpper(),
                Name = request.Name,
                LogoUrl = request.LogoUrl,
                Country = request.Country,
                IsActive = false,
                Status = AirlineStatus.Pending
            };

            _context.Airlines.Add(airline);
            await _context.SaveChangesAsync();
            return await GetByIdAsync(airline.Id);
        }

        public async Task<bool> UpdateAsync(int id, UpdateAirlineRequest request)
        {
            var airline = await _context.Airlines.FindAsync(id)
                ?? throw new NotFoundException("Airline", id);

            airline.Name = request.Name;
            airline.LogoUrl = request.LogoUrl;
            airline.Country = request.Country;
            airline.IsActive = request.IsActive;

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> UpdateStatusAsync(int id, UpdateAirlineStatusRequest request)
        {
            var airline = await _context.Airlines.FindAsync(id)
                ?? throw new NotFoundException("Airline", id);

            if (!Enum.TryParse<AirlineStatus>(request.Status, out var newStatus))
                throw new BadRequestException($"Trạng thái '{request.Status}' không hợp lệ.");

            airline.Status = newStatus;
            // Nếu Approved: bật IsActive, ngược lại tắt
            airline.IsActive = newStatus == AirlineStatus.Approved;

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var airline = await _context.Airlines.FindAsync(id)
                ?? throw new NotFoundException("Airline", id);

            var hasAircrafts = await _context.Aircrafts.AnyAsync(a => a.AirlineId == id);
            if (hasAircrafts) throw new BadRequestException("Không thể xóa hãng đang có tàu bay.");

            _context.Airlines.Remove(airline);
            await _context.SaveChangesAsync();
            return true;
        }
    }
}
