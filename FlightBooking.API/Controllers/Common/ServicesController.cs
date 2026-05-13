using FlightBooking.API.Controllers.Common;
using FlightBooking.Application.Features.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;

namespace FlightBooking.API.Controllers.Common
{
    [ApiController]
    [Route("api/[controller]")]
    public class ServicesController : BaseController
    {
        private readonly IServicesService _servicesService;

        public ServicesController(IServicesService servicesService)
        {
            _servicesService = servicesService;
        }

        [HttpGet("additional-services")]
        public async Task<IActionResult> GetAdditionalServices()
        {
            var services = await _servicesService.GetAdditionalServicesAsync();
            return OkResponse(services, "Lấy danh sách dịch vụ bổ sung thành công.");
        }

        [HttpGet("baggage-allowances")]
        public async Task<IActionResult> GetBaggageAllowances()
        {
            var allowances = await _servicesService.GetBaggageAllowancesAsync();
            return OkResponse(allowances, "Lấy danh sách hành lý thành công.");
        }
    }
}
