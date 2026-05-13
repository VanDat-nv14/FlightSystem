using FlightBooking.Domain.Common;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FlightBooking.Domain.Entities.Services
{
    public class AdditionalService : BaseEntity
    {
        public required string ServiceName { get; set; }
        public string? Description { get; set; }
        public decimal Price { get; set; }
        public required string ServiceType { get; set; } // Meal, Insurance, FastTrack, etc.
    }
}
