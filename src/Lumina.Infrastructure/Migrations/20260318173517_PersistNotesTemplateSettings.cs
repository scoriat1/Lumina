using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Lumina.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class PersistNotesTemplateSettings : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "NotesSelectedTemplateId",
                table: "Practices",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "NotesSelectedTemplateKind",
                table: "Practices",
                type: "nvarchar(16)",
                maxLength: 16,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "NotesTemplateMode",
                table: "Practices",
                type: "nvarchar(32)",
                maxLength: 32,
                nullable: false,
                defaultValue: "default");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "NotesSelectedTemplateId",
                table: "Practices");

            migrationBuilder.DropColumn(
                name: "NotesSelectedTemplateKind",
                table: "Practices");

            migrationBuilder.DropColumn(
                name: "NotesTemplateMode",
                table: "Practices");
        }
    }
}
