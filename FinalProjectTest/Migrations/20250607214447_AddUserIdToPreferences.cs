using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FinalProjectTest.Migrations
{
    /// <inheritdoc />
    public partial class AddUserIdToPreferences : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "UserId",
                table: "Preferences",
                type: "nvarchar(450)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateIndex(
                name: "IX_Preferences_UserId",
                table: "Preferences",
                column: "UserId");

            migrationBuilder.AddForeignKey(
                name: "FK_Preferences_AspNetUsers_UserId",
                table: "Preferences",
                column: "UserId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Preferences_AspNetUsers_UserId",
                table: "Preferences");

            migrationBuilder.DropIndex(
                name: "IX_Preferences_UserId",
                table: "Preferences");

            migrationBuilder.DropColumn(
                name: "UserId",
                table: "Preferences");
        }
    }
}
