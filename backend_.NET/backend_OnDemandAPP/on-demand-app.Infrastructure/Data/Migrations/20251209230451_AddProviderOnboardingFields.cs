using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace on_demand_app.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddProviderOnboardingFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Bio",
                table: "ProviderProfiles",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CvUrl",
                table: "ProviderProfiles",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "InterviewDate",
                table: "ProviderProfiles",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsOnboardingCompleted",
                table: "ProviderProfiles",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "PhotoUrl",
                table: "ProviderProfiles",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Bio",
                table: "ProviderProfiles");

            migrationBuilder.DropColumn(
                name: "CvUrl",
                table: "ProviderProfiles");

            migrationBuilder.DropColumn(
                name: "InterviewDate",
                table: "ProviderProfiles");

            migrationBuilder.DropColumn(
                name: "IsOnboardingCompleted",
                table: "ProviderProfiles");

            migrationBuilder.DropColumn(
                name: "PhotoUrl",
                table: "ProviderProfiles");
        }
    }
}
