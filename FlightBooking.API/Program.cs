using FlightBooking.API.Middlewares;
using FlightBooking.Application.Features.Account.Interfaces;
using FlightBooking.Application.Features.Auth.Interfaces;
using FlightBooking.Application.Features.Flights.Interfaces;
using FlightBooking.Infrastructure.Services;
using FlightBooking.Domain.Entities.Users;
using FlightBooking.Infrastructure.Persistence;
using FluentValidation;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// ── 1. Lấy thông số JWT từ appsettings.json ──────────────────────────────
var jwtSettings = builder.Configuration.GetSection("JwtSettings");
var securityKey = new SymmetricSecurityKey(
    Encoding.UTF8.GetBytes(jwtSettings["SecurityKey"]!));

// ── 2. Controllers & Swagger ──────────────────────────────────────────────
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddValidatorsFromAssemblies(AppDomain.CurrentDomain.GetAssemblies());

builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new Microsoft.OpenApi.Models.OpenApiInfo
    {
        Title = "Flight Booking API",
        Version = "v1"
    });

    c.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
    {
        Description = "Nhập Token theo định dạng: Bearer {your_token}",
        Name = "Authorization",
        In = Microsoft.OpenApi.Models.ParameterLocation.Header,
        Type = Microsoft.OpenApi.Models.SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });

    c.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement
    {
        {
            new Microsoft.OpenApi.Models.OpenApiSecurityScheme
            {
                Reference = new Microsoft.OpenApi.Models.OpenApiReference
                {
                    Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            new string[] {}
        }
    });
});

// ── 3. Database ───────────────────────────────────────────────────────────
builder.Services.AddDbContext<FlightBookingDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// ── 4. ASP.NET Identity (PHẢI đặt SAU DbContext, TRƯỚC JWT) ─────────────
builder.Services.AddIdentity<ApplicationUser, ApplicationRole>(options =>
{
    options.Password.RequireDigit = true;
    options.Password.RequiredLength = 6;
    options.Password.RequireUppercase = false;
    options.Password.RequireNonAlphanumeric = false;
    options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(5);
    options.Lockout.MaxFailedAccessAttempts = 5;
})
.AddEntityFrameworkStores<FlightBookingDbContext>()
.AddDefaultTokenProviders();

// ── 5. JWT Authentication (PHẢI đặt SAU AddIdentity) ─────────────────────
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddCookie(options =>
{
    options.Cookie.SameSite = Microsoft.AspNetCore.Http.SameSiteMode.Unspecified;
    options.Cookie.SecurePolicy = Microsoft.AspNetCore.Http.CookieSecurePolicy.Always;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtSettings["Issuer"],
        ValidAudience = jwtSettings["Audience"],
        IssuerSigningKey = securityKey,
        ClockSkew = TimeSpan.Zero
    };
})

.AddGoogle(googleOptions =>
{
    googleOptions.ClientId = builder.Configuration["Google:ClientId"]!;
    googleOptions.ClientSecret = builder.Configuration["Google:ClientSecret"]!;
    googleOptions.SignInScheme = Microsoft.AspNetCore.Authentication.Cookies.CookieAuthenticationDefaults.AuthenticationScheme;
    googleOptions.CorrelationCookie.SameSite = Microsoft.AspNetCore.Http.SameSiteMode.Unspecified;
});
builder.Services.Configure<CookiePolicyOptions>(options =>
{
    options.CheckConsentNeeded = context => false; // Quan trọng: Nếu để true, cookie oauth (correlation) sẽ bị block
    options.MinimumSameSitePolicy = SameSiteMode.Unspecified; 
});

// ── 6. Authorization ──────────────────────────────────────────────────────
builder.Services.AddAuthorization();

// ── 7. Application Services ───────────────────────────────────────────────
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IAccountService, AccountService>();
builder.Services.AddScoped<IAirportService, AirportService>();
builder.Services.AddScoped<IAirlineService, AirlineService>();
builder.Services.AddScoped<IAircraftService, AircraftService>();
builder.Services.AddScoped<IRouteService, RouteService>();
builder.Services.AddScoped<IFlightService, FlightService>();
builder.Services.AddScoped<ISeatConfigurationService, SeatConfigurationService>();
builder.Services.AddScoped<IPartnerBookingService, PartnerBookingService>();
builder.Services.AddScoped<IAdminBookingService, AdminBookingService>();
builder.Services.AddScoped<IBookingService, BookingService>();
builder.Services.AddScoped<IPartnerDashboardService, PartnerDashboardService>();
builder.Services.AddScoped<FlightBooking.Application.Features.Services.Interfaces.IServicesService, ServicesService>();

// ── 8. CORS ───────────────────────────────────────────────────────────────
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins("http://localhost:5173", "http://localhost:3000")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// ── BUILD (chỉ gọi 1 lần duy nhất) ──────────────────────────────────────
var app = builder.Build();

// ── Auto Migrate khi Development ─────────────────────────────────────────
if (app.Environment.IsDevelopment())
{
    using (var scope = app.Services.CreateScope())
    {
        var services = scope.ServiceProvider;
        var dbContext = services.GetRequiredService<FlightBookingDbContext>();
        var roleManager = services.GetRequiredService<RoleManager<ApplicationRole>>();
        var userManager = services.GetRequiredService<UserManager<ApplicationUser>>();

        // 1. Chạy Migration
        await dbContext.Database.MigrateAsync();

        // 2. Tạo các Role mặc định nếu chưa tồn tại
        string[] roles = { "Admin", "Employee", "Customer", "AirlineManager" };
        foreach (var roleName in roles)
        {
            if (!await roleManager.RoleExistsAsync(roleName))
            {
                await roleManager.CreateAsync(new ApplicationRole { Name = roleName });
            }
        }

        // 3. Tạo tài khoản Admin mặc định nếu có trong cấu hình
        var adminEmail = builder.Configuration["SeedData:AdminEmail"];
        var adminPassword = builder.Configuration["SeedData:AdminPassword"];

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

        // 10. Seed Flights (phụ thuộc Route và Aircraft) — nhiều ngày T+1..T+14
        if (!await dbContext.Flights.AnyAsync())
        {
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
                    flightList.Add(new FlightBooking.Domain.Entities.Flights.Flight
                    {
                        FlightNumber = flightNum,
                        RouteId     = route.Id,
                        AircraftId  = ac.Id,
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
        var managerPassword = builder.Configuration["SeedData:ManagerPassword"];
        
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
    }
}

// ── HTTP Pipeline ─────────────────────────────────────────────────────────
// Global Exception Handler (phải đặt ĐẦU TIÊN trong pipeline)
app.UseGlobalExceptionHandler();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseCookiePolicy();

app.UseCors("AllowFrontend");

app.UseAuthentication();   // ← PHẢI trước UseAuthorization
app.UseAuthorization();

app.MapControllers();

app.Run();
