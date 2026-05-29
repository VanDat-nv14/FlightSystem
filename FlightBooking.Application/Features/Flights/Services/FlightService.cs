using FlightBooking.Application.Common.Exceptions;
using FlightBooking.Application.Common.Interfaces;
using FlightBooking.Application.Features.Flights.DTOs;
using FlightBooking.Application.Features.Flights.Interfaces;
using FlightBooking.Domain.Entities.Flights;
using FlightBooking.Domain.Entities.Seats;
using FlightBooking.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using System.Threading.Tasks;
using System.Collections.Generic;
using System.Linq;
using System;

namespace FlightBooking.Application.Features.Flights.Services
{
    public class FlightService : IFlightService
    {
        private readonly IApplicationDbContext _context;
        private readonly IJobScheduler _jobScheduler;

        public FlightService(IApplicationDbContext context, IJobScheduler jobScheduler)
        {
            _context = context;
            _jobScheduler = jobScheduler;
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
            StopCount = f.StopCount,
            StopoverCodes = f.StopoverCodes,
            BasePrice = f.BasePrice,
            AvailableSeats = availableSeats,
            AirlineCode = f.Aircraft?.Airline?.Code ?? string.Empty,
            AirlineName = f.Aircraft?.Airline?.Name ?? string.Empty,
            AirlineLogo = f.Aircraft?.Airline?.LogoUrl ?? string.Empty
        };

        private async Task<Dictionary<int, int>> GetAvailableSeatCountsAsync(IEnumerable<int> flightIds)
        {
            var ids = flightIds.Distinct().ToList();
            if (ids.Count == 0)
                return new Dictionary<int, int>();

            return await _context.FlightSeats
                .Where(s => ids.Contains(s.FlightId) && s.Status == SeatStatus.Available)
                .GroupBy(s => s.FlightId)
                .Select(g => new { FlightId = g.Key, Count = g.Count() })
                .ToDictionaryAsync(x => x.FlightId, x => x.Count);
        }

        public async Task<List<FlightDto>> GetAllAsync()
        {
            var today = DateTime.Today;
            var flights = await _context.Flights
                .Include(f => f.Route).ThenInclude(r => r!.OriginAirport)
                .Include(f => f.Route).ThenInclude(r => r!.DestinationAirport)
                .Include(f => f.Aircraft).ThenInclude(a => a!.Airline)
                // Chỉ hiển thị chuyến bay trong tương lai và còn đặt được
                .Where(f => f.DepartureTime.Date >= today
                         && f.Status == Domain.Enums.FlightStatus.Scheduled)
                .OrderBy(f => f.DepartureTime)
                .ToListAsync();

            var availableSeatCounts = await GetAvailableSeatCountsAsync(flights.Select(f => f.Id));

            return flights.Select(f =>
                MapToDto(f, availableSeatCounts.GetValueOrDefault(f.Id))).ToList();
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

            var availableSeatCounts = await GetAvailableSeatCountsAsync(flights.Select(f => f.Id));

            return flights.Select(f =>
                MapToDto(f, availableSeatCounts.GetValueOrDefault(f.Id))).ToList();
        }

