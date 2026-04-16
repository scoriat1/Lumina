using Lumina.Infrastructure.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Lumina.Infrastructure.Migrations
{
    [DbContext(typeof(LuminaDbContext))]
    [Migration("20260414131000_AddSessionBillingLinks")]
    public partial class AddSessionBillingLinks : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "ClientPackageId",
                table: "Sessions",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "InvoiceId",
                table: "Sessions",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Sessions_ClientPackageId",
                table: "Sessions",
                column: "ClientPackageId");

            migrationBuilder.CreateIndex(
                name: "IX_Sessions_InvoiceId",
                table: "Sessions",
                column: "InvoiceId");

            migrationBuilder.AddForeignKey(
                name: "FK_Sessions_ClientPackages_ClientPackageId",
                table: "Sessions",
                column: "ClientPackageId",
                principalTable: "ClientPackages",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Sessions_Invoices_InvoiceId",
                table: "Sessions",
                column: "InvoiceId",
                principalTable: "Invoices",
                principalColumn: "Id");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Sessions_ClientPackages_ClientPackageId",
                table: "Sessions");

            migrationBuilder.DropForeignKey(
                name: "FK_Sessions_Invoices_InvoiceId",
                table: "Sessions");

            migrationBuilder.DropIndex(
                name: "IX_Sessions_ClientPackageId",
                table: "Sessions");

            migrationBuilder.DropIndex(
                name: "IX_Sessions_InvoiceId",
                table: "Sessions");

            migrationBuilder.DropColumn(
                name: "ClientPackageId",
                table: "Sessions");

            migrationBuilder.DropColumn(
                name: "InvoiceId",
                table: "Sessions");
        }
    }
}
