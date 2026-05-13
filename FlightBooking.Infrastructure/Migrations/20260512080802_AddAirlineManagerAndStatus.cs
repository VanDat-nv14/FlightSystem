using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FlightBooking.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddAirlineManagerAndStatus : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "AirlineId",
                table: "AspNetUsers",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "Status",
                table: "Airlines",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateIndex(
                name: "IX_AspNetUsers_AirlineId",
                table: "AspNetUsers",
                column: "AirlineId");

            migrationBuilder.AddForeignKey(
                name: "FK_AspNetUsers_Airlines_AirlineId",
                table: "AspNetUsers",
                column: "AirlineId",
                principalTable: "Airlines",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_AspNetUsers_Airlines_AirlineId",
                table: "AspNetUsers");

            migrationBuilder.DropIndex(
                name: "IX_AspNetUsers_AirlineId",
                table: "AspNetUsers");

            migrationBuilder.DropColumn(
                name: "AirlineId",
                table: "AspNetUsers");

            migrationBuilder.DropColumn(
                name: "Status",
                table: "Airlines");
        }
    }
}
