using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FinalProjectTest.Migrations
{
    /// <inheritdoc />
    public partial class AddGoogleMapsLink : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "GoogleMapsLink",
                table: "Locations",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "GoogleMapsLink",
                table: "Locations");
        }
    }
}
