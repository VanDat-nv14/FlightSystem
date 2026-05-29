using FlightBooking.API.Controllers.Common;
using FlightBooking.Application.Features.Promotions.DTOs;
using FlightBooking.Application.Features.Promotions.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace FlightBooking.API.Controllers.Promotions
{
    [ApiController]
    [Route("api/[controller]")]
    public class PromotionController : BaseController
    {
        private readonly IPromotionService _promotionService;

        public PromotionController(IPromotionService promotionService)
        {
            _promotionService = promotionService;
        }

        // ── Public: Xem ưu đãi đang hoạt động ─────────────────────────────────
        [HttpGet("active")]
        [AllowAnonymous]
        public async Task<IActionResult> GetActive()
            => OkResponse(await _promotionService.GetActiveAsync(), "Lấy danh sách ưu đãi thành công.");

        // ── AirlineManager: Quản lý ưu đãi của hãng ──────────────────────────
        [HttpGet("my")]
        [Authorize(Roles = "AirlineManager")]
        public async Task<IActionResult> GetMine()
        {
            var airlineId = GetAirlineId();
            if (airlineId == null) return ErrorResponse("Không xác định được hãng bay.", 400);
            return OkResponse(await _promotionService.GetByAirlineAsync(airlineId.Value), "Lấy danh sách ưu đãi thành công.");
        }

        [HttpPost]
        [Authorize(Roles = "AirlineManager")]
        public async Task<IActionResult> Create([FromBody] CreatePromotionRequest request)
        {
            var airlineId = GetAirlineId();
            if (airlineId == null) return ErrorResponse("Không xác định được hãng bay.", 400);
            try
            {
                var result = await _promotionService.CreateAsync(airlineId.Value, request);
                return OkResponse(result, "Tạo khuyến mãi thành công.");
            }
            catch (Exception ex)
            {
                return ErrorResponse(ex.Message, 400);
            }
        }

        [HttpPut("{id:int}")]
        [Authorize(Roles = "AirlineManager")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdatePromotionRequest request)
        {
            var airlineId = GetAirlineId();
            if (airlineId == null) return ErrorResponse("Không xác định được hãng bay.", 400);
            try
            {
                var result = await _promotionService.UpdateAsync(id, airlineId.Value, request);
                return OkResponse(result, "Cập nhật khuyến mãi thành công.");
            }
            catch (Exception ex)
            {
                return ErrorResponse(ex.Message, 400);
            }
        }

        [HttpDelete("{id:int}")]
        [Authorize(Roles = "AirlineManager")]
        public async Task<IActionResult> Delete(int id)
        {
            var airlineId = GetAirlineId();
            if (airlineId == null) return ErrorResponse("Không xác định được hãng bay.", 400);
            try
            {
                await _promotionService.DeleteAsync(id, airlineId.Value);
                return OkResponse(true, "Xóa khuyến mãi thành công.");
            }
            catch (Exception ex)
            {
                return ErrorResponse(ex.Message, 400);
            }
        }

        private int? GetAirlineId()
        {
            var claim = User.FindFirst("airlineId");
            if (claim != null && int.TryParse(claim.Value, out var id)) return id;
            return null;
        }
    }
}
