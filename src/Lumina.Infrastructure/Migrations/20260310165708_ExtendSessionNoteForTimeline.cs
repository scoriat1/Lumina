using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Lumina.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class ExtendSessionNoteForTimeline : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_SessionNotes_Sessions_SessionId",
                table: "SessionNotes");

            migrationBuilder.DropForeignKey(
                name: "FK_Templates_TemplatePresets_SourcePresetId",
                table: "Templates");

            migrationBuilder.AlterColumn<int>(
                name: "SessionId",
                table: "SessionNotes",
                type: "int",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "int");

            migrationBuilder.AddColumn<int>(
                name: "ClientId",
                table: "SessionNotes",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "NoteType",
                table: "SessionNotes",
                type: "nvarchar(64)",
                maxLength: 64,
                nullable: false,
                defaultValue: "general");

            migrationBuilder.AddColumn<string>(
                name: "Source",
                table: "SessionNotes",
                type: "nvarchar(64)",
                maxLength: 64,
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_SessionNotes_ClientId",
                table: "SessionNotes",
                column: "ClientId");

            migrationBuilder.AddForeignKey(
                name: "FK_SessionNotes_Clients_ClientId",
                table: "SessionNotes",
                column: "ClientId",
                principalTable: "Clients",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_SessionNotes_Sessions_SessionId",
                table: "SessionNotes",
                column: "SessionId",
                principalTable: "Sessions",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Templates_TemplatePresets_SourcePresetId",
                table: "Templates",
                column: "SourcePresetId",
                principalTable: "TemplatePresets",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_SessionNotes_Clients_ClientId",
                table: "SessionNotes");

            migrationBuilder.DropForeignKey(
                name: "FK_SessionNotes_Sessions_SessionId",
                table: "SessionNotes");

            migrationBuilder.DropForeignKey(
                name: "FK_Templates_TemplatePresets_SourcePresetId",
                table: "Templates");

            migrationBuilder.DropIndex(
                name: "IX_SessionNotes_ClientId",
                table: "SessionNotes");

            migrationBuilder.DropColumn(
                name: "ClientId",
                table: "SessionNotes");

            migrationBuilder.DropColumn(
                name: "NoteType",
                table: "SessionNotes");

            migrationBuilder.DropColumn(
                name: "Source",
                table: "SessionNotes");

            migrationBuilder.AlterColumn<int>(
                name: "SessionId",
                table: "SessionNotes",
                type: "int",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "int",
                oldNullable: true);

            migrationBuilder.AddForeignKey(
                name: "FK_SessionNotes_Sessions_SessionId",
                table: "SessionNotes",
                column: "SessionId",
                principalTable: "Sessions",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Templates_TemplatePresets_SourcePresetId",
                table: "Templates",
                column: "SourcePresetId",
                principalTable: "TemplatePresets",
                principalColumn: "Id");
        }
    }
}
