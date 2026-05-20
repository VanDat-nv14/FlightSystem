using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FlightBooking.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddBaggageTags : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "TicketId",
                table: "BookingBaggages",
                type: "int",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "BaggageTags",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    TagCode = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    BookingBaggageId = table.Column<int>(type: "int", nullable: false),
                    TicketId = table.Column<int>(type: "int", nullable: false),
                    FlightId = table.Column<int>(type: "int", nullable: false),
                    Status = table.Column<int>(type: "int", nullable: false),
                    CheckedInAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    LoadedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ArrivedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ClaimedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BaggageTags", x => x.Id);
                    table.ForeignKey(
                        name: "FK_BaggageTags_BookingBaggages_BookingBaggageId",
                        column: x => x.BookingBaggageId,
                        principalTable: "BookingBaggages",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_BaggageTags_Flights_FlightId",
                        column: x => x.FlightId,
                        principalTable: "Flights",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_BaggageTags_Tickets_TicketId",
                        column: x => x.TicketId,
                        principalTable: "Tickets",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_BookingBaggages_TicketId",
                table: "BookingBaggages",
                column: "TicketId");

            migrationBuilder.CreateIndex(
                name: "IX_BaggageTags_BookingBaggageId",
                table: "BaggageTags",
                column: "BookingBaggageId");

            migrationBuilder.CreateIndex(
                name: "IX_BaggageTags_FlightId",
                table: "BaggageTags",
                column: "FlightId");

            migrationBuilder.CreateIndex(
                name: "IX_BaggageTags_TagCode",
                table: "BaggageTags",
                column: "TagCode",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_BaggageTags_TicketId",
                table: "BaggageTags",
                column: "TicketId");

            migrationBuilder.AddForeignKey(
                name: "FK_BookingBaggages_Tickets_TicketId",
                table: "BookingBaggages",
                column: "TicketId",
                principalTable: "Tickets",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_BookingBaggages_Tickets_TicketId",
                table: "BookingBaggages");

            migrationBuilder.DropTable(
                name: "BaggageTags");

            migrationBuilder.DropIndex(
                name: "IX_BookingBaggages_TicketId",
                table: "BookingBaggages");

            migrationBuilder.DropColumn(
                name: "TicketId",
                table: "BookingBaggages");
        }
    }
}
