using FlightBooking.Application.Common.Exceptions;
using FlightBooking.Application.Features.Flights.DTOs;
using FlightBooking.Application.Features.Flights.Interfaces;
using FlightBooking.Domain.Entities.Seats;
using FlightBooking.Domain.Enums;
using FlightBooking.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace FlightBooking.Infrastructure.Services
{
    public class SeatConfigurationService : ISeatConfigurationService
    {
        private readonly FlightBookingDbContext _context;

        public SeatConfigurationService(FlightBookingDbContext context)
        {
            _context = context;
        }

        public async Task<List<SeatConfigurationDto>> GetByAircraftAsync(int aircraftId, int? currentAirlineId = null)
        {
            var aircraft = await _context.Aircrafts.FindAsync(aircraftId)
                ?? throw new NotFoundException("Aircraft", aircraftId);

            if (currentAirlineId.HasValue && aircraft.AirlineId != currentAirlineId.Value)
                throw new BadRequestException("Bạn không có quyền xem cấu hình ghế của tàu bay này.");

            return await _context.SeatConfigurations
                .Where(sc => sc.AircraftId == aircraftId)
                .Select(sc => new SeatConfigurationDto
                {
                    Id = sc.Id,
                    AircraftId = sc.AircraftId,
                    SeatNumber = sc.SeatNumber,
                    PriceMultiplier = sc.PriceMultiplier,
                    ClassType = sc.ClassType.ToString(),
                    Position = sc.Position.ToString()
                }).ToListAsync();
        }

        public async Task<bool> ClearByAircraftAsync(int aircraftId, int? currentAirlineId = null)
        {
            var aircraft = await _context.Aircrafts.FindAsync(aircraftId)
                ?? throw new NotFoundException("Aircraft", aircraftId);

            if (currentAirlineId.HasValue && aircraft.AirlineId != currentAirlineId.Value)
                throw new BadRequestException("Bạn không có quyền xóa cấu hình ghế của tàu bay này.");

            var hasFlights = await _context.Flights.AnyAsync(f => f.AircraftId == aircraftId);
            if (hasFlights)
                throw new BadRequestException("Không thể xóa cấu hình ghế vì tàu bay này đã được xếp lịch bay.");

            var seats = await _context.SeatConfigurations.Where(sc => sc.AircraftId == aircraftId).ToListAsync();
            _context.SeatConfigurations.RemoveRange(seats);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> BulkCreateAsync(BulkCreateSeatConfigRequest request, int? currentAirlineId = null)
        {
            var aircraft = await _context.Aircrafts.FindAsync(request.AircraftId)
                ?? throw new NotFoundException("Aircraft", request.AircraftId);

            if (currentAirlineId.HasValue && aircraft.AirlineId != currentAirlineId.Value)
                throw new BadRequestException("Bạn không có quyền cấu hình ghế cho tàu bay này.");

            var hasFlights = await _context.Flights.AnyAsync(f => f.AircraftId == request.AircraftId);
            if (hasFlights)
                throw new BadRequestException("Không thể tạo cấu hình ghế vì tàu bay này đã được xếp lịch bay.");

            var existingSeats = await _context.SeatConfigurations.AnyAsync(sc => sc.AircraftId == request.AircraftId);
            if (existingSeats)
                throw new BadRequestException("Tàu bay này đã có cấu hình ghế. Vui lòng xóa cấu hình cũ trước.");

            int totalRequestedSeats = request.Classes.Sum(c => c.NumberOfSeats);
            if (totalRequestedSeats > aircraft.TotalSeats)
                throw new BadRequestException($"Tổng số ghế yêu cầu ({totalRequestedSeats}) vượt quá sức chứa của tàu bay ({aircraft.TotalSeats}).");

            var newConfigurations = new List<SeatConfiguration>();
            int currentRow = 1;
            int remainingInRow = request.SeatsPerRow;

            char[] seatLetters = "ABCDEFGHJK".ToCharArray();

            foreach (var cls in request.Classes)
            {
                SeatClassType classTypeEnum = Enum.Parse<SeatClassType>(cls.ClassType);
                int seatsToCreate = cls.NumberOfSeats;

                while (seatsToCreate > 0)
                {
                    int currentSeatIndex = request.SeatsPerRow - remainingInRow;
                    char letter = seatLetters[currentSeatIndex % seatLetters.Length];

                    SeatPosition pos = SeatPosition.Middle;
                    if (currentSeatIndex == 0 || currentSeatIndex == request.SeatsPerRow - 1)
                        pos = SeatPosition.Window;
                    else if (currentSeatIndex == (request.SeatsPerRow / 2) - 1 || currentSeatIndex == (request.SeatsPerRow / 2))
                        pos = SeatPosition.Aisle;

                    newConfigurations.Add(new SeatConfiguration
                    {
                        AircraftId = request.AircraftId,
                        SeatNumber = $"{currentRow}{letter}",
                        ClassType = classTypeEnum,
                        Position = pos,
                        PriceMultiplier = cls.PriceMultiplier
                    });

                    seatsToCreate--;
                    remainingInRow--;

                    if (remainingInRow == 0)
                    {
                        currentRow++;
                        remainingInRow = request.SeatsPerRow;
                    }
                }
            }

            _context.SeatConfigurations.AddRange(newConfigurations);
            await _context.SaveChangesAsync();
            return true;
        }
    }
}
