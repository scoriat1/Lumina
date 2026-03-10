using Lumina.Infrastructure.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Lumina.Infrastructure.Migrations;

[DbContext(typeof(LuminaDbContext))]
[Migration("20260310120000_ExtendSessionNoteForTimeline")]
public partial class ExtendSessionNoteForTimeline : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropForeignKey(
            name: "FK_SessionNotes_Sessions_SessionId",
            table: "SessionNotes");

        migrationBuilder.DropForeignKey(
            name: "FK_SessionNotes_Templates_TemplateId",
            table: "SessionNotes");

        migrationBuilder.AddColumn<int>(
            name: "ClientId",
            table: "SessionNotes",
            type: "int",
            nullable: true);

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

        migrationBuilder.AlterColumn<int>(
            name: "SessionId",
            table: "SessionNotes",
            type: "int",
            nullable: true,
            oldClrType: typeof(int),
            oldType: "int");

        migrationBuilder.Sql("""
            UPDATE sn
            SET sn.ClientId = s.ClientId
            FROM SessionNotes sn
            INNER JOIN Sessions s ON s.Id = sn.SessionId
            """);

        migrationBuilder.AlterColumn<int>(
            name: "ClientId",
            table: "SessionNotes",
            type: "int",
            nullable: false,
            oldClrType: typeof(int),
            oldType: "int",
            oldNullable: true);

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
            name: "FK_SessionNotes_Templates_TemplateId",
            table: "SessionNotes",
            column: "TemplateId",
            principalTable: "Templates",
            principalColumn: "Id",
            onDelete: ReferentialAction.SetNull);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropForeignKey(
            name: "FK_SessionNotes_Clients_ClientId",
            table: "SessionNotes");

        migrationBuilder.DropForeignKey(
            name: "FK_SessionNotes_Sessions_SessionId",
            table: "SessionNotes");

        migrationBuilder.DropForeignKey(
            name: "FK_SessionNotes_Templates_TemplateId",
            table: "SessionNotes");

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
            name: "FK_SessionNotes_Templates_TemplateId",
            table: "SessionNotes",
            column: "TemplateId",
            principalTable: "Templates",
            principalColumn: "Id");
    }
}
