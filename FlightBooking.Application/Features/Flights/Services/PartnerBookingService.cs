using FlightBooking.Application.Common.Interfaces;
using FlightBooking.Application.Features.Flights.DTOs;
using FlightBooking.Application.Features.Flights.Interfaces;
using FlightBooking.Application.Common.Exceptions;
using FlightBooking.Domain.Entities.Bookings;
using FlightBooking.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace FlightBooking.Application.Features.Flights.Services
{
    public class PartnerBookingService : IPartnerBookingService
    {
        private readonly IApplicationDbContext _context;

        public PartnerBookingService(IApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<List<PartnerTicketDto>> GetTicketsByAirlineAsync(int airlineId)
        {
            // Traverse: Ticket → FlightSeat → Flight → Aircraft → Airline
            var tickets = await _context.Tickets
                .Include(t => t.FlightSeat)
                    .ThenInclude(fs => fs!.Flight)
                        .ThenInclude(f => f!.Route)
                            .ThenInclude(r => r!.OriginAirport)
                .Include(t => t.FlightSeat)
                    .ThenInclude(fs => fs!.Flight)
                        .ThenInclude(f => f!.Route)
                            .ThenInclude(r => r!.DestinationAirport)
                .Include(t => t.FlightSeat)
                    .ThenInclude(fs => fs!.Flight)
                        .ThenInclude(f => f!.Aircraft)
                .Include(t => t.Passenger)
                .Include(t => t.Booking)
                    .ThenInclude(b => b!.User)
                .Include(t => t.Booking)
                    .ThenInclude(b => b!.Tickets)
                .Where(t =>
                    t.FlightSeat != null &&
                    t.FlightSeat.Flight != null &&
                    t.FlightSeat.Flight.Aircraft != null &&
                    t.FlightSeat.Flight.Aircraft.AirlineId == airlineId)
                .OrderByDescending(t => t.Booking!.BookingDate)
                .ToListAsync();

            await AutoMarkNoShowsAsync(tickets);

            var ticketIds = tickets.Select(t => t.Id).ToList();
            var baggageTags = await _context.BaggageTags
                .Include(bt => bt.BookingBaggage)
                .Where(bt => ticketIds.Contains(bt.TicketId))
                .ToListAsync();

            return tickets.Select(t => MapToDto(t, baggageTags)).ToList();
        }

        public async Task<List<PartnerTicketDto>> GetTicketsByBookingCodeAsync(int airlineId, string bookingCode)
        {
            if (string.IsNullOrWhiteSpace(bookingCode))
                throw new BadRequestException("Mã booking không hợp lệ.");

            var normalized = bookingCode.Trim().ToUpperInvariant();

            var tickets = await _context.Tickets
                .Include(t => t.FlightSeat)
                    .ThenInclude(fs => fs!.Flight)
                        .ThenInclude(f => f!.Route)
                            .ThenInclude(r => r!.OriginAirport)
                .Include(t => t.FlightSeat)
                    .ThenInclude(fs => fs!.Flight)
                        .ThenInclude(f => f!.Route)
                            .ThenInclude(r => r!.DestinationAirport)
                .Include(t => t.FlightSeat)
                    .ThenInclude(fs => fs!.Flight)
                        .ThenInclude(f => f!.Aircraft)
                .Include(t => t.Passenger)
                .Include(t => t.Booking)
                    .ThenInclude(b => b!.User)
                .Include(t => t.Booking)
                    .ThenInclude(b => b!.Tickets)
                .Where(t =>
                    t.Booking != null &&
                    t.Booking.BookingCode == normalized &&
                    t.FlightSeat != null &&
                    t.FlightSeat.Flight != null &&
                    t.FlightSeat.Flight.Aircraft != null &&
                    t.FlightSeat.Flight.Aircraft.AirlineId == airlineId)
                .OrderBy(t => t.Id)
                .ToListAsync();

            if (tickets.Count == 0)
                throw new NotFoundException("BookingCode", normalized);

            await AutoMarkNoShowsAsync(tickets);

            var ticketIds = tickets.Select(t => t.Id).ToList();
            var baggageTags = await _context.BaggageTags
                .Include(bt => bt.BookingBaggage)
                .Where(bt => ticketIds.Contains(bt.TicketId))
                .ToListAsync();

            return tickets.Select(t => MapToDto(t, baggageTags)).ToList();
        }

        public async Task<PartnerTicketDto> UpdateTicketCheckInStatusAsync(int airlineId, int ticketId, UpdateTicketCheckInStatusRequest request)
        {
            if (!Enum.TryParse<CheckInStatus>(request.CheckInStatus, true, out var status))
                throw new BadRequestException("Trạng thái check-in không hợp lệ.");

            var ticket = await _context.Tickets
                .Include(t => t.FlightSeat)
                    .ThenInclude(fs => fs!.Flight)
                        .ThenInclude(f => f!.Route)
                            .ThenInclude(r => r!.OriginAirport)
                .Include(t => t.FlightSeat)
                    .ThenInclude(fs => fs!.Flight)
                        .ThenInclude(f => f!.Route)
                            .ThenInclude(r => r!.DestinationAirport)
                .Include(t => t.FlightSeat)
                    .ThenInclude(fs => fs!.Flight)
                        .ThenInclude(f => f!.Aircraft)
                .Include(t => t.Passenger)
                .Include(t => t.Booking)
                    .ThenInclude(b => b!.Tickets)
                .Include(t => t.Booking)
                    .ThenInclude(b => b!.User)
                .FirstOrDefaultAsync(t =>
                    t.Id == ticketId &&
                    t.FlightSeat != null &&
                    t.FlightSeat.Flight != null &&
                    t.FlightSeat.Flight.Aircraft != null &&
                    t.FlightSeat.Flight.Aircraft.AirlineId == airlineId)
                ?? throw new NotFoundException("Ticket", ticketId);

            if (!IsValidCheckInTransition(ticket.CheckInStatus, status))
                throw new BadRequestException("Không thể chuyển trạng thái check-in theo thứ tự này.");

            ValidateCheckInBusinessRules(ticket, status);

            ticket.CheckInStatus = status;
            if (status == CheckInStatus.CheckedIn && ticket.CheckInTime == null)
                ticket.CheckInTime = DateTime.UtcNow;
            if (status == CheckInStatus.NoShow)
                ticket.CheckInTime = null;

            if (ticket.Booking != null && ticket.Booking.Tickets.Any())
            {
                if (ticket.Booking.Tickets.All(t => t.CheckInStatus == CheckInStatus.Boarded || t.CheckInStatus == CheckInStatus.NoShow))
                    ticket.Booking.Status = BookingStatus.Completed;
                else if (ticket.Booking.Status == BookingStatus.Completed)
                    ticket.Booking.Status = BookingStatus.Confirmed;
            }

            await _context.SaveChangesAsync();
            var baggageTags = await _context.BaggageTags
                .Include(bt => bt.BookingBaggage)
                .Where(bt => bt.TicketId == ticket.Id)
                .ToListAsync();
            return MapToDto(ticket, baggageTags);
        }

        public async Task<PartnerBaggageTagDto> UpdateBaggageTagStatusAsync(int airlineId, int tagId, UpdateBaggageTagStatusRequest request)
        {
            if (!Enum.TryParse<BaggageTagStatus>(request.Status, true, out var status))
                throw new BadRequestException("Trạng thái hành lý không hợp lệ.");

            var tag = await _context.BaggageTags
                .Include(bt => bt.BookingBaggage)
                .Include(bt => bt.Flight)
                    .ThenInclude(f => f!.Aircraft)
                .FirstOrDefaultAsync(bt =>
                    bt.Id == tagId &&
                    bt.Flight != null &&
                    bt.Flight.Aircraft != null &&
                    bt.Flight.Aircraft.AirlineId == airlineId)
                ?? throw new NotFoundException("BaggageTag", tagId);

            if (!IsValidBaggageTransition(tag.Status, status))
                throw new BadRequestException("Không thể chuyển trạng thái hành lý theo thứ tự này.");

            tag.Status = status;
            var now = DateTime.UtcNow;
            if (status == BaggageTagStatus.CheckedIn) tag.CheckedInAt = now;
            if (status == BaggageTagStatus.Loaded) tag.LoadedAt = now;
            if (status == BaggageTagStatus.Arrived) tag.ArrivedAt = now;
            if (status == BaggageTagStatus.Claimed) tag.ClaimedAt = now;

            await _context.SaveChangesAsync();
            return MapBaggageTag(tag);
        }

        private static bool IsValidCheckInTransition(CheckInStatus current, CheckInStatus next)
        {
            if (current == next) return true;

            return current switch
            {
                CheckInStatus.NotCheckedIn => next == CheckInStatus.CheckedIn || next == CheckInStatus.NoShow,
                CheckInStatus.CheckedIn => next == CheckInStatus.Boarded || next == CheckInStatus.NoShow,
                CheckInStatus.Boarded => false,
                CheckInStatus.NoShow => false,
                _ => false
            };
        }

        private async Task AutoMarkNoShowsAsync(List<Ticket> tickets)
        {
            var now = DateTime.UtcNow;
            var changed = false;

            foreach (var ticket in tickets)
            {
                var departureTime = ticket.FlightSeat?.Flight?.DepartureTime;
                if (departureTime == null || departureTime > now) continue;
                if (ticket.CheckInStatus != CheckInStatus.NotCheckedIn && ticket.CheckInStatus != CheckInStatus.CheckedIn) continue;

                ticket.CheckInStatus = CheckInStatus.NoShow;
                ticket.CheckInTime = null;
                changed = true;
            }

            if (changed)
            {
                foreach (var booking in tickets.Select(t => t.Booking).Where(b => b != null).Distinct())
                {
                    if (booking!.Tickets.Any() &&
                        booking.Tickets.All(t => t.CheckInStatus == CheckInStatus.Boarded || t.CheckInStatus == CheckInStatus.NoShow))
                    {
                        booking.Status = BookingStatus.Completed;
                    }
                }

                await _context.SaveChangesAsync();
            }
        }

        private static void ValidateCheckInBusinessRules(Ticket ticket, CheckInStatus next)
        {
            var bookingStatus = ticket.Booking?.Status;
            if (next == CheckInStatus.CheckedIn || next == CheckInStatus.Boarded)
            {
                if (bookingStatus != BookingStatus.Confirmed)
                    throw new BadRequestException("Chỉ được check-in/boarding cho booking đã thanh toán và xác nhận.");
            }

            var departureTime = ticket.FlightSeat?.Flight?.DepartureTime
                ?? throw new BadRequestException("Không tìm thấy giờ khởi hành của vé.");
            var now = DateTime.UtcNow;

            if (next == CheckInStatus.CheckedIn)
            {
                var opensAt = departureTime.AddHours(-24);
                if (now < opensAt)
                    throw new BadRequestException("Check-in chỉ mở trong vòng 24 giờ trước giờ khởi hành.");
                if (now >= departureTime)
                    throw new BadRequestException("Đã quá giờ khởi hành, không thể check-in.");
            }

            if (next == CheckInStatus.Boarded)
            {
                var opensAt = departureTime.AddHours(-2);
                if (ticket.CheckInStatus != CheckInStatus.CheckedIn)
                    throw new BadRequestException("Hành khách phải check-in trước khi boarding.");
                if (now < opensAt)
                    throw new BadRequestException("Boarding chỉ mở trong vòng 2 giờ trước giờ khởi hành.");
                if (now >= departureTime)
                    throw new BadRequestException("Đã quá giờ khởi hành, không thể boarding.");
            }

            if (next == CheckInStatus.NoShow && now < departureTime)
                throw new BadRequestException("Chỉ được đánh dấu no-show sau giờ khởi hành.");
        }

        private static bool IsValidBaggageTransition(BaggageTagStatus current, BaggageTagStatus next)
        {
            if (current == next) return true;
            if (current == BaggageTagStatus.Claimed || current == BaggageTagStatus.Lost) return false;
            if (next == BaggageTagStatus.Lost) return true;

            return current switch
            {
                BaggageTagStatus.Registered => next == BaggageTagStatus.CheckedIn,
                BaggageTagStatus.CheckedIn => next == BaggageTagStatus.Loaded,
                BaggageTagStatus.Loaded => next == BaggageTagStatus.Arrived,
                BaggageTagStatus.Arrived => next == BaggageTagStatus.Claimed,
                _ => false
            };
        }

        private static PartnerTicketDto MapToDto(Ticket t, List<FlightBooking.Domain.Entities.Baggage.BaggageTag>? baggageTags = null) => new()
        {
            TicketId = t.Id,
            BookingId = t.BookingId,
            BookingCode = t.Booking?.BookingCode ?? "",
            BookingStatus = t.Booking?.Status.ToString() ?? "",
            BookingDate = t.Booking?.BookingDate ?? default,
            BookingTotalAmount = t.Booking?.TotalAmount ?? 0,

            BookerName = t.Booking?.User?.FullName ?? "",
            BookerEmail = t.Booking?.User?.Email ?? "",
            BookerPhoneNumber = t.Booking?.User?.PhoneNumber,

            FlightId = t.FlightSeat!.FlightId,
            FlightNumber = t.FlightSeat.Flight?.FlightNumber ?? "",
            OriginCode = t.FlightSeat.Flight?.Route?.OriginAirport?.Code ?? "",
            DestinationCode = t.FlightSeat.Flight?.Route?.DestinationAirport?.Code ?? "",
            DepartureTime = t.FlightSeat.Flight?.DepartureTime ?? default,
            ArrivalTime = t.FlightSeat.Flight?.ArrivalTime ?? default,

            SeatNumber = t.FlightSeat.SeatNumber,
            SeatClass = t.FlightSeat.ClassType.ToString(),
            SeatPrice = t.FlightSeat.Price,

            PassengerName = t.Passenger?.FullName ?? "",
            PassengerPassport = t.Passenger?.PassportNumber ?? "",
            PassengerNationality = t.Passenger?.Nationality ?? "",
            PassengerDateOfBirth = t.Passenger?.DateOfBirth,
            PassengerGender = t.Passenger?.Gender.ToString() ?? "",

            CheckInStatus = t.CheckInStatus.ToString(),
            BaggageTags = baggageTags?
                .Where(bt => bt.TicketId == t.Id)
                .Select(MapBaggageTag)
                .ToList() ?? new()
        };

        private static PartnerBaggageTagDto MapBaggageTag(FlightBooking.Domain.Entities.Baggage.BaggageTag tag) => new()
        {
            Id = tag.Id,
            TagCode = tag.TagCode,
            Weight = tag.BookingBaggage?.Weight ?? 0,
            ExtraFee = tag.BookingBaggage?.ExtraFee ?? 0,
            Status = tag.Status.ToString(),
            CreatedAt = tag.CreatedAt,
            CheckedInAt = tag.CheckedInAt,
            LoadedAt = tag.LoadedAt,
            ArrivedAt = tag.ArrivedAt,
            ClaimedAt = tag.ClaimedAt
        };
    }
}
