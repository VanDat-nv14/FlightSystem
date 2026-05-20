using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FlightBooking.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddFlightStopCount : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "StopCount",
                table: "Flights",
                type: "int",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "StopCount",
                table: "Flights");
        }
    }
}
