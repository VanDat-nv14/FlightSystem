using FlightBooking.Domain.Entities.Flights;
using FlightBooking.Domain.Entities.Users;
using FlightBooking.Infrastructure.Persistence;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace FlightBooking.Infrastructure.Persistence.Seed;

public static class DatabaseSeeder
{
    public static async Task SeedDevelopmentAsync(IServiceProvider serviceProvider, IConfiguration configuration)
    {
        // When adding new seed rows later, prefer checking a stable key
        // such as Code, RegistrationNumber, or Email so existing databases can receive new rows.
        using (var scope = serviceProvider.CreateScope())
        {
        var services = scope.ServiceProvider;
        var dbContext = services.GetRequiredService<FlightBookingDbContext>();
        var roleManager = services.GetRequiredService<RoleManager<ApplicationRole>>();
        var userManager = services.GetRequiredService<UserManager<ApplicationUser>>();

        // 1. Chạy Migration
        await dbContext.Database.MigrateAsync();

        // 2. Tạo các Role mặc định nếu chưa tồn tại
        string[] roles = { "Admin", "Employee", "Customer", "AirlineManager", "AirportStaff" };
        foreach (var roleName in roles)
        {
            if (!await roleManager.RoleExistsAsync(roleName))
            {
                await roleManager.CreateAsync(new ApplicationRole { Name = roleName });
            }
        }

        // 3. Tạo tài khoản Admin mặc định nếu có trong cấu hình
        var adminEmail = configuration["SeedData:AdminEmail"];
        var adminPassword = configuration["SeedData:AdminPassword"];

        if (!string.IsNullOrEmpty(adminEmail) && !string.IsNullOrEmpty(adminPassword))
        {
            var adminUser = await userManager.FindByEmailAsync(adminEmail);
            if (adminUser == null)
            {
                adminUser = new ApplicationUser
                {
                    UserName = adminEmail,
                    Email = adminEmail,
                    FullName = "System Administrator",
                    Role = FlightBooking.Domain.Enums.UserRole.Admin,
                    EmailConfirmed = true
                };
                var createResult = await userManager.CreateAsync(adminUser, adminPassword);
                if (createResult.Succeeded)
                {
                    await userManager.AddToRoleAsync(adminUser, "Admin");
                }
            }
        }

        // 4. Seed dữ liệu BaggageAllowances nếu trống
        if (!await dbContext.BaggageAllowances.AnyAsync())
        {
            dbContext.BaggageAllowances.AddRange(
                new FlightBooking.Domain.Entities.Baggage.BaggageAllowance { ClassType = FlightBooking.Domain.Enums.SeatClassType.Economy, MaxWeight = 15, MaxPieces = 1, AdditionalFee = 150000 },
                new FlightBooking.Domain.Entities.Baggage.BaggageAllowance { ClassType = FlightBooking.Domain.Enums.SeatClassType.Economy, MaxWeight = 20, MaxPieces = 1, AdditionalFee = 200000 },
                new FlightBooking.Domain.Entities.Baggage.BaggageAllowance { ClassType = FlightBooking.Domain.Enums.SeatClassType.Economy, MaxWeight = 25, MaxPieces = 2, AdditionalFee = 300000 },
                new FlightBooking.Domain.Entities.Baggage.BaggageAllowance { ClassType = FlightBooking.Domain.Enums.SeatClassType.Economy, MaxWeight = 30, MaxPieces = 2, AdditionalFee = 450000 }
            );
            await dbContext.SaveChangesAsync();
        }

        // 5. Seed dữ liệu AdditionalServices nếu trống
        if (!await dbContext.AdditionalServices.AnyAsync())
        {
            dbContext.AdditionalServices.AddRange(
                new FlightBooking.Domain.Entities.Services.AdditionalService { ServiceName = "Suất ăn đặc biệt", Description = "Phục vụ ăn uống trên máy bay", Price = 50000, ServiceType = "meal" },
                new FlightBooking.Domain.Entities.Services.AdditionalService { ServiceName = "Bảo hiểm du lịch", Description = "Bảo hiểm hành trình", Price = 120000, ServiceType = "insurance" },
                new FlightBooking.Domain.Entities.Services.AdditionalService { ServiceName = "Dịch vụ Fast Track", Description = "Làm thủ tục nhanh", Price = 250000, ServiceType = "fasttrack" }
            );
            await dbContext.SaveChangesAsync();
        }

        // 6. Seed Airports
        if (!await dbContext.Airports.AnyAsync())
        {
            dbContext.Airports.AddRange(
                new FlightBooking.Domain.Entities.Flights.Airport { Code = "SGN", Name = "Sân bay Quốc tế Tân Sơn Nhất", City = "TP. Hồ Chí Minh", Country = "Vietnam" },
                new FlightBooking.Domain.Entities.Flights.Airport { Code = "HAN", Name = "Sân bay Quốc tế Nội Bài", City = "Hà Nội", Country = "Vietnam" },
                new FlightBooking.Domain.Entities.Flights.Airport { Code = "DAD", Name = "Sân bay Quốc tế Đà Nẵng", City = "Đà Nẵng", Country = "Vietnam" },
                new FlightBooking.Domain.Entities.Flights.Airport { Code = "CXR", Name = "Sân bay Quốc tế Cam Ranh", City = "Nha Trang", Country = "Vietnam" },
                new FlightBooking.Domain.Entities.Flights.Airport { Code = "VCA", Name = "Sân bay Quốc tế Cần Thơ", City = "Cần Thơ", Country = "Vietnam" },
                new FlightBooking.Domain.Entities.Flights.Airport { Code = "HPH", Name = "Sân bay Cát Bi", City = "Hải Phòng", Country = "Vietnam" },
                new FlightBooking.Domain.Entities.Flights.Airport { Code = "HUI", Name = "Sân bay Phú Bài", City = "Huế", Country = "Vietnam" },
                new FlightBooking.Domain.Entities.Flights.Airport { Code = "VDH", Name = "Sân bay Đồng Hới", City = "Quảng Bình", Country = "Vietnam" },
                new FlightBooking.Domain.Entities.Flights.Airport { Code = "UIH", Name = "Sân bay Phù Cát", City = "Quy Nhơn", Country = "Vietnam" },
                new FlightBooking.Domain.Entities.Flights.Airport { Code = "PQC", Name = "Sân bay Quốc tế Phú Quốc", City = "Phú Quốc", Country = "Vietnam" },
                new FlightBooking.Domain.Entities.Flights.Airport { Code = "DIN", Name = "Sân bay Điện Biên Phủ", City = "Điện Biên", Country = "Vietnam" },
                new FlightBooking.Domain.Entities.Flights.Airport { Code = "VCS", Name = "Sân bay Côn Đảo", City = "Côn Đảo", Country = "Vietnam" }
            );
            await dbContext.SaveChangesAsync();
        }

        var airportSeedList = new[]
        {
            (Code: "SIN", Name: "Singapore Changi Airport", City: "Singapore", Country: "Singapore", IsFeatured: true, Image: "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?auto=format&fit=crop&w=900&q=85", Description: "City break hien dai, mua sam va am thuc", Order: 4),
            (Code: "HAN", Name: "San bay Quoc te Noi Bai", City: "Ha Noi", Country: "Vietnam", IsFeatured: true, Image: "https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=900&q=85", Description: "Pho co, ho Hoan Kiem va nhip song thu do", Order: 1),
            (Code: "DAD", Name: "San bay Quoc te Da Nang", City: "Da Nang", Country: "Vietnam", IsFeatured: true, Image: "https://images.unsplash.com/photo-1564596823821-79b97151055e?auto=format&fit=crop&w=900&q=85", Description: "Bien xanh, cau Rong va nhung resort ven bien", Order: 2),
            (Code: "PQC", Name: "San bay Quoc te Phu Quoc", City: "Phu Quoc", Country: "Vietnam", IsFeatured: true, Image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=85", Description: "Bai bien nhiet doi va ky nghi cuoi tuan", Order: 3),
        };
        foreach (var airportSeed in airportSeedList)
        {
            var airport = await dbContext.Airports.FirstOrDefaultAsync(a => a.Code == airportSeed.Code);
            if (airport == null)
            {
                dbContext.Airports.Add(new FlightBooking.Domain.Entities.Flights.Airport
                {
                    Code = airportSeed.Code,
                    Name = airportSeed.Name,
                    City = airportSeed.City,
                    Country = airportSeed.Country,
                    IsFeatured = airportSeed.IsFeatured,
                    FeaturedImageUrl = airportSeed.Image,
                    FeaturedDescription = airportSeed.Description,
                    FeaturedDisplayOrder = airportSeed.Order
                });
            }
            else if (airportSeed.IsFeatured && !airport.IsFeatured)
            {
                airport.IsFeatured = true;
                airport.FeaturedImageUrl = airportSeed.Image;
                airport.FeaturedDescription = airportSeed.Description;
                airport.FeaturedDisplayOrder = airportSeed.Order;
            }
        }
        await dbContext.SaveChangesAsync();

        // 7. Seed Airlines — kiểm tra từng hãng theo Code để có thể thêm mới ngay cả khi bảng đã có dữ liệu
        var airlineSeedList = new[]
        {
            (Code: "VN", Name: "Vietnam Airlines",    Country: "Vietnam"),
            (Code: "VJ", Name: "VietJet Air",         Country: "Vietnam"),
            (Code: "BL", Name: "Bamboo Airways",      Country: "Vietnam"),
            (Code: "QH", Name: "Vietravel Airlines",  Country: "Vietnam"),
            (Code: "BN", Name: "Pacific Airlines",    Country: "Vietnam"),
            (Code: "0V", Name: "VASCO",               Country: "Vietnam"),
            (Code: "SQ", Name: "Singapore Airlines",  Country: "Singapore"),
        };
        foreach (var a in airlineSeedList)
        {
            if (!await dbContext.Airlines.AnyAsync(x => x.Code == a.Code))
            {
                dbContext.Airlines.Add(new FlightBooking.Domain.Entities.Flights.Airline
                {
                    Code = a.Code, Name = a.Name, Country = a.Country,
                    IsActive = true, Status = FlightBooking.Domain.Enums.AirlineStatus.Approved
                });
            }
        }
        await dbContext.SaveChangesAsync();

        // 8. Seed Aircrafts (phụ thuộc Airline) — lookup Id theo Code
        if (!await dbContext.Aircrafts.AnyAsync())
        {
            var dbAirlines = await dbContext.Airlines.ToListAsync();
            int idVN = dbAirlines.First(a => a.Code == "VN").Id;
            int idVJ = dbAirlines.First(a => a.Code == "VJ").Id;
            int idBL = dbAirlines.First(a => a.Code == "BL").Id;
            int idQH = dbAirlines.First(a => a.Code == "QH").Id;

            dbContext.Aircrafts.AddRange(
                new FlightBooking.Domain.Entities.Flights.Aircraft { Model = "Airbus A321",   TotalSeats = 180, AirlineId = idVN, IsActive = true, RegistrationNumber = "VN-A321-01" },
                new FlightBooking.Domain.Entities.Flights.Aircraft { Model = "Airbus A321",   TotalSeats = 180, AirlineId = idVN, IsActive = true, RegistrationNumber = "VN-A321-02" },
                new FlightBooking.Domain.Entities.Flights.Aircraft { Model = "Boeing 787-9",  TotalSeats = 294, AirlineId = idVN, IsActive = true, RegistrationNumber = "VN-B789-01" },
                new FlightBooking.Domain.Entities.Flights.Aircraft { Model = "Boeing 787-9",  TotalSeats = 294, AirlineId = idVN, IsActive = true, RegistrationNumber = "VN-B789-02" },
                new FlightBooking.Domain.Entities.Flights.Aircraft { Model = "Airbus A320",   TotalSeats = 180, AirlineId = idVJ, IsActive = true, RegistrationNumber = "VJ-A320-01" },
                new FlightBooking.Domain.Entities.Flights.Aircraft { Model = "Airbus A320",   TotalSeats = 180, AirlineId = idVJ, IsActive = true, RegistrationNumber = "VJ-A320-02" },
                new FlightBooking.Domain.Entities.Flights.Aircraft { Model = "Airbus A321",   TotalSeats = 220, AirlineId = idVJ, IsActive = true, RegistrationNumber = "VJ-A321-01" },
                new FlightBooking.Domain.Entities.Flights.Aircraft { Model = "Embraer E190",  TotalSeats = 100, AirlineId = idBL, IsActive = true, RegistrationNumber = "BL-E190-01" },
                new FlightBooking.Domain.Entities.Flights.Aircraft { Model = "Airbus A319",   TotalSeats = 144, AirlineId = idBL, IsActive = true, RegistrationNumber = "BL-A319-01" },
                new FlightBooking.Domain.Entities.Flights.Aircraft { Model = "Boeing 787-9",  TotalSeats = 280, AirlineId = idBL, IsActive = true, RegistrationNumber = "BL-B789-01" },
                new FlightBooking.Domain.Entities.Flights.Aircraft { Model = "Airbus A320",   TotalSeats = 180, AirlineId = idQH, IsActive = true, RegistrationNumber = "QH-A320-01" },
                new FlightBooking.Domain.Entities.Flights.Aircraft { Model = "Airbus A321",   TotalSeats = 220, AirlineId = idQH, IsActive = true, RegistrationNumber = "QH-A321-01" }
            );
            await dbContext.SaveChangesAsync();


            // Thêm SeatConfiguration cho tất cả máy bay
            var allAircrafts = await dbContext.Aircrafts.ToListAsync();
            var seatConfigs = new List<FlightBooking.Domain.Entities.Seats.SeatConfiguration>();
            foreach (var ac in allAircrafts)
            {
                int businessRows = ac.TotalSeats >= 200 ? 4 : 2;
                int totalRows = ac.TotalSeats / 6 + (ac.TotalSeats >= 200 ? 0 : 2);
                for (int row = 1; row <= businessRows; row++)
                {
                    foreach (var col in new[] { "A", "C", "D", "F" })
                    {
                        var pos = (col == "A" || col == "F") ? FlightBooking.Domain.Enums.SeatPosition.Window : FlightBooking.Domain.Enums.SeatPosition.Aisle;
                        seatConfigs.Add(new FlightBooking.Domain.Entities.Seats.SeatConfiguration { AircraftId = ac.Id, SeatNumber = $"{row}{col}", ClassType = FlightBooking.Domain.Enums.SeatClassType.Business, PriceMultiplier = 2.5m, Position = pos });
                    }
                }
                for (int row = businessRows + 1; row <= totalRows; row++)
                {
                    foreach (var col in new[] { "A", "B", "C", "D", "E", "F" })
                    {
                        var pos = (col == "A" || col == "F") ? FlightBooking.Domain.Enums.SeatPosition.Window
                                : (col == "C" || col == "D") ? FlightBooking.Domain.Enums.SeatPosition.Aisle
                                : FlightBooking.Domain.Enums.SeatPosition.Middle;
                        seatConfigs.Add(new FlightBooking.Domain.Entities.Seats.SeatConfiguration { AircraftId = ac.Id, SeatNumber = $"{row}{col}", ClassType = FlightBooking.Domain.Enums.SeatClassType.Economy, PriceMultiplier = 1.0m, Position = pos });
                    }
                }
            }
            dbContext.SeatConfigurations.AddRange(seatConfigs);
            await dbContext.SaveChangesAsync();
        }

        // 9. Seed Routes (phụ thuộc Airport đã được tạo)
        if (!await dbContext.Routes.AnyAsync())
        {
            // Lấy airport ids
            var airports = await dbContext.Airports.ToListAsync();
            int sgn = airports.First(a => a.Code == "SGN").Id;
            int han = airports.First(a => a.Code == "HAN").Id;
            int dad = airports.First(a => a.Code == "DAD").Id;
            int cxr = airports.First(a => a.Code == "CXR").Id;
            int vca = airports.First(a => a.Code == "VCA").Id;
            int pqc = airports.First(a => a.Code == "PQC").Id;
            int hph = airports.First(a => a.Code == "HPH").Id;
            int hui = airports.First(a => a.Code == "HUI").Id;

            dbContext.Routes.AddRange(
                new FlightBooking.Domain.Entities.Flights.Route { OriginAirportId = sgn, DestinationAirportId = han, DistanceKm = "1137", EstimatedDurationMinutes = 125, IsActive = true, Duration = TimeSpan.FromMinutes(125) },
                new FlightBooking.Domain.Entities.Flights.Route { OriginAirportId = han, DestinationAirportId = sgn, DistanceKm = "1137", EstimatedDurationMinutes = 125, IsActive = true, Duration = TimeSpan.FromMinutes(125) },
                new FlightBooking.Domain.Entities.Flights.Route { OriginAirportId = sgn, DestinationAirportId = dad, DistanceKm = "748", EstimatedDurationMinutes = 80, IsActive = true, Duration = TimeSpan.FromMinutes(80) },
                new FlightBooking.Domain.Entities.Flights.Route { OriginAirportId = dad, DestinationAirportId = sgn, DistanceKm = "748", EstimatedDurationMinutes = 80, IsActive = true, Duration = TimeSpan.FromMinutes(80) },
                new FlightBooking.Domain.Entities.Flights.Route { OriginAirportId = han, DestinationAirportId = dad, DistanceKm = "606", EstimatedDurationMinutes = 70, IsActive = true, Duration = TimeSpan.FromMinutes(70) },
                new FlightBooking.Domain.Entities.Flights.Route { OriginAirportId = dad, DestinationAirportId = han, DistanceKm = "606", EstimatedDurationMinutes = 70, IsActive = true, Duration = TimeSpan.FromMinutes(70) },
                new FlightBooking.Domain.Entities.Flights.Route { OriginAirportId = sgn, DestinationAirportId = cxr, DistanceKm = "316", EstimatedDurationMinutes = 55, IsActive = true, Duration = TimeSpan.FromMinutes(55) },
                new FlightBooking.Domain.Entities.Flights.Route { OriginAirportId = sgn, DestinationAirportId = pqc, DistanceKm = "286", EstimatedDurationMinutes = 50, IsActive = true, Duration = TimeSpan.FromMinutes(50) },
                new FlightBooking.Domain.Entities.Flights.Route { OriginAirportId = sgn, DestinationAirportId = vca, DistanceKm = "165", EstimatedDurationMinutes = 40, IsActive = true, Duration = TimeSpan.FromMinutes(40) },
                new FlightBooking.Domain.Entities.Flights.Route { OriginAirportId = han, DestinationAirportId = hph, DistanceKm = "105", EstimatedDurationMinutes = 35, IsActive = true, Duration = TimeSpan.FromMinutes(35) },
                new FlightBooking.Domain.Entities.Flights.Route { OriginAirportId = han, DestinationAirportId = hui, DistanceKm = "580", EstimatedDurationMinutes = 65, IsActive = true, Duration = TimeSpan.FromMinutes(65) },
                new FlightBooking.Domain.Entities.Flights.Route { OriginAirportId = dad, DestinationAirportId = cxr, DistanceKm = "440", EstimatedDurationMinutes = 60, IsActive = true, Duration = TimeSpan.FromMinutes(60) }
            );
            await dbContext.SaveChangesAsync();
        }

        var airportLookup = await dbContext.Airports.ToDictionaryAsync(a => a.Code, a => a.Id);
        var routeSeedList = new[]
        {
            (Origin: "CXR", Destination: "SGN", Distance: "316", Minutes: 55),
            (Origin: "PQC", Destination: "SGN", Distance: "286", Minutes: 50),
            (Origin: "VCA", Destination: "SGN", Distance: "165", Minutes: 40),
            (Origin: "HPH", Destination: "HAN", Distance: "105", Minutes: 35),
            (Origin: "HUI", Destination: "HAN", Distance: "580", Minutes: 65),
            (Origin: "SGN", Destination: "SIN", Distance: "1093", Minutes: 125),
            (Origin: "SIN", Destination: "SGN", Distance: "1093", Minutes: 125),
            (Origin: "HAN", Destination: "SIN", Distance: "2205", Minutes: 205),
            (Origin: "SIN", Destination: "HAN", Distance: "2205", Minutes: 205),
        };
        foreach (var routeSeed in routeSeedList)
        {
            if (!airportLookup.TryGetValue(routeSeed.Origin, out var originId) ||
                !airportLookup.TryGetValue(routeSeed.Destination, out var destinationId))
                continue;

            if (!await dbContext.Routes.AnyAsync(r => r.OriginAirportId == originId && r.DestinationAirportId == destinationId))
            {
                dbContext.Routes.Add(new FlightBooking.Domain.Entities.Flights.Route
                {
                    OriginAirportId = originId,
                    DestinationAirportId = destinationId,
                    DistanceKm = routeSeed.Distance,
                    EstimatedDurationMinutes = routeSeed.Minutes,
                    Duration = TimeSpan.FromMinutes(routeSeed.Minutes),
                    IsActive = true
                });
            }
        }
        await dbContext.SaveChangesAsync();

        // 9.5. Seed Flight Schedules (phụ thuộc Route và Aircraft và Airline)
        if (!await dbContext.FlightSchedules.AnyAsync())
        {
            var dbAirlines = await dbContext.Airlines.ToDictionaryAsync(a => a.Code, a => a.Id);
            var dbAircrafts = await dbContext.Aircrafts.ToDictionaryAsync(a => a.RegistrationNumber, a => a.Id);
            var dbRoutes = await dbContext.Routes
                .Include(r => r.OriginAirport)
                .Include(r => r.DestinationAirport)
                .ToListAsync();

            // Định nghĩa danh sách các Lịch bay mẫu
            var scheduleSeeds = new[]
            {
                // Template Flights
                (FlightNum: "VN201", Origin: "SGN", Dest: "HAN", RegNum: "VN-A321-01", Dep: "06:00", Arr: "08:05", Days: "1,3,5", Price: 1800000m, AirlineCode: "VN"),
                (FlightNum: "VN202", Origin: "HAN", Dest: "SGN", RegNum: "VN-A321-02", Dep: "08:00", Arr: "10:05", Days: "1,3,5", Price: 1800000m, AirlineCode: "VN"),
                (FlightNum: "VJ301", Origin: "SGN", Dest: "HAN", RegNum: "VJ-A320-01", Dep: "07:00", Arr: "09:05", Days: "0,1,2,3,4,5,6", Price: 1200000m, AirlineCode: "VJ"),
                (FlightNum: "VJ302", Origin: "HAN", Dest: "SGN", RegNum: "VJ-A320-02", Dep: "10:00", Arr: "12:05", Days: "0,1,2,3,4,5,6", Price: 1200000m, AirlineCode: "VJ"),
                (FlightNum: "VN203", Origin: "SGN", Dest: "DAD", RegNum: "VN-B789-01", Dep: "10:00", Arr: "11:20", Days: "1,2,3,4,5,6", Price: 1500000m, AirlineCode: "VN"),
                (FlightNum: "BL401", Origin: "SGN", Dest: "DAD", RegNum: "BL-E190-01", Dep: "13:00", Arr: "14:20", Days: "2,4,6", Price: 1100000m, AirlineCode: "BL"),
                (FlightNum: "VN204", Origin: "DAD", Dest: "SGN", RegNum: "VN-A321-01", Dep: "14:00", Arr: "15:20", Days: "1,2,3,4,5,6", Price: 1500000m, AirlineCode: "VN"),
                (FlightNum: "VJ303", Origin: "HAN", Dest: "DAD", RegNum: "VJ-A321-01", Dep: "06:00", Arr: "07:10", Days: "0,2,4,6", Price: 1300000m, AirlineCode: "VJ"),
                (FlightNum: "BL402", Origin: "DAD", Dest: "HAN", RegNum: "BL-A319-01", Dep: "16:00", Arr: "17:10", Days: "1,3,5", Price: 1100000m, AirlineCode: "BL"),
                (FlightNum: "VN205", Origin: "SGN", Dest: "CXR", RegNum: "VN-A321-02", Dep: "08:00", Arr: "08:55", Days: "2,4,6", Price: 900000m, AirlineCode: "VN"),
                (FlightNum: "VJ304", Origin: "SGN", Dest: "PQC", RegNum: "VJ-A320-01", Dep: "09:00", Arr: "09:50", Days: "0,1,2,3,4,5,6", Price: 850000m, AirlineCode: "VJ"),
                (FlightNum: "QH501", Origin: "SGN", Dest: "VCA", RegNum: "QH-A320-01", Dep: "11:00", Arr: "11:40", Days: "1,3,5", Price: 750000m, AirlineCode: "QH"),
                (FlightNum: "VN206", Origin: "HAN", Dest: "HPH", RegNum: "VN-B789-01", Dep: "07:00", Arr: "07:35", Days: "1,2,3,4,5", Price: 700000m, AirlineCode: "VN"),
                (FlightNum: "BL403", Origin: "HAN", Dest: "HUI", RegNum: "BL-B789-01", Dep: "15:00", Arr: "16:05", Days: "2,4,6", Price: 1200000m, AirlineCode: "BL"),
                (FlightNum: "QH502", Origin: "DAD", Dest: "CXR", RegNum: "QH-A321-01", Dep: "12:00", Arr: "13:00", Days: "1,3,5", Price: 950000m, AirlineCode: "QH"),

                // Supplemental Flights
                (FlightNum: "BN701", Origin: "SGN", Dest: "DAD", RegNum: "BN-A320-01", Dep: "17:00", Arr: "18:20", Days: "1,3,5", Price: 980000m, AirlineCode: "BN"),
                (FlightNum: "BN702", Origin: "DAD", Dest: "SGN", RegNum: "BN-A320-01", Dep: "18:00", Arr: "19:20", Days: "1,3,5", Price: 980000m, AirlineCode: "BN"),
                (FlightNum: "BN711", Origin: "SGN", Dest: "HAN", RegNum: "BN-A320-01", Dep: "20:00", Arr: "23:00", Days: "2,4,6", Price: 1150000m, AirlineCode: "BN"),
                (FlightNum: "0V801", Origin: "SGN", Dest: "PQC", RegNum: "0V-ATR-01", Dep: "06:00", Arr: "06:50", Days: "0,1,2,3,4,5,6", Price: 720000m, AirlineCode: "0V"),
                (FlightNum: "0V802", Origin: "PQC", Dest: "SGN", RegNum: "0V-ATR-01", Dep: "19:00", Arr: "19:50", Days: "0,1,2,3,4,5,6", Price: 720000m, AirlineCode: "0V"),
                (FlightNum: "0V811", Origin: "SGN", Dest: "VCA", RegNum: "0V-ATR-01", Dep: "21:00", Arr: "22:35", Days: "1,3,5", Price: 640000m, AirlineCode: "0V"),
                (FlightNum: "SQ901", Origin: "SGN", Dest: "SIN", RegNum: "SQ-B773-01", Dep: "10:00", Arr: "13:05", Days: "0,1,2,3,4,5,6", Price: 2400000m, AirlineCode: "SQ"),
                (FlightNum: "SQ902", Origin: "SIN", Dest: "SGN", RegNum: "SQ-B773-01", Dep: "15:00", Arr: "18:05", Days: "0,1,2,3,4,5,6", Price: 2400000m, AirlineCode: "SQ"),
                (FlightNum: "SQ911", Origin: "HAN", Dest: "SIN", RegNum: "SQ-A388-01", Dep: "23:00", Arr: "03:25", Days: "1,3,5", Price: 3200000m, AirlineCode: "SQ"),
                (FlightNum: "VN801", Origin: "SGN", Dest: "DAD", RegNum: "VN-A321-01", Dep: "22:00", Arr: "23:55", Days: "2,4,6", Price: 1450000m, AirlineCode: "VN"),
                (FlightNum: "VJ801", Origin: "SGN", Dest: "DAD", RegNum: "VJ-A320-01", Dep: "05:00", Arr: "07:30", Days: "1,3,5", Price: 1050000m, AirlineCode: "VJ")
            };

            var schedulesToCreate = new List<FlightSchedule>();
            foreach (var seed in scheduleSeeds)
            {
                var route = dbRoutes.FirstOrDefault(r => r.OriginAirport?.Code == seed.Origin && r.DestinationAirport?.Code == seed.Dest);
                if (route == null) continue;

                if (!dbAircrafts.TryGetValue(seed.RegNum, out var aircraftId)) continue;
                dbAirlines.TryGetValue(seed.AirlineCode, out var airlineId);

                schedulesToCreate.Add(new FlightSchedule
                {
                    FlightNumber = seed.FlightNum,
                    DaysOfWeek = seed.Days,
                    StartDate = DateTime.UtcNow.Date,
                    EndDate = DateTime.UtcNow.Date.AddMonths(6),
                    RouteId = route.Id,
                    AircraftId = aircraftId,
                    DepartureTime = TimeSpan.Parse(seed.Dep),
                    ArrivalTime = TimeSpan.Parse(seed.Arr),
                    BasePrice = seed.Price,
                    IsActive = true,
                    AirlineId = airlineId > 0 ? airlineId : (int?)null
                });
            }

            dbContext.FlightSchedules.AddRange(schedulesToCreate);
            await dbContext.SaveChangesAsync();
        }

        // 10. Seed Flights (phụ thuộc Route và Aircraft) — nhiều ngày T+1..T+14
        if (!await dbContext.Flights.AnyAsync())
        {
            var dbSchedules = await dbContext.FlightSchedules.ToDictionaryAsync(s => s.FlightNumber, s => s.Id);
            var routes = await dbContext.Routes.ToListAsync();
            var aircrafts = await dbContext.Aircrafts.Include(a => a.SeatConfigurations).ToListAsync();

            // Template chuyến bay: (FlightNumber, RouteIndex, AircraftIndex, DepartureHour, BasePrice)
            var templates = new List<(string Num, int RIdx, int AIdx, int Hour, decimal Price)>
            {
                ("VN201", 0, 0, 6,  1_800_000), // SGN->HAN sáng sớm
                ("VN202", 1, 1, 8,  1_800_000), // HAN->SGN sáng
                ("VJ301", 0, 4, 7,  1_200_000), // SGN->HAN VietJet
                ("VJ302", 1, 5, 9,  1_200_000), // HAN->SGN VietJet
                ("VN203", 2, 2, 10, 1_500_000), // SGN->DAD
                ("BL401", 2, 7, 13, 1_100_000), // SGN->DAD Bamboo
                ("VN204", 3, 0, 14, 1_500_000), // DAD->SGN
                ("VJ303", 4, 6, 6,  1_300_000), // HAN->DAD
                ("BL402", 5, 8, 16, 1_100_000), // DAD->HAN Bamboo
                ("VN205", 6, 1, 8,  900_000),   // SGN->CXR
                ("VJ304", 7, 4, 9,  850_000),   // SGN->PQC
                ("QH501", 8, 10, 11, 750_000),  // SGN->VCA
                ("VN206", 9, 2, 7,  700_000),   // HAN->HPH
                ("BL403", 10, 9, 15, 1_200_000),// HAN->HUI
                ("QH502", 11, 11, 12, 950_000), // DAD->CXR
            };

            // Tạo chuyến bay cho các ngày: T+1, T+2, T+3, T+5, T+7, T+10, T+14
            int[] dayOffsets = { 1, 2, 3, 5, 7, 10, 14 };
            var flightList = new List<FlightBooking.Domain.Entities.Flights.Flight>();

            foreach (int dayOffset in dayOffsets)
            {
                var baseDate = DateTime.UtcNow.Date.AddDays(dayOffset);
                foreach (var (num, rIdx, aIdx, hour, price) in templates)
                {
                    if (rIdx >= routes.Count || aIdx >= aircrafts.Count) continue;
                    var route = routes[rIdx];
                    var ac = aircrafts[aIdx];
                    var dep = baseDate.AddHours(hour);
                    var arr = dep.AddMinutes(route.EstimatedDurationMinutes);
                    // Suffix ngày để tránh duplicate FlightNumber
                    var flightNum = $"{num}-{baseDate:MMdd}";

                    dbSchedules.TryGetValue(num, out var scheduleId);

                    flightList.Add(new FlightBooking.Domain.Entities.Flights.Flight
                    {
                        FlightNumber = flightNum,
                        RouteId     = route.Id,
                        AircraftId  = ac.Id,
                        ScheduleId  = scheduleId > 0 ? scheduleId : (int?)null,
                        DepartureTime = dep,
                        ArrivalTime   = arr,
                        BasePrice = price,
                        Status = FlightBooking.Domain.Enums.FlightStatus.Scheduled
                    });
                }
            }

            dbContext.Flights.AddRange(flightList);
            await dbContext.SaveChangesAsync();

            // Tự động tạo FlightSeats từ SeatConfigurations
            var allSeats = new List<FlightBooking.Domain.Entities.Seats.FlightSeat>();
            foreach (var f in flightList)
            {
                var ac = aircrafts.First(a => a.Id == f.AircraftId);
                foreach (var sc in ac.SeatConfigurations)
                {
                    allSeats.Add(new FlightBooking.Domain.Entities.Seats.FlightSeat
                    {
                        FlightId   = f.Id,
                        SeatNumber = sc.SeatNumber,
                        ClassType  = sc.ClassType,
                        Status     = FlightBooking.Domain.Enums.SeatStatus.Available,
                        Price      = f.BasePrice * sc.PriceMultiplier
                    });
                }
            }
            dbContext.FlightSeats.AddRange(allSeats);
            await dbContext.SaveChangesAsync();
        }

        // 11. Seed Aircrafts cho các hãng mới (Pacific, VASCO, Singapore Airlines)
        var allAirlines2 = await dbContext.Airlines.ToListAsync();
        var newAircraftSeeds = new[]
        {
            (Code: "BN", Model: "Airbus A320",   Seats: 180, Reg: "BN-A320-01"),
            (Code: "BN", Model: "Airbus A320",   Seats: 180, Reg: "BN-A320-02"),
            (Code: "0V", Model: "ATR 72-500",    Seats: 68,  Reg: "0V-ATR-01"),
            (Code: "0V", Model: "ATR 72-500",    Seats: 68,  Reg: "0V-ATR-02"),
            (Code: "SQ", Model: "Boeing 777-300ER", Seats: 396, Reg: "SQ-B773-01"),
            (Code: "SQ", Model: "Airbus A380-800",  Seats: 471, Reg: "SQ-A388-01"),
        };
        foreach (var ac in newAircraftSeeds)
        {
            if (!await dbContext.Aircrafts.AnyAsync(x => x.RegistrationNumber == ac.Reg))
            {
                var airline = allAirlines2.FirstOrDefault(a => a.Code == ac.Code);
                if (airline == null) continue;
                var newAc = new FlightBooking.Domain.Entities.Flights.Aircraft
                {
                    Model = ac.Model, TotalSeats = ac.Seats, AirlineId = airline.Id,
                    IsActive = true, RegistrationNumber = ac.Reg
                };
                dbContext.Aircrafts.Add(newAc);
                await dbContext.SaveChangesAsync();

                // Tạo SeatConfiguration cho máy bay mới
                var seatConfigs2 = new List<FlightBooking.Domain.Entities.Seats.SeatConfiguration>();
                int businessRows2 = ac.Seats >= 200 ? 4 : (ac.Seats >= 100 ? 2 : 0);
                int totalRows2 = ac.Seats / 6 + businessRows2;
                bool isAtr = ac.Model.StartsWith("ATR");
                if (isAtr)
                {
                    // ATR 72: layout 2-2, chỉ Economy
                    int atrRows = ac.Seats / 4;
                    for (int row = 1; row <= atrRows; row++)
                        foreach (var col in new[] { "A", "B", "C", "D" })
                        {
                            var pos2 = (col == "A" || col == "D") ? FlightBooking.Domain.Enums.SeatPosition.Window : FlightBooking.Domain.Enums.SeatPosition.Aisle;
                            seatConfigs2.Add(new FlightBooking.Domain.Entities.Seats.SeatConfiguration { AircraftId = newAc.Id, SeatNumber = $"{row}{col}", ClassType = FlightBooking.Domain.Enums.SeatClassType.Economy, PriceMultiplier = 1.0m, Position = pos2 });
                        }
                }
                else
                {
                    for (int row = 1; row <= businessRows2; row++)
                        foreach (var col in new[] { "A", "C", "D", "F" })
                        {
                            var pos2 = (col == "A" || col == "F") ? FlightBooking.Domain.Enums.SeatPosition.Window : FlightBooking.Domain.Enums.SeatPosition.Aisle;
                            seatConfigs2.Add(new FlightBooking.Domain.Entities.Seats.SeatConfiguration { AircraftId = newAc.Id, SeatNumber = $"{row}{col}", ClassType = FlightBooking.Domain.Enums.SeatClassType.Business, PriceMultiplier = 2.5m, Position = pos2 });
                        }
                    for (int row = businessRows2 + 1; row <= totalRows2; row++)
                        foreach (var col in new[] { "A", "B", "C", "D", "E", "F" })
                        {
                            var pos2 = (col == "A" || col == "F") ? FlightBooking.Domain.Enums.SeatPosition.Window
                                     : (col == "C" || col == "D") ? FlightBooking.Domain.Enums.SeatPosition.Aisle
                                     : FlightBooking.Domain.Enums.SeatPosition.Middle;
                            seatConfigs2.Add(new FlightBooking.Domain.Entities.Seats.SeatConfiguration { AircraftId = newAc.Id, SeatNumber = $"{row}{col}", ClassType = FlightBooking.Domain.Enums.SeatClassType.Economy, PriceMultiplier = 1.0m, Position = pos2 });
                        }
                }
                dbContext.SeatConfigurations.AddRange(seatConfigs2);
                await dbContext.SaveChangesAsync();
            }
        }

        // 12. Seed AirlineManager accounts
        var airlines = await dbContext.Airlines.ToListAsync();
        var managerSeeds = new[]
        {
            (Email: "manager.vn@skybooking.vn",  Name: "Nguyễn Văn Minh",    Code: "VN"),
            (Email: "manager.vj@skybooking.vn",  Name: "Trần Thị Lan",       Code: "VJ"),
            (Email: "manager.bl@skybooking.vn",  Name: "Lê Quốc Hùng",       Code: "BL"),
            (Email: "manager.qh@skybooking.vn",  Name: "Phạm Thu Hà",        Code: "QH"),
            (Email: "manager.bn@skybooking.vn",  Name: "Đặng Minh Tuấn",     Code: "BN"),
            (Email: "manager.0v@skybooking.vn",  Name: "Nguyễn Thị Bích Vân",Code: "0V"),
            (Email: "manager.sq@skybooking.vn",  Name: "Tan Wei Ming",        Code: "SQ"),
        };
        var managerPassword = configuration["SeedData:ManagerPassword"];
        
        if (!string.IsNullOrEmpty(managerPassword))
        {
            foreach (var (email, name, code) in managerSeeds)
            {
                if (await userManager.FindByEmailAsync(email) == null)
                {
                    var airline = airlines.FirstOrDefault(a => a.Code == code);
                    var manager = new ApplicationUser
                    {
                        UserName = email,
                        Email = email,
                        FullName = name,
                        Role = FlightBooking.Domain.Enums.UserRole.AirlineManager,
                        EmailConfirmed = true,
                        AirlineId = airline?.Id
                    };
                    var result = await userManager.CreateAsync(manager, managerPassword);
                    if (result.Succeeded)
                        await userManager.AddToRoleAsync(manager, "AirlineManager");
                }
            }
        }

        // 13. Seed supplemental flights for airline filters and stop-count filters.
        var routeLookup = await dbContext.Routes
            .Include(r => r.OriginAirport)
            .Include(r => r.DestinationAirport)
            .ToListAsync();
        var aircraftLookup = await dbContext.Aircrafts
            .Include(a => a.Airline)
            .Include(a => a.SeatConfigurations)
            .ToListAsync();

        var dbSchedules2 = await dbContext.FlightSchedules.ToDictionaryAsync(s => s.FlightNumber, s => s.Id);

        var supplementalFlights = new[]
        {
            (Prefix: "BN701", Airline: "BN", Origin: "SGN", Destination: "DAD", Hour: 17, Price: 980_000m, Stops: 0, StopoverCodes: (string?)null),
            (Prefix: "BN702", Airline: "BN", Origin: "DAD", Destination: "SGN", Hour: 18, Price: 980_000m, Stops: 0, StopoverCodes: (string?)null),
            (Prefix: "BN711", Airline: "BN", Origin: "SGN", Destination: "HAN", Hour: 20, Price: 1_150_000m, Stops: 1, StopoverCodes: "DAD"),
            (Prefix: "0V801", Airline: "0V", Origin: "SGN", Destination: "PQC", Hour: 6, Price: 720_000m, Stops: 0, StopoverCodes: (string?)null),
            (Prefix: "0V802", Airline: "0V", Origin: "PQC", Destination: "SGN", Hour: 19, Price: 720_000m, Stops: 0, StopoverCodes: (string?)null),
            (Prefix: "0V811", Airline: "0V", Origin: "SGN", Destination: "VCA", Hour: 21, Price: 640_000m, Stops: 1, StopoverCodes: "CXR"),
            (Prefix: "SQ901", Airline: "SQ", Origin: "SGN", Destination: "SIN", Hour: 10, Price: 2_400_000m, Stops: 0, StopoverCodes: (string?)null),
            (Prefix: "SQ902", Airline: "SQ", Origin: "SIN", Destination: "SGN", Hour: 15, Price: 2_400_000m, Stops: 0, StopoverCodes: (string?)null),
            (Prefix: "SQ911", Airline: "SQ", Origin: "HAN", Destination: "SIN", Hour: 23, Price: 3_200_000m, Stops: 2, StopoverCodes: "SGN,KUL"),
            (Prefix: "VN801", Airline: "VN", Origin: "SGN", Destination: "DAD", Hour: 22, Price: 1_450_000m, Stops: 1, StopoverCodes: "CXR"),
            (Prefix: "VJ801", Airline: "VJ", Origin: "SGN", Destination: "DAD", Hour: 5, Price: 1_050_000m, Stops: 2, StopoverCodes: "CXR,HUI"),
        };

        int[] supplementalDayOffsets = { 1, 2, 3, 5, 7, 10, 14 };
        var newFlights = new List<FlightBooking.Domain.Entities.Flights.Flight>();
        foreach (var dayOffset in supplementalDayOffsets)
        {
            var baseDate = DateTime.UtcNow.Date.AddDays(dayOffset);
            foreach (var seed in supplementalFlights)
            {
                var route = routeLookup.FirstOrDefault(r =>
                    r.OriginAirport?.Code == seed.Origin &&
                    r.DestinationAirport?.Code == seed.Destination);
                var aircraft = aircraftLookup.FirstOrDefault(a => a.Airline?.Code == seed.Airline);
                if (route == null || aircraft == null) continue;

                var flightNumber = $"{seed.Prefix}-{baseDate:MMdd}";
                if (await dbContext.Flights.AnyAsync(f => f.FlightNumber == flightNumber))
                    continue;

                var departure = baseDate.AddHours(seed.Hour);
                dbSchedules2.TryGetValue(seed.Prefix, out var scheduleId);

                newFlights.Add(new FlightBooking.Domain.Entities.Flights.Flight
                {
                    FlightNumber = flightNumber,
                    RouteId = route.Id,
                    AircraftId = aircraft.Id,
                    ScheduleId = scheduleId > 0 ? scheduleId : (int?)null,
                    DepartureTime = departure,
                    ArrivalTime = departure.AddMinutes(route.EstimatedDurationMinutes + seed.Stops * 55),
                    BasePrice = seed.Price,
                    StopCount = seed.Stops,
                    StopoverCodes = seed.StopoverCodes,
                    Status = FlightBooking.Domain.Enums.FlightStatus.Scheduled
                });
            }
        }

        if (newFlights.Count > 0)
        {
            dbContext.Flights.AddRange(newFlights);
            await dbContext.SaveChangesAsync();

            var supplementalSeats = new List<FlightBooking.Domain.Entities.Seats.FlightSeat>();
            foreach (var flight in newFlights)
            {
                var aircraft = aircraftLookup.First(a => a.Id == flight.AircraftId);
                foreach (var seatConfig in aircraft.SeatConfigurations)
                {
                    supplementalSeats.Add(new FlightBooking.Domain.Entities.Seats.FlightSeat
                    {
                        FlightId = flight.Id,
                        SeatNumber = seatConfig.SeatNumber,
                        ClassType = seatConfig.ClassType,
                        Status = FlightBooking.Domain.Enums.SeatStatus.Available,
                        Price = flight.BasePrice * seatConfig.PriceMultiplier
                    });
                }
            }
            dbContext.FlightSeats.AddRange(supplementalSeats);
            await dbContext.SaveChangesAsync();
        }

        // 14. Seed AirportStaff accounts
        var staffSeeds = new[]
        {
            (Email: "staff.sgn@airport.vn", Name: "Staff Tân Sơn Nhất", Airport: "SGN"),
            (Email: "staff.han@airport.vn", Name: "Staff Nội Bài", Airport: "HAN")
        };
        var staffPassword = "Password123!";

        foreach (var (email, name, airport) in staffSeeds)
        {
            if (await userManager.FindByEmailAsync(email) == null)
            {
                var staff = new ApplicationUser
                {
                    UserName = email,
                    Email = email,
                    FullName = name,
                    Role = FlightBooking.Domain.Enums.UserRole.AirportStaff,
                    EmailConfirmed = true,
                    AirportCode = airport
                };
                var result = await userManager.CreateAsync(staff, staffPassword);
                if (result.Succeeded)
                    await userManager.AddToRoleAsync(staff, "AirportStaff");
            }
        }

        // 15. Seed Promotions nếu trống
        if (!await dbContext.Promotions.AnyAsync())
        {
            var dbAirlines = await dbContext.Airlines.ToListAsync();
            var idVN = dbAirlines.FirstOrDefault(a => a.Code == "VN")?.Id;
            var idVJ = dbAirlines.FirstOrDefault(a => a.Code == "VJ")?.Id;
            var idBL = dbAirlines.FirstOrDefault(a => a.Code == "BL")?.Id;

            dbContext.Promotions.AddRange(
                new FlightBooking.Domain.Entities.Promotions.Promotion
                {
                    Code = "VN30HE2026",
                    Name = "Hè rực rỡ - Giảm 30%",
                    DiscountPercent = 30,
                    StartDate = DateTime.Today.AddDays(-10),
                    EndDate = DateTime.Today.AddDays(90),
                    Status = "Active",
                    AirlineId = idVN,
                    CreatedAt = DateTime.Now,
                    UpdatedAt = DateTime.Now
                },
                new FlightBooking.Domain.Entities.Promotions.Promotion
                {
                    Code = "VJ50SUMMER",
                    Name = "Chào hè cực chất - Giảm 50%",
                    DiscountPercent = 50,
                    StartDate = DateTime.Today.AddDays(-5),
                    EndDate = DateTime.Today.AddDays(60),
                    Status = "Active",
                    AirlineId = idVJ,
                    CreatedAt = DateTime.Now,
                    UpdatedAt = DateTime.Now
                },
                new FlightBooking.Domain.Entities.Promotions.Promotion
                {
                    Code = "BAMBOO20",
                    Name = "Bay xanh cùng Bamboo - Giảm 20%",
                    DiscountPercent = 20,
                    StartDate = DateTime.Today.AddDays(-2),
                    EndDate = DateTime.Today.AddDays(45),
                    Status = "Active",
                    AirlineId = idBL,
                    CreatedAt = DateTime.Now,
                    UpdatedAt = DateTime.Now
                }
            );
            await dbContext.SaveChangesAsync();
        }
    }

    }
}
