using FlightBooking.Application.Common.Exceptions;
using FlightBooking.Application.Features.Flights.DTOs;
using FlightBooking.Application.Features.Flights.Interfaces;
using FlightBooking.Domain.Entities.Flights;
using FlightBooking.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace FlightBooking.Infrastructure.Services
{
    public class AircraftService : IAircraftService
    {
        private readonly FlightBookingDbContext _context;

        public AircraftService(FlightBookingDbContext context)
        {
            _context = context;
        }

        private static AircraftDto MapToDto(Aircraft a) => new()
        {
            Id = a.Id,
            RegistrationNumber = a.RegistrationNumber,
            Model = a.Model,
            TotalSeats = a.TotalSeats,
            AirlineId = a.AirlineId,
            AirlineName = a.Airline?.Name ?? string.Empty,
            IsActive = a.IsActive
        };

        public async Task<List<AircraftDto>> GetAllAsync()
        {
            return await _context.Aircrafts
                .Include(a => a.Airline)
                .Select(a => new AircraftDto
                {
                    Id = a.Id,
                    RegistrationNumber = a.RegistrationNumber,
                    Model = a.Model,
                    TotalSeats = a.TotalSeats,
                    AirlineId = a.AirlineId,
                    AirlineName = a.Airline!.Name,
                    IsActive = a.IsActive
                }).ToListAsync();
        }

        public async Task<AircraftDto> GetByIdAsync(int id)
        {
            var aircraft = await _context.Aircrafts
                .Include(a => a.Airline)
                .FirstOrDefaultAsync(a => a.Id == id)
                ?? throw new NotFoundException("Aircraft", id);
            return MapToDto(aircraft);
        }

        public async Task<List<AircraftDto>> GetByAirlineAsync(int airlineId)
        {
            return await _context.Aircrafts
                .Include(a => a.Airline)
                .Where(a => a.AirlineId == airlineId)
                .Select(a => new AircraftDto
                {
                    Id = a.Id,
                    RegistrationNumber = a.RegistrationNumber,
                    Model = a.Model,
                    TotalSeats = a.TotalSeats,
                    AirlineId = a.AirlineId,
                    AirlineName = a.Airline!.Name,
                    IsActive = a.IsActive
                }).ToListAsync();
        }

        public async Task<AircraftDto> CreateAsync(CreateAircraftRequest request)
        {
            var airlineExists = await _context.Airlines.AnyAsync(a => a.Id == request.AirlineId);
            if (!airlineExists) throw new NotFoundException("Airline", request.AirlineId);

            var duplicate = await _context.Aircrafts
                .AnyAsync(a => a.RegistrationNumber == request.RegistrationNumber);
            if (duplicate) throw new BadRequestException("Số đăng ký tàu bay đã tồn tại.");

            var aircraft = new Aircraft
            {
                RegistrationNumber = request.RegistrationNumber,
                Model = request.Model,
                TotalSeats = request.TotalSeats,
                AirlineId = request.AirlineId,
                IsActive = true
            };
            _context.Aircrafts.Add(aircraft);
            await _context.SaveChangesAsync();
            return await GetByIdAsync(aircraft.Id);
        }

        public async Task<bool> UpdateAsync(int id, UpdateAircraftRequest request)
        {
            var aircraft = await _context.Aircrafts.FindAsync(id)
                ?? throw new NotFoundException("Aircraft", id);
            aircraft.Model = request.Model;
            aircraft.TotalSeats = request.TotalSeats;
            aircraft.IsActive = request.IsActive;
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var aircraft = await _context.Aircrafts.FindAsync(id)
                ?? throw new NotFoundException("Aircraft", id);
            var hasFlights = await _context.Flights.AnyAsync(f => f.AircraftId == id);
            if (hasFlights) throw new BadRequestException("Không thể xóa tàu bay đang có lịch bay.");
            _context.Aircrafts.Remove(aircraft);
            await _context.SaveChangesAsync();
            return true;
        }
    }
}
