using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FlightBooking.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddScheduleFieldsAndAirportStaff : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "AircraftId",
                table: "FlightSchedules",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "AirlineId",
                table: "FlightSchedules",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<TimeSpan>(
                name: "ArrivalTime",
                table: "FlightSchedules",
                type: "time",
                nullable: false,
                defaultValue: new TimeSpan(0, 0, 0, 0, 0));

            migrationBuilder.AddColumn<decimal>(
                name: "BasePrice",
                table: "FlightSchedules",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<TimeSpan>(
                name: "DepartureTime",
                table: "FlightSchedules",
                type: "time",
                nullable: false,
                defaultValue: new TimeSpan(0, 0, 0, 0, 0));

            migrationBuilder.AddColumn<bool>(
                name: "IsActive",
                table: "FlightSchedules",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<int>(
                name: "RouteId",
                table: "FlightSchedules",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "AirportCode",
                table: "AspNetUsers",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_FlightSchedules_AircraftId",
                table: "FlightSchedules",
                column: "AircraftId");

            migrationBuilder.CreateIndex(
                name: "IX_FlightSchedules_AirlineId",
                table: "FlightSchedules",
                column: "AirlineId");

            migrationBuilder.CreateIndex(
                name: "IX_FlightSchedules_RouteId",
                table: "FlightSchedules",
                column: "RouteId");

            migrationBuilder.AddForeignKey(
                name: "FK_FlightSchedules_Aircrafts_AircraftId",
                table: "FlightSchedules",
                column: "AircraftId",
                principalTable: "Aircrafts",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_FlightSchedules_Airlines_AirlineId",
                table: "FlightSchedules",
                column: "AirlineId",
                principalTable: "Airlines",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_FlightSchedules_Routes_RouteId",
                table: "FlightSchedules",
                column: "RouteId",
                principalTable: "Routes",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_FlightSchedules_Aircrafts_AircraftId",
                table: "FlightSchedules");

            migrationBuilder.DropForeignKey(
                name: "FK_FlightSchedules_Airlines_AirlineId",
                table: "FlightSchedules");

            migrationBuilder.DropForeignKey(
                name: "FK_FlightSchedules_Routes_RouteId",
                table: "FlightSchedules");

            migrationBuilder.DropIndex(
                name: "IX_FlightSchedules_AircraftId",
                table: "FlightSchedules");

            migrationBuilder.DropIndex(
                name: "IX_FlightSchedules_AirlineId",
                table: "FlightSchedules");

            migrationBuilder.DropIndex(
                name: "IX_FlightSchedules_RouteId",
                table: "FlightSchedules");

            migrationBuilder.DropColumn(
                name: "AircraftId",
                table: "FlightSchedules");

            migrationBuilder.DropColumn(
                name: "AirlineId",
                table: "FlightSchedules");

            migrationBuilder.DropColumn(
                name: "ArrivalTime",
                table: "FlightSchedules");

            migrationBuilder.DropColumn(
                name: "BasePrice",
                table: "FlightSchedules");

            migrationBuilder.DropColumn(
                name: "DepartureTime",
                table: "FlightSchedules");

            migrationBuilder.DropColumn(
                name: "IsActive",
                table: "FlightSchedules");

            migrationBuilder.DropColumn(
                name: "RouteId",
                table: "FlightSchedules");

            migrationBuilder.DropColumn(
                name: "AirportCode",
                table: "AspNetUsers");
        }
    }
}
