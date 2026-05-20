using FlightBooking.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FlightBooking.Infrastructure.Migrations
{
    /// <inheritdoc />
    [DbContext(typeof(FlightBookingDbContext))]
    [Migration("20260520000100_AddFlightStopoverCodes")]
    public partial class AddFlightStopoverCodes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "StopoverCodes",
                table: "Flights",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "StopoverCodes",
                table: "Flights");
        }
    }
}
