using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace on_demand_app.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class Addphone : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "Rating",
                table: "Jobs",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ReviewComment",
                table: "Jobs",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Rating",
                table: "Jobs");

            migrationBuilder.DropColumn(
                name: "ReviewComment",
                table: "Jobs");
        }
    }
}
