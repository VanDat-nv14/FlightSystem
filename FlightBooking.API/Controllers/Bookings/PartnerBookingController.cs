using FlightBooking.API.Controllers.Common;
using FlightBooking.Application.Features.Flights.DTOs;
using FlightBooking.Application.Features.Flights.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FlightBooking.API.Controllers.Bookings
{
    [Route("api/partner/bookings")]
    [ApiController]
    [Authorize(Roles = "Admin,AirlineManager")]
    public class PartnerBookingController : BaseController
    {
        private readonly IPartnerBookingService _partnerBookingService;

        public PartnerBookingController(IPartnerBookingService partnerBookingService)
        {
            _partnerBookingService = partnerBookingService;
        }

        [HttpGet]
        public async Task<IActionResult> GetMyTickets()
        {
            var claim = User.FindFirst("airlineId");
            if (claim == null || !int.TryParse(claim.Value, out int airlineId))
                return BadRequest("Không tìm thấy thông tin hãng bay trong token.");

            var tickets = await _partnerBookingService.GetTicketsByAirlineAsync(airlineId);
            return OkResponse(tickets, $"Lấy danh sách vé của hãng thành công. Tổng: {tickets.Count} vé.");
        }

        [HttpGet("lookup/{bookingCode}")]
        public async Task<IActionResult> LookupByBookingCode(string bookingCode)
        {
            var claim = User.FindFirst("airlineId");
            if (claim == null || !int.TryParse(claim.Value, out int airlineId))
                return BadRequest("Không tìm thấy thông tin hãng bay trong token.");

            var tickets = await _partnerBookingService.GetTicketsByBookingCodeAsync(airlineId, bookingCode);
            return OkResponse(tickets, "Tìm booking thành công.");
        }

        [HttpPatch("tickets/{ticketId:int}/check-in-status")]
        public async Task<IActionResult> UpdateTicketCheckInStatus(int ticketId, [FromBody] UpdateTicketCheckInStatusRequest request)
        {
            var claim = User.FindFirst("airlineId");
            if (claim == null || !int.TryParse(claim.Value, out int airlineId))
                return BadRequest("Không tìm thấy thông tin hãng bay trong token.");

            var ticket = await _partnerBookingService.UpdateTicketCheckInStatusAsync(airlineId, ticketId, request);
            return OkResponse(ticket, "Cập nhật trạng thái check-in thành công.");
        }
        [HttpPatch("baggage-tags/{tagId:int}/status")]
        public async Task<IActionResult> UpdateBaggageTagStatus(int tagId, [FromBody] UpdateBaggageTagStatusRequest request)
        {
            var claim = User.FindFirst("airlineId");
            if (claim == null || !int.TryParse(claim.Value, out int airlineId))
                return BadRequest("Không tìm thấy thông tin hãng bay trong token.");

            var tag = await _partnerBookingService.UpdateBaggageTagStatusAsync(airlineId, tagId, request);
            return OkResponse(tag, "Cập nhật trạng thái hành lý thành công.");
        }
    }
}
