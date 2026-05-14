using FlightBooking.Application.Common.Exceptions;
using FlightBooking.Application.Features.Flights.DTOs;
using FlightBooking.Application.Features.Flights.Interfaces;
using FlightBooking.Domain.Entities.Flights;
using FlightBooking.Domain.Entities.Seats;
using FlightBooking.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace FlightBooking.Infrastructure.Services
{
    public class FlightService : IFlightService
    {
        private readonly FlightBookingDbContext _context;

        public FlightService(FlightBookingDbContext context)
        {
            _context = context;
        }

        private static FlightDto MapToDto(Flight f, int availableSeats) => new()
        {
            Id = f.Id,
            FlightNumber = f.FlightNumber,
            RouteId = f.RouteId,
            OriginCode = f.Route?.OriginAirport?.Code ?? string.Empty,
            DestinationCode = f.Route?.DestinationAirport?.Code ?? string.Empty,
            AircraftId = f.AircraftId,
            AircraftModel = f.Aircraft?.Model ?? string.Empty,
            DepartureTime = f.DepartureTime,
            ArrivalTime = f.ArrivalTime,
            Status = f.Status.ToString(),
            BasePrice = f.BasePrice,
            AvailableSeats = availableSeats,
            AirlineCode = f.Aircraft?.Airline?.Code ?? string.Empty,
            AirlineName = f.Aircraft?.Airline?.Name ?? string.Empty,
            AirlineLogo = f.Aircraft?.Airline?.LogoUrl ?? string.Empty
        };

        public async Task<List<FlightDto>> GetAllAsync()
        {
            var flights = await _context.Flights
                .Include(f => f.Route).ThenInclude(r => r!.OriginAirport)
                .Include(f => f.Route).ThenInclude(r => r!.DestinationAirport)
                .Include(f => f.Aircraft).ThenInclude(a => a!.Airline)
                .ToListAsync();

            return flights.Select(f =>
            {
                var available = _context.FlightSeats
                    .Count(s => s.FlightId == f.Id && s.Status == Domain.Enums.SeatStatus.Available);
                return MapToDto(f, available);
            }).ToList();
        }

        public async Task<FlightDto> GetByIdAsync(int id)
        {
            var flight = await _context.Flights
                .Include(f => f.Route).ThenInclude(r => r!.OriginAirport)
                .Include(f => f.Route).ThenInclude(r => r!.DestinationAirport)
                .Include(f => f.Aircraft).ThenInclude(a => a!.Airline)
                .FirstOrDefaultAsync(f => f.Id == id)
                ?? throw new NotFoundException("Flight", id);

            var availableSeats = await _context.FlightSeats
                .CountAsync(s => s.FlightId == id && s.Status == Domain.Enums.SeatStatus.Available);

            return MapToDto(flight, availableSeats);
        }

        public async Task<List<FlightDto>> GetByAirlineAsync(int airlineId)
        {
            var flights = await _context.Flights
                .Include(f => f.Route).ThenInclude(r => r!.OriginAirport)
                .Include(f => f.Route).ThenInclude(r => r!.DestinationAirport)
                .Include(f => f.Aircraft).ThenInclude(a => a!.Airline)
                .Where(f => f.Aircraft != null && f.Aircraft.AirlineId == airlineId)
                .ToListAsync();

            return flights.Select(f =>
            {
                var available = _context.FlightSeats
                    .Count(s => s.FlightId == f.Id && s.Status == Domain.Enums.SeatStatus.Available);
                return MapToDto(f, available);
            }).ToList();
        }

        public async Task<List<FlightDto>> SearchAsync(SearchFlightRequest request)
        {
            var flights = await _context.Flights
                .Include(f => f.Route).ThenInclude(r => r!.OriginAirport)
                .Include(f => f.Route).ThenInclude(r => r!.DestinationAirport)
                .Include(f => f.Aircraft).ThenInclude(a => a!.Airline)
                .Where(f =>
                    f.Route!.OriginAirportId == request.OriginAirportId &&
                    f.Route.DestinationAirportId == request.DestinationAirportId &&
                    f.DepartureTime.Date == request.DepartureDate.Date &&
                    f.Status == Domain.Enums.FlightStatus.Scheduled)
                .ToListAsync();

            var result = new List<FlightDto>();
            foreach (var f in flights)
            {
                var availableSeats = await _context.FlightSeats
                    .CountAsync(s => s.FlightId == f.Id && s.Status == Domain.Enums.SeatStatus.Available);
                if (availableSeats >= request.PassengerCount)
                    result.Add(MapToDto(f, availableSeats));
            }
            return result;
        }

        public async Task<FlightDto> CreateAsync(CreateFlightRequest request, int? currentAirlineId = null)
        {
            var routeExists = await _context.Routes.AnyAsync(r => r.Id == request.RouteId);
            if (!routeExists) throw new NotFoundException("Route", request.RouteId);

            var aircraft = await _context.Aircrafts
                .Include(a => a.SeatConfigurations)
                .FirstOrDefaultAsync(a => a.Id == request.AircraftId)
                ?? throw new NotFoundException("Aircraft", request.AircraftId);

            if (currentAirlineId.HasValue && aircraft.AirlineId != currentAirlineId.Value)
                throw new BadRequestException("Bạn không có quyền tạo chuyến bay cho tàu bay của hãng khác.");

            var duplicate = await _context.Flights.AnyAsync(f =>
                f.FlightNumber == request.FlightNumber &&
                f.DepartureTime.Date == request.DepartureTime.Date);
            if (duplicate) throw new BadRequestException("Số hiệu chuyến bay đã tồn tại trong ngày này.");

            var flight = new Flight
            {
                FlightNumber = request.FlightNumber,
                RouteId = request.RouteId,
                AircraftId = request.AircraftId,
                DepartureTime = request.DepartureTime,
                ArrivalTime = request.ArrivalTime,
                BasePrice = request.BasePrice,
                Status = Domain.Enums.FlightStatus.Scheduled
            };
            _context.Flights.Add(flight);
            await _context.SaveChangesAsync();

            // Auto-generate FlightSeats từ SeatConfigurations của tàu bay
            var seats = aircraft.SeatConfigurations.Select(sc => new FlightSeat
            {
                FlightId = flight.Id,
                SeatNumber = sc.SeatNumber,
                ClassType = sc.ClassType,
                Status = Domain.Enums.SeatStatus.Available,
                Price = request.BasePrice * sc.PriceMultiplier
            }).ToList();
            _context.FlightSeats.AddRange(seats);
            await _context.SaveChangesAsync();

            return await GetByIdAsync(flight.Id);
        }

        public async Task<bool> UpdateAsync(int id, UpdateFlightRequest request)
        {
            var flight = await _context.Flights.FindAsync(id)
                ?? throw new NotFoundException("Flight", id);

            flight.DepartureTime = request.DepartureTime;
            flight.ArrivalTime = request.ArrivalTime;
            flight.BasePrice = request.BasePrice;
            flight.Status = Enum.Parse<Domain.Enums.FlightStatus>(request.Status);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<List<FlightSeatDto>> GetSeatsByFlightIdAsync(int flightId)
        {
            var flightExists = await _context.Flights.AnyAsync(f => f.Id == flightId);
            if (!flightExists) throw new NotFoundException("Flight", flightId);

            var seats = await _context.FlightSeats
                .Where(s => s.FlightId == flightId)
                .OrderBy(s => s.SeatNumber)
                .Select(s => new FlightSeatDto
                {
                    Id = s.Id,
                    FlightId = s.FlightId,
                    SeatNumber = s.SeatNumber,
                    ClassType = s.ClassType,
                    Status = s.Status,
                    Price = s.Price
                })
                .ToListAsync();

            return seats;
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var flight = await _context.Flights.FindAsync(id)
                ?? throw new NotFoundException("Flight", id);

            // Kiểm tra đúng: có Ticket nào gắn với ghế của chuyến này không
            var hasBookings = await _context.FlightSeats
                .AnyAsync(fs => fs.FlightId == id &&
                                _context.Tickets.Any(t => t.FlightSeatId == fs.Id));
            if (hasBookings) throw new BadRequestException("Không thể xóa chuyến bay đã có vé đặt.");

            _context.Flights.Remove(flight);
            await _context.SaveChangesAsync();
            return true;
        }
    }
}
