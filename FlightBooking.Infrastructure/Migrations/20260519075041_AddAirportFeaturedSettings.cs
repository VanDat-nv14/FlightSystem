using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FlightBooking.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddAirportFeaturedSettings : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "FeaturedDescription",
                table: "Airports",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "FeaturedDisplayOrder",
                table: "Airports",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "FeaturedImageUrl",
                table: "Airports",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsFeatured",
                table: "Airports",
                type: "bit",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "FeaturedDescription",
                table: "Airports");

            migrationBuilder.DropColumn(
                name: "FeaturedDisplayOrder",
                table: "Airports");

            migrationBuilder.DropColumn(
                name: "FeaturedImageUrl",
                table: "Airports");

            migrationBuilder.DropColumn(
                name: "IsFeatured",
                table: "Airports");
        }
    }
}