        public async Task<List<FlightDto>> SearchAsync(SearchFlightRequest request)
        {
            // Chặn tìm kiếm vé ngày quá khứ
            if (request.DepartureDate.Date < DateTime.Today)
                throw new BadRequestException("Không thể tìm kiếm chuyến bay trong ngày đã qua.");

            var flights = await _context.Flights
                .Include(f => f.Route).ThenInclude(r => r!.OriginAirport)
                .Include(f => f.Route).ThenInclude(r => r!.DestinationAirport)
                .Include(f => f.Aircraft).ThenInclude(a => a!.Airline)
                .Where(f =>
                    f.Route!.OriginAirportId == request.OriginAirportId &&
                    f.Route.DestinationAirportId == request.DestinationAirportId &&
                    f.DepartureTime.Date == request.DepartureDate.Date &&
                    f.Status == Domain.Enums.FlightStatus.Scheduled)
                .OrderBy(f => f.DepartureTime)
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

        public async Task<bool> HoldSeatsAsync(int flightId, List<string> seatNumbers)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var seats = await _context.FlightSeats
                    .Where(s => s.FlightId == flightId && seatNumbers.Contains(s.SeatNumber))
                    .ToListAsync();

                if (seats.Count != seatNumbers.Count)
                    throw new BadRequestException("Một số ghế không tồn tại.");

                if (seats.Any(s => s.Status != SeatStatus.Available))
                    throw new BadRequestException("Một hoặc nhiều ghế đã được đặt hoặc đang được giữ bởi người khác.");

                foreach (var seat in seats)
                {
                    seat.Status = SeatStatus.Reserved;
                }

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                // Lên lịch Hangfire job để nhả ghế sau 10 phút
                _jobScheduler.Schedule<IFlightService>(
                    x => x.ReleaseHeldSeatsAsync(flightId, seatNumbers), 
                    TimeSpan.FromMinutes(10));

                return true;
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        public async Task ReleaseHeldSeatsAsync(int flightId, List<string> seatNumbers)
        {
            // Được gọi bởi Hangfire
            var seats = await _context.FlightSeats
                .Where(s => s.FlightId == flightId && seatNumbers.Contains(s.SeatNumber) && s.Status == SeatStatus.Reserved)
                .ToListAsync();

            if (seats.Any())
            {
                foreach (var seat in seats)
                {
                    seat.Status = SeatStatus.Available;
                }
                await _context.SaveChangesAsync();
            }
        }

        public async Task<bool> UpdateStatusAsync(int id, string newStatus, string? airportCode, string userRole, int? currentAirlineId = null, string? delayReason = null)
        {
            var flight = await _context.Flights
                .Include(f => f.Route).ThenInclude(r => r!.OriginAirport)
                .Include(f => f.Route).ThenInclude(r => r!.DestinationAirport)
                .Include(f => f.Aircraft)
                .FirstOrDefaultAsync(f => f.Id == id)
                ?? throw new NotFoundException("Flight", id);

            if (!Enum.TryParse<FlightStatus>(newStatus, true, out var targetStatus))
            {
                throw new BadRequestException($"Trạng thái không hợp lệ: {newStatus}");
            }

            var currentStatus = flight.Status;

            // Kiểm tra trạng thái cuối (Completed, Cancelled)
            if (currentStatus == FlightStatus.Completed || currentStatus == FlightStatus.Cancelled)
            {
                throw new BadRequestException("Chuyến bay đã hoàn thành hoặc đã hủy, không thể thay đổi trạng thái.");
            }

            // Kiểm tra quyền dựa trên vai trò
            if (userRole == "Admin" || userRole == "Employee")
            {
                // Quyền Admin/Employee không giới hạn
            }
            else if (userRole == "AirlineManager")
            {
                if (!currentAirlineId.HasValue || flight.Aircraft == null || flight.Aircraft.AirlineId != currentAirlineId.Value)
                {
                    throw new BadRequestException("Bạn không có quyền cập nhật trạng thái cho chuyến bay của hãng khác.");
                }
            }
            else if (userRole == "AirportStaff")
            {
                if (string.IsNullOrEmpty(airportCode))
                {
                    throw new BadRequestException("Tài khoản nhân viên sân bay chưa được cấu hình mã sân bay.");
                }

                var origin = flight.Route?.OriginAirport?.Code;
                var destination = flight.Route?.DestinationAirport?.Code;

                if (origin != airportCode && destination != airportCode)
                {
                    throw new BadRequestException($"Nhân viên sân bay {airportCode} không có quyền quản lý chuyến bay này ({origin} -> {destination}).");
                }

                // Sân bay xuất phát
                if (origin == airportCode && destination != airportCode)
                {
                    var allowed = new[] { FlightStatus.Boarding, FlightStatus.InFlight, FlightStatus.Delayed, FlightStatus.Cancelled, FlightStatus.Scheduled };
                    if (!allowed.Contains(targetStatus))
                    {
                        throw new BadRequestException($"Nhân viên sân bay đi ({airportCode}) không có quyền chuyển trạng thái sang {newStatus}.");
                    }
                    if (targetStatus == FlightStatus.InFlight && currentStatus != FlightStatus.Boarding)
                    {
                        throw new BadRequestException("Chỉ có thể chuyển sang trạng thái Đang bay (InFlight) từ trạng thái Đang lên máy bay (Boarding).");
                    }
                }
                // Sân bay đến
                else if (destination == airportCode && origin != airportCode)
                {
                    var allowed = new[] { FlightStatus.Completed, FlightStatus.Delayed };
                    if (!allowed.Contains(targetStatus))
                    {
                        throw new BadRequestException($"Nhân viên sân bay đến ({airportCode}) không có quyền chuyển trạng thái sang {newStatus}.");
                    }
                    if (targetStatus == FlightStatus.Completed && currentStatus != FlightStatus.InFlight)
                    {
                        throw new BadRequestException("Chỉ có thể hoàn thành (Completed) chuyến bay đang ở trạng thái Đang bay (InFlight).");
                    }
                }
                // Trường hợp đặc biệt (nội bộ hoặc trùng, hiếm gặp)
                else if (origin == airportCode && destination == airportCode)
                {
                    // Toàn quyền
                }
            }
            else
            {
                throw new BadRequestException("Vai trò người dùng không có quyền cập nhật trạng thái chuyến bay.");
            }

            // Validate State Machine Transitions (cho tất cả)
            bool isValidTransition = false;
            switch (currentStatus)
            {
                case FlightStatus.Scheduled:
                    isValidTransition = targetStatus == FlightStatus.Boarding || 
                                        targetStatus == FlightStatus.Delayed || 
                                        targetStatus == FlightStatus.Cancelled;
                    break;
                case FlightStatus.Boarding:
                    isValidTransition = targetStatus == FlightStatus.InFlight || 
                                        targetStatus == FlightStatus.Delayed || 
                                        targetStatus == FlightStatus.Cancelled;
                    break;
                case FlightStatus.InFlight:
                    isValidTransition = targetStatus == FlightStatus.Completed || 
                                        targetStatus == FlightStatus.Delayed;
                    break;
                case FlightStatus.Delayed:
                    isValidTransition = targetStatus == FlightStatus.Scheduled || 
                                        targetStatus == FlightStatus.Boarding || 
                                        targetStatus == FlightStatus.Cancelled;
                    break;
            }

            if (!isValidTransition && currentStatus != targetStatus)
            {
                throw new BadRequestException($"Không thể chuyển trực tiếp trạng thái chuyến bay từ {currentStatus} sang {targetStatus}.");
            }

            flight.Status = targetStatus;
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<List<FlightDto>> GetByAirportAsync(string airportCode)
        {
            var today = DateTime.Today;
            var flights = await _context.Flights
                .Include(f => f.Route).ThenInclude(r => r!.OriginAirport)
                .Include(f => f.Route).ThenInclude(r => r!.DestinationAirport)
                .Include(f => f.Aircraft).ThenInclude(a => a!.Airline)
                .Where(f => (f.Route!.OriginAirport!.Code == airportCode || f.Route.DestinationAirport!.Code == airportCode) 
                            && f.DepartureTime.Date == today)
                .ToListAsync();

            var availableSeatCounts = await GetAvailableSeatCountsAsync(flights.Select(f => f.Id));

            return flights.Select(f =>
                MapToDto(f, availableSeatCounts.GetValueOrDefault(f.Id))).ToList();
        }

        public async Task<int> AutoCompleteArrivedFlightsAsync()
        {
            var now = DateTime.Now;
            var arrivedFlights = await _context.Flights
                .Where(f => f.Status == FlightStatus.InFlight && f.ArrivalTime <= now)
                .ToListAsync();

            int updatedCount = 0;
            foreach (var flight in arrivedFlights)
            {
                flight.Status = FlightStatus.Completed;
                updatedCount++;
            }

            if (updatedCount > 0)
            {
                await _context.SaveChangesAsync();
            }

            return updatedCount;
        }
    }
}
