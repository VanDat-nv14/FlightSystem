using FlightBooking.Application.Features.Auth.Interfaces;
using FlightBooking.Domain.Entities.Users;
using FlightBooking.Infrastructure.Persistence;
using FlightBooking.Infrastructure.Services;
using FluentValidation;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.Extensions.DependencyInjection;
using System.Text;
using FlightBooking.Application.Features.Account.Interfaces;

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

        // 1. Chạy Migration (đã có)
        await dbContext.Database.MigrateAsync();
        // 2. Tạo các Role mặc định nếu chưa tồn tại
        string[] roles = { "Admin", "Employee", "Customer" };
        foreach (var roleName in roles)
        {
            if (!await roleManager.RoleExistsAsync(roleName))
            {
                await roleManager.CreateAsync(new ApplicationRole { Name = roleName });
            }
        }
    }
}

// ── HTTP Pipeline ─────────────────────────────────────────────────────────
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseCookiePolicy();

app.UseAuthentication();   // ← PHẢI trước UseAuthorization
app.UseAuthorization();

app.MapControllers();

app.Run();
