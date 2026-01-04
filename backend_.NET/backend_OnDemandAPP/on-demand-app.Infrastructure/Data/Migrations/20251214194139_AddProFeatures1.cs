using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace on_demand_app.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddProFeatures1 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "MinPrice",
                table: "ServiceItems",
                type: "numeric(12,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<string>(
                name: "Address",
                table: "ProviderProfiles",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<decimal>(
                name: "CurrentLat",
                table: "ProviderProfiles",
                type: "decimal(18,2)",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "CurrentLng",
                table: "ProviderProfiles",
                type: "decimal(18,2)",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "LastLat",
                table: "ProviderProfiles",
                type: "numeric(10,6)",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "LastLng",
                table: "ProviderProfiles",
                type: "numeric(10,6)",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "Lat",
                table: "ProviderProfiles",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "Lng",
                table: "ProviderProfiles",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<int>(
                name: "Rating",
                table: "ProviderProfiles",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ReviewComment",
                table: "ProviderProfiles",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ScheduleJson",
                table: "ProviderProfiles",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "ScheduledAt",
                table: "ProviderProfiles",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "UserId",
                table: "LocationPings",
                type: "uniqueidentifier",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<decimal>(
                name: "CurrentLat",
                table: "Jobs",
                type: "numeric(10,6)",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "CurrentLng",
                table: "Jobs",
                type: "numeric(10,6)",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "Notifications",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Title = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Message = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Type = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ReferenceId = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    IsRead = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Notifications", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Notifications_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.UpdateData(
                table: "ServiceItems",
                keyColumn: "Id",
                keyValue: 101,
                column: "MinPrice",
                value: 150m);

            migrationBuilder.UpdateData(
                table: "ServiceItems",
                keyColumn: "Id",
                keyValue: 102,
                column: "MinPrice",
                value: 150m);

            migrationBuilder.UpdateData(
                table: "ServiceItems",
                keyColumn: "Id",
                keyValue: 103,
                column: "MinPrice",
                value: 100m);

            migrationBuilder.UpdateData(
                table: "ServiceItems",
                keyColumn: "Id",
                keyValue: 104,
                column: "MinPrice",
                value: 200m);

            migrationBuilder.UpdateData(
                table: "ServiceItems",
                keyColumn: "Id",
                keyValue: 105,
                column: "MinPrice",
                value: 120m);

            migrationBuilder.UpdateData(
                table: "ServiceItems",
                keyColumn: "Id",
                keyValue: 106,
                column: "MinPrice",
                value: 180m);

            migrationBuilder.UpdateData(
                table: "ServiceItems",
                keyColumn: "Id",
                keyValue: 201,
                column: "MinPrice",
                value: 100m);

            migrationBuilder.UpdateData(
                table: "ServiceItems",
                keyColumn: "Id",
                keyValue: 202,
                column: "MinPrice",
                value: 150m);

            migrationBuilder.UpdateData(
                table: "ServiceItems",
                keyColumn: "Id",
                keyValue: 203,
                column: "MinPrice",
                value: 300m);

            migrationBuilder.UpdateData(
                table: "ServiceItems",
                keyColumn: "Id",
                keyValue: 204,
                column: "MinPrice",
                value: 200m);

            migrationBuilder.UpdateData(
                table: "ServiceItems",
                keyColumn: "Id",
                keyValue: 205,
                column: "MinPrice",
                value: 250m);

            migrationBuilder.UpdateData(
                table: "ServiceItems",
                keyColumn: "Id",
                keyValue: 301,
                column: "MinPrice",
                value: 200m);

            migrationBuilder.UpdateData(
                table: "ServiceItems",
                keyColumn: "Id",
                keyValue: 302,
                column: "MinPrice",
                value: 80m);

            migrationBuilder.UpdateData(
                table: "ServiceItems",
                keyColumn: "Id",
                keyValue: 303,
                column: "MinPrice",
                value: 300m);

            migrationBuilder.UpdateData(
                table: "ServiceItems",
                keyColumn: "Id",
                keyValue: 304,
                column: "MinPrice",
                value: 50m);

            migrationBuilder.CreateIndex(
                name: "IX_Notifications_UserId",
                table: "Notifications",
                column: "UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Notifications");

            migrationBuilder.DropColumn(
                name: "MinPrice",
                table: "ServiceItems");

            migrationBuilder.DropColumn(
                name: "Address",
                table: "ProviderProfiles");

            migrationBuilder.DropColumn(
                name: "CurrentLat",
                table: "ProviderProfiles");

            migrationBuilder.DropColumn(
                name: "CurrentLng",
                table: "ProviderProfiles");

            migrationBuilder.DropColumn(
                name: "LastLat",
                table: "ProviderProfiles");

            migrationBuilder.DropColumn(
                name: "LastLng",
                table: "ProviderProfiles");

            migrationBuilder.DropColumn(
                name: "Lat",
                table: "ProviderProfiles");

            migrationBuilder.DropColumn(
                name: "Lng",
                table: "ProviderProfiles");

            migrationBuilder.DropColumn(
                name: "Rating",
                table: "ProviderProfiles");

            migrationBuilder.DropColumn(
                name: "ReviewComment",
                table: "ProviderProfiles");

            migrationBuilder.DropColumn(
                name: "ScheduleJson",
                table: "ProviderProfiles");

            migrationBuilder.DropColumn(
                name: "ScheduledAt",
                table: "ProviderProfiles");

            migrationBuilder.DropColumn(
                name: "UserId",
                table: "LocationPings");

            migrationBuilder.DropColumn(
                name: "CurrentLat",
                table: "Jobs");

            migrationBuilder.DropColumn(
                name: "CurrentLng",
                table: "Jobs");
        }
    }
}
