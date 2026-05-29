using FlightBooking.Application.Common.Exceptions;
using FlightBooking.Application.Common.Interfaces;
using FlightBooking.Application.Features.Flights.DTOs;
using FlightBooking.Application.Features.Flights.Interfaces;
using FlightBooking.Domain.Entities.Flights;
using FlightBooking.Domain.Entities.Seats;
using FlightBooking.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace FlightBooking.Application.Features.Flights.Services
{
    public class FlightScheduleService : IFlightScheduleService
    {
        private readonly IApplicationDbContext _context;

        public FlightScheduleService(IApplicationDbContext context)
        {
            _context = context;
        }

        private static FlightScheduleDto MapToDto(FlightSchedule s) => new()
        {
            Id = s.Id,
            FlightNumber = s.FlightNumber,
            DaysOfWeek = s.DaysOfWeek,
            StartDate = s.StartDate,
            EndDate = s.EndDate,
            RouteId = s.RouteId,
            OriginCode = s.Route?.OriginAirport?.Code ?? string.Empty,
            DestinationCode = s.Route?.DestinationAirport?.Code ?? string.Empty,
            AircraftId = s.AircraftId,
            AircraftModel = s.Aircraft?.Model ?? string.Empty,
            DepartureTime = s.DepartureTime.ToString(@"hh\:mm"),
            ArrivalTime = s.ArrivalTime.ToString(@"hh\:mm"),
            BasePrice = s.BasePrice,
            IsActive = s.IsActive,
            AirlineId = s.AirlineId,
            AirlineName = s.Airline?.Name ?? string.Empty,
            FlightsGenerated = s.Flights?.Count ?? 0
        };

        public async Task<List<FlightScheduleDto>> GetAllAsync()
        {
            var schedules = await _context.FlightSchedules
                .Include(s => s.Route).ThenInclude(r => r!.OriginAirport)
                .Include(s => s.Route).ThenInclude(r => r!.DestinationAirport)
                .Include(s => s.Aircraft)
                .Include(s => s.Airline)
                .Include(s => s.Flights)
                .ToListAsync();

            return schedules.Select(MapToDto).ToList();
        }

        public async Task<List<FlightScheduleDto>> GetByAirlineAsync(int airlineId)
        {
            var schedules = await _context.FlightSchedules
                .Include(s => s.Route).ThenInclude(r => r!.OriginAirport)
                .Include(s => s.Route).ThenInclude(r => r!.DestinationAirport)
                .Include(s => s.Aircraft)
                .Include(s => s.Airline)
                .Include(s => s.Flights)
                .Where(s => s.AirlineId == airlineId)
                .ToListAsync();

            return schedules.Select(MapToDto).ToList();
        }

        public async Task<FlightScheduleDto> CreateAsync(CreateFlightScheduleRequest request, int? airlineId)
        {
            var routeExists = await _context.Routes.AnyAsync(r => r.Id == request.RouteId);
            if (!routeExists) throw new NotFoundException("Route", request.RouteId);

            var aircraft = await _context.Aircrafts
                .FirstOrDefaultAsync(a => a.Id == request.AircraftId)
                ?? throw new NotFoundException("Aircraft", request.AircraftId);

            if (airlineId.HasValue && aircraft.AirlineId != airlineId.Value)
                throw new BadRequestException("Bạn không có quyền tạo lịch bay cho tàu bay của hãng khác.");

            if (!TimeSpan.TryParse(request.DepartureTime, out var departureTime))
                throw new BadRequestException("Giờ khởi hành không đúng định dạng HH:mm");

            if (!TimeSpan.TryParse(request.ArrivalTime, out var arrivalTime))
                throw new BadRequestException("Giờ hạ cánh không đúng định dạng HH:mm");

            // Days of week check
            var days = request.DaysOfWeek.Split(',', StringSplitOptions.RemoveEmptyEntries)
                .Select(d => d.Trim())
                .ToList();
            foreach (var d in days)
            {
                if (!int.TryParse(d, out var val) || val < 0 || val > 6)
                {
                    throw new BadRequestException("Danh sách các ngày trong tuần không hợp lệ (phải từ 0-6).");
                }
            }

            var schedule = new FlightSchedule
            {
                FlightNumber = request.FlightNumber,
                DaysOfWeek = string.Join(",", days),
                StartDate = request.StartDate.Date,
                EndDate = request.EndDate?.Date,
                RouteId = request.RouteId,
                AircraftId = request.AircraftId,
                DepartureTime = departureTime,
                ArrivalTime = arrivalTime,
                BasePrice = request.BasePrice,
                IsActive = true,
                AirlineId = airlineId
            };

            _context.FlightSchedules.Add(schedule);
            await _context.SaveChangesAsync();

            // Generate flights for the next 30 days immediately
            await GenerateFlightsForScheduleAsync(schedule, DateTime.Today, DateTime.Today.AddDays(30));

            // Reload to return full details
            var loadedSchedule = await _context.FlightSchedules
                .Include(s => s.Route).ThenInclude(r => r!.OriginAirport)
                .Include(s => s.Route).ThenInclude(r => r!.DestinationAirport)
                .Include(s => s.Aircraft)
                .Include(s => s.Airline)
                .Include(s => s.Flights)
                .FirstOrDefaultAsync(s => s.Id == schedule.Id);

            return MapToDto(loadedSchedule!);
        }

        public async Task<bool> UpdateAsync(int id, UpdateFlightScheduleRequest request)
        {
            var schedule = await _context.FlightSchedules
                .Include(s => s.Flights)
                .FirstOrDefaultAsync(s => s.Id == id)
                ?? throw new NotFoundException("FlightSchedule", id);

            if (!TimeSpan.TryParse(request.DepartureTime, out var departureTime))
                throw new BadRequestException("Giờ khởi hành không đúng định dạng HH:mm");

            if (!TimeSpan.TryParse(request.ArrivalTime, out var arrivalTime))
                throw new BadRequestException("Giờ hạ cánh không đúng định dạng HH:mm");

            var days = request.DaysOfWeek.Split(',', StringSplitOptions.RemoveEmptyEntries)
                .Select(d => d.Trim())
                .ToList();
            foreach (var d in days)
            {
                if (!int.TryParse(d, out var val) || val < 0 || val > 6)
                {
                    throw new BadRequestException("Danh sách các ngày trong tuần không hợp lệ (phải từ 0-6).");
                }
            }

            schedule.DaysOfWeek = string.Join(",", days);
            schedule.StartDate = request.StartDate.Date;
            schedule.EndDate = request.EndDate?.Date;
            schedule.RouteId = request.RouteId;
            schedule.AircraftId = request.AircraftId;
            schedule.DepartureTime = departureTime;
            schedule.ArrivalTime = arrivalTime;
            schedule.BasePrice = request.BasePrice;
            schedule.IsActive = request.IsActive;

            await _context.SaveChangesAsync();

            // If active, generate flights for the next 30 days that might be missing
            if (schedule.IsActive)
            {
                await GenerateFlightsForScheduleAsync(schedule, DateTime.Today, DateTime.Today.AddDays(30));
            }

            return true;
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var schedule = await _context.FlightSchedules
                .Include(s => s.Flights)
                .FirstOrDefaultAsync(s => s.Id == id)
                ?? throw new NotFoundException("FlightSchedule", id);

            // Check if there are any booked seats on any flights generated by this schedule
            var flightIds = schedule.Flights.Select(f => f.Id).ToList();
            if (flightIds.Count > 0)
            {
                var hasBookings = await _context.FlightSeats
                    .AnyAsync(fs => flightIds.Contains(fs.FlightId) &&
                                    _context.Tickets.Any(t => t.FlightSeatId == fs.Id));

                if (hasBookings)
                {
                    throw new BadRequestException("Không thể xóa lịch bay vì đã có vé đặt cho các chuyến bay thuộc lịch này.");
                }

                // If no tickets are booked, delete the associated flights first
                var associatedFlights = await _context.Flights
                    .Where(f => f.ScheduleId == id)
                    .ToListAsync();

                // Delete flight seats first
                var seats = await _context.FlightSeats
                    .Where(fs => flightIds.Contains(fs.FlightId))
                    .ToListAsync();

                _context.FlightSeats.RemoveRange(seats);
                _context.Flights.RemoveRange(associatedFlights);
            }

            _context.FlightSchedules.Remove(schedule);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<int> GenerateFlightsForDateAsync(DateTime date)
        {
            var activeSchedules = await _context.FlightSchedules
                .Where(s => s.IsActive)
                .ToListAsync();

            int generatedCount = 0;
            foreach (var schedule in activeSchedules)
            {
                generatedCount += await GenerateFlightForScheduleAndDateAsync(schedule, date);
            }

            return generatedCount;
        }

        public async Task<int> EnsureNext30DaysAsync()
        {
            var activeSchedules = await _context.FlightSchedules
                .Where(s => s.IsActive)
                .ToListAsync();

            int generatedCount = 0;
            var startDate = DateTime.Today;
            var endDate = DateTime.Today.AddDays(30);

            for (var date = startDate; date <= endDate; date = date.AddDays(1))
            {
                foreach (var schedule in activeSchedules)
                {
                    generatedCount += await GenerateFlightForScheduleAndDateAsync(schedule, date);
                }
            }

            return generatedCount;
        }

        // Helper to generate flights for a range of dates
        private async Task<int> GenerateFlightsForScheduleAsync(FlightSchedule schedule, DateTime startDate, DateTime endDate)
        {
            int count = 0;
            for (var date = startDate; date <= endDate; date = date.AddDays(1))
            {
                count += await GenerateFlightForScheduleAndDateAsync(schedule, date);
            }
            return count;
        }

        // Helper to generate flight for single date and schedule
        private async Task<int> GenerateFlightForScheduleAndDateAsync(FlightSchedule schedule, DateTime date)
        {
            date = date.Date;

            // 1. Check range of schedule
            if (date < schedule.StartDate || (schedule.EndDate.HasValue && date > schedule.EndDate.Value))
            {
                return 0;
            }

            // 2. Check day of week
            var dayOfWeekStr = ((int)date.DayOfWeek).ToString();
            var days = schedule.DaysOfWeek.Split(',', StringSplitOptions.RemoveEmptyEntries)
                .Select(d => d.Trim())
                .ToList();
            if (!days.Contains(dayOfWeekStr))
            {
                return 0;
            }

            // 3. Check if already generated (duplicate prevention)
            var flightNumber = $"{schedule.FlightNumber}-{date:MMdd}";
            var exists = await _context.Flights.AnyAsync(f => f.FlightNumber == flightNumber && f.DepartureTime.Date == date);
            if (exists)
            {
                return 0;
            }

            // 4. Retrieve aircraft and seat configurations
            var aircraft = await _context.Aircrafts
                .Include(a => a.SeatConfigurations)
                .FirstOrDefaultAsync(a => a.Id == schedule.AircraftId);

            if (aircraft == null)
            {
                return 0; // Aircraft not found, skip
            }

            // 5. Calculate departure and arrival date time
            var departureDateTime = date.Add(schedule.DepartureTime);
            var arrivalDateTime = date.Add(schedule.ArrivalTime);

            // Handle arrival time crossing midnight
            if (schedule.ArrivalTime < schedule.DepartureTime)
            {
                arrivalDateTime = arrivalDateTime.AddDays(1);
            }

            var flight = new Flight
            {
                FlightNumber = flightNumber,
                RouteId = schedule.RouteId,
                AircraftId = schedule.AircraftId,
                ScheduleId = schedule.Id,
                DepartureTime = departureDateTime,
                ArrivalTime = arrivalDateTime,
                BasePrice = schedule.BasePrice,
                Status = FlightStatus.Scheduled
            };

            _context.Flights.Add(flight);
            await _context.SaveChangesAsync();

            // 6. Generate Seats
            var seats = aircraft.SeatConfigurations.Select(sc => new FlightSeat
            {
                FlightId = flight.Id,
                SeatNumber = sc.SeatNumber,
                ClassType = sc.ClassType,
                Status = SeatStatus.Available,
                Price = schedule.BasePrice * sc.PriceMultiplier
            }).ToList();

            _context.FlightSeats.AddRange(seats);
            await _context.SaveChangesAsync();

            return 1;
        }
    }
}
