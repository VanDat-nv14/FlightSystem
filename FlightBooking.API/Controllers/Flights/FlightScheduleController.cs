using FlightBooking.Application.Features.Flights.DTOs;
using FlightBooking.Application.Features.Flights.Interfaces;
using FlightBooking.API.Controllers.Common;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Security.Claims;
using System.Threading.Tasks;

namespace FlightBooking.API.Controllers.Flights
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin,AirlineManager")]
    public class FlightScheduleController : BaseController
    {
        private readonly IFlightScheduleService _scheduleService;

        public FlightScheduleController(IFlightScheduleService scheduleService)
        {
            _scheduleService = scheduleService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            try
            {
                if (User.IsInRole("AirlineManager"))
                {
                    var claim = User.FindFirst("airlineId");
                    if (claim != null)
                    {
                        var airlineId = int.Parse(claim.Value);
                        return OkResponse(await _scheduleService.GetByAirlineAsync(airlineId), "Lấy danh sách lịch bay của hãng thành công.");
                    }
                }
                return OkResponse(await _scheduleService.GetAllAsync(), "Lấy danh sách tất cả lịch bay thành công.");
            }
            catch (Exception ex)
            {
                return ErrorResponse(ex.Message, 400);
            }
        }

        [HttpGet("by-airline/{airlineId}")]
        public async Task<IActionResult> GetByAirline(int airlineId)
        {
            try
            {
                if (User.IsInRole("AirlineManager"))
                {
                    var claim = User.FindFirst("airlineId");
                    if (claim != null && int.Parse(claim.Value) != airlineId)
                    {
                        return ErrorResponse("Bạn không có quyền xem lịch bay của hãng khác.", 403);
                    }
                }
                return OkResponse(await _scheduleService.GetByAirlineAsync(airlineId), "Lấy danh sách lịch bay theo hãng thành công.");
            }
            catch (Exception ex)
            {
                return ErrorResponse(ex.Message, 400);
            }
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateFlightScheduleRequest request)
        {
            try
            {
                int? airlineId = null;
                if (User.IsInRole("AirlineManager"))
                {
                    var claim = User.FindFirst("airlineId");
                    if (claim != null) airlineId = int.Parse(claim.Value);
                }
                var result = await _scheduleService.CreateAsync(request, airlineId);
                return OkResponse(result, "Tạo lịch bay định kỳ thành công.");
            }
            catch (Exception ex)
            {
                return ErrorResponse(ex.Message, 400);
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateFlightScheduleRequest request)
        {
            try
            {
                if (User.IsInRole("AirlineManager"))
                {
                    var claim = User.FindFirst("airlineId");
                    if (claim != null)
                    {
                        var airlineId = int.Parse(claim.Value);
                        // Check if schedule belongs to their airline before updating
                        var schedules = await _scheduleService.GetByAirlineAsync(airlineId);
                        if (!schedules.Exists(s => s.Id == id))
                        {
                            return ErrorResponse("Bạn không có quyền cập nhật lịch bay của hãng khác.", 403);
                        }
                    }
                }
                var result = await _scheduleService.UpdateAsync(id, request);
                return OkResponse(result, "Cập nhật lịch bay thành công.");
            }
            catch (Exception ex)
            {
                return ErrorResponse(ex.Message, 400);
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            try
            {
                if (User.IsInRole("AirlineManager"))
                {
                    var claim = User.FindFirst("airlineId");
                    if (claim != null)
                    {
                        var airlineId = int.Parse(claim.Value);
                        // Check if schedule belongs to their airline before deleting
                        var schedules = await _scheduleService.GetByAirlineAsync(airlineId);
                        if (!schedules.Exists(s => s.Id == id))
                        {
                            return ErrorResponse("Bạn không có quyền xóa lịch bay của hãng khác.", 403);
                        }
                    }
                }
                var result = await _scheduleService.DeleteAsync(id);
                return OkResponse(result, "Xóa lịch bay thành công.");
            }
            catch (Exception ex)
            {
                return ErrorResponse(ex.Message, 400);
            }
        }

        [HttpPost("generate-today")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GenerateToday()
        {
            try
            {
                var result = await _scheduleService.GenerateFlightsForDateAsync(DateTime.Today);
                return OkResponse(result, $"Đã tạo thành công {result} chuyến bay cho ngày hôm nay.");
            }
            catch (Exception ex)
            {
                return ErrorResponse(ex.Message, 400);
            }
        }

        [HttpPost("generate-next-30")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GenerateNext30()
        {
            try
            {
                var result = await _scheduleService.EnsureNext30DaysAsync();
                return OkResponse(result, $"Đã đồng bộ thành công {result} chuyến bay cho 30 ngày tiếp theo.");
            }
            catch (Exception ex)
            {
                return ErrorResponse(ex.Message, 400);
            }
        }
    }
}
