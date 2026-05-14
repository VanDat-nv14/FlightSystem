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

        [HttpPatch("tickets/{ticketId:int}/check-in-status")]
        public async Task<IActionResult> UpdateTicketCheckInStatus(int ticketId, [FromBody] UpdateTicketCheckInStatusRequest request)
        {
            var claim = User.FindFirst("airlineId");
            if (claim == null || !int.TryParse(claim.Value, out int airlineId))
                return BadRequest("Không tìm thấy thông tin hãng bay trong token.");

            var ticket = await _partnerBookingService.UpdateTicketCheckInStatusAsync(airlineId, ticketId, request);
            return OkResponse(ticket, "Cập nhật trạng thái check-in thành công.");
        }
    }
}
