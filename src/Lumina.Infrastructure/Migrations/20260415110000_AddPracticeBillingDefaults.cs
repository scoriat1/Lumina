using Lumina.Infrastructure.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Lumina.Infrastructure.Migrations
{
    [DbContext(typeof(LuminaDbContext))]
    [Migration("20260415110000_AddPracticeBillingDefaults")]
    public partial class AddPracticeBillingDefaults : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "BillingDefaultDueDays",
                table: "Practices",
                type: "int",
                nullable: false,
                defaultValue: 30);

            migrationBuilder.AddColumn<decimal>(
                name: "BillingDefaultSessionAmount",
                table: "Practices",
                type: "decimal(18,2)",
                precision: 18,
                scale: 2,
                nullable: false,
                defaultValue: 100m);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "BillingDefaultDueDays",
                table: "Practices");

            migrationBuilder.DropColumn(
                name: "BillingDefaultSessionAmount",
                table: "Practices");
        }
    }
}
