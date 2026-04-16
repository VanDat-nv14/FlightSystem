using FlightBooking.API.Common;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace FlightBooking.API.Controllers.Common
{
    [ApiController]
    [Route("api/[controller]")]
    public abstract class BaseController : ControllerBase
    {
        // Helper để trả về kết quả thành công nhanh
        protected IActionResult OkResponse<T>(T data, string message = "Success")
        {
            return Ok(ApiResponse<T>.SuccessResponse(data, message));
        }
        // Helper để trả về lỗi nhanh
        protected IActionResult ErrorResponse(string message, int statusCode = 400)
        {
            return StatusCode(statusCode, ApiResponse<object>.FailureResponse(message));
        }
    }
}
