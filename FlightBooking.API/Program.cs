using FlightBooking.API.Middlewares;
using FlightBooking.Application.Features.Account.Interfaces;
using FlightBooking.Application.Features.Auth.Interfaces;
using FlightBooking.Application.Features.Customer.Interfaces;
using FlightBooking.Application.Features.Flights.Interfaces;
using FlightBooking.Application.Features.Email.Interfaces;
using FlightBooking.Infrastructure.Services;
using FlightBooking.Application.Features.Flights.Services;
using FlightBooking.Application.Features.Account.Services;
using FlightBooking.Application.Features.Customer.Services;
using FlightBooking.Application.Features.Services.Services;
using FlightBooking.Application.Features.Promotions.Interfaces;
using FlightBooking.Application.Features.Promotions.Services;
using FlightBooking.Application.Common.Interfaces;
using FlightBooking.Domain.Entities.Users;
using FlightBooking.Infrastructure.Persistence;
using FlightBooking.Infrastructure.Persistence.Seed;
using FluentValidation;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using Hangfire;
using Microsoft.AspNetCore.RateLimiting;
using System.Threading.RateLimiting;

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

builder.Services.AddScoped<IApplicationDbContext>(provider =>
    provider.GetRequiredService<FlightBookingDbContext>());

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

// ── Hangfire ─────────────────────────────────────────────────────────────
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddHangfire(configuration => configuration
    .SetDataCompatibilityLevel(CompatibilityLevel.Version_180)
    .UseSimpleAssemblyNameTypeSerializer()
    .UseRecommendedSerializerSettings()
    .UseSqlServerStorage(connectionString));

builder.Services.AddHangfireServer();
builder.Services.AddSingleton<IJobScheduler, HangfireJobScheduler>();

// ── 7. Application Services ───────────────────────────────────────────────
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IAccountService, AccountService>();
builder.Services.AddScoped<IAirportService, AirportService>();
builder.Services.AddScoped<IAirlineService, AirlineService>();
builder.Services.AddScoped<IAircraftService, AircraftService>();
builder.Services.AddScoped<IRouteService, RouteService>();
builder.Services.AddScoped<IFlightService, FlightService>();
builder.Services.AddScoped<IFlightScheduleService, FlightScheduleService>();
builder.Services.AddScoped<ISeatConfigurationService, SeatConfigurationService>();
builder.Services.AddScoped<IPartnerBookingService, PartnerBookingService>();
builder.Services.AddScoped<IAdminBookingService, AdminBookingService>();
builder.Services.AddScoped<IBookingService, BookingService>();
builder.Services.AddScoped<IEmailService, EmailService>();
builder.Services.AddScoped<ICancellationService, CancellationService>();
builder.Services.AddScoped<IPartnerDashboardService, PartnerDashboardService>();
builder.Services.AddScoped<ICustomerNotificationService, CustomerNotificationService>();
builder.Services.AddScoped<ICustomerFavoriteService, CustomerFavoriteService>();
builder.Services.AddScoped<IPromotionService, PromotionService>();
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

// ── 9. Rate Limiting ───────────────────────────────────────────────────────
builder.Services.AddRateLimiter(options =>
{
    options.AddPolicy("HoldSeatLimit", context =>
    {
        var ip = context.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        return RateLimitPartition.GetFixedWindowLimiter(ip, _ => new FixedWindowRateLimiterOptions
        {
            PermitLimit = 3,
            Window = TimeSpan.FromMinutes(10),
            QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
            QueueLimit = 0
        });
    });
});

// ── BUILD (chỉ gọi 1 lần duy nhất) ──────────────────────────────────────
var app = builder.Build();

// ── Auto Migrate khi Development ─────────────────────────────────────────
if (app.Environment.IsDevelopment())
{
    await DatabaseSeeder.SeedDevelopmentAsync(app.Services, builder.Configuration);
}
// ── HTTP Pipeline ─────────────────────────────────────────────────────────
// Global Exception Handler (phải đặt ĐẦU TIÊN trong pipeline)
app.UseGlobalExceptionHandler();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// HTTPS Redirect chỉ bật ở Production - tắt ở Development để tránh lỗi CORS preflight
if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}
app.UseCookiePolicy();

app.UseCors("AllowFrontend");

app.UseRateLimiter(); // ← PHẢI đặt sau CORS và trước Auth nếu có

app.UseAuthentication();   // ← PHẢI trước UseAuthorization
app.UseAuthorization();

app.UseHangfireDashboard("/hangfire");

// Configure Hangfire Recurring Jobs
RecurringJob.AddOrUpdate<IFlightScheduleService>(
    "ensure-next-30-days",
    x => x.EnsureNext30DaysAsync(),
    "1 0 * * *"); // 00:01 daily

RecurringJob.AddOrUpdate<IFlightService>(
    "auto-complete-arrived-flights",
    x => x.AutoCompleteArrivedFlightsAsync(),
    "*/5 * * * *"); // every 5 minutes

RecurringJob.AddOrUpdate<ICancellationService>(
    "remind-expiring-deposits",
    x => x.SendDepositRemindersAsync(),
    "0 * * * *"); // every hour

RecurringJob.AddOrUpdate<ICancellationService>(
    "auto-cancel-expired-deposits",
    x => x.AutoCancelExpiredDepositsAsync(),
    "*/30 * * * *"); // every 30 minutes

app.MapControllers();

app.Run();
