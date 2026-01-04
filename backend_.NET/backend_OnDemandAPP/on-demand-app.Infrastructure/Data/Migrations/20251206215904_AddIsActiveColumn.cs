using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace on_demand_app.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddIsActiveColumn : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "TypicalDurationMinutes",
                table: "ProviderServices");

            migrationBuilder.AlterColumn<decimal>(
                name: "BasePrice",
                table: "ProviderServices",
                type: "numeric(12,2)",
                nullable: false,
                defaultValue: 0m,
                oldClrType: typeof(decimal),
                oldType: "numeric(12,2)",
                oldNullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsActive",
                table: "ProviderServices",
                type: "bit",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsActive",
                table: "ProviderServices");

            migrationBuilder.AlterColumn<decimal>(
                name: "BasePrice",
                table: "ProviderServices",
                type: "numeric(12,2)",
                nullable: true,
                oldClrType: typeof(decimal),
                oldType: "numeric(12,2)");

            migrationBuilder.AddColumn<int>(
                name: "TypicalDurationMinutes",
                table: "ProviderServices",
                type: "int",
                nullable: true);
        }
    }
}
