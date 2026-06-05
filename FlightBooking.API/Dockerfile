# ── Stage 1: Build ─────────────────────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy solution & project files trước để tận dụng Docker layer cache
COPY FlightBookingSystem.sln .
COPY FlightBooking.API/FlightBooking.API.csproj                         FlightBooking.API/
COPY FlightBooking.Application/FlightBooking.Application.csproj         FlightBooking.Application/
COPY FlightBooking.Domain/FlightBooking.Domain.csproj                   FlightBooking.Domain/
COPY FlightBooking.Infrastructure/FlightBooking.Infrastructure.csproj   FlightBooking.Infrastructure/

# Restore dependencies
RUN dotnet restore "FlightBooking.API/FlightBooking.API.csproj"

# Copy toàn bộ source code
COPY . .

# Publish
RUN dotnet publish "FlightBooking.API/FlightBooking.API.csproj" \
    -c Release \
    -o /app/publish \
    --no-restore

# ── Stage 2: Runtime ────────────────────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app

# Copy published output
COPY --from=build /app/publish .

EXPOSE 8080

ENV ASPNETCORE_URLS=http://+:8080
ENV ASPNETCORE_ENVIRONMENT=Development

ENTRYPOINT ["dotnet", "FlightBooking.API.dll"]
