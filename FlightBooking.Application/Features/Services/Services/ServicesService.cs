using FlightBooking.Application.Common.Interfaces;
using FlightBooking.Application.Features.Services.DTOs;
using FlightBooking.Application.Features.Services.Interfaces;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace FlightBooking.Application.Features.Services.Services
{
    public class ServicesService : IServicesService
    {
        private readonly IApplicationDbContext _context;

        public ServicesService(IApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<List<AdditionalServiceDto>> GetAdditionalServicesAsync()
        {
            var services = await _context.AdditionalServices.ToListAsync();
            return services.Select(s => new AdditionalServiceDto
            {
                Id = s.Id,
                ServiceName = s.ServiceName,
                Description = s.Description,
                Price = s.Price,
                ServiceType = s.ServiceType
            }).ToList();
        }

        public async Task<List<BaggageAllowanceDto>> GetBaggageAllowancesAsync()
        {
            var allowances = await _context.BaggageAllowances.ToListAsync();
            return allowances.Select(a => new BaggageAllowanceDto
            {
                Id = a.Id,
                ClassType = a.ClassType,
                MaxWeight = a.MaxWeight,
                MaxPieces = a.MaxPieces,
                AdditionalFee = a.AdditionalFee
            }).OrderBy(a => a.MaxWeight).ToList();
        }
    }
}
