using Lumina.Infrastructure.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Lumina.Infrastructure.Migrations
{
    [DbContext(typeof(LuminaDbContext))]
    [Migration("20260415124500_AddPackageBillingTypeAndUpdateDefaults")]
    public partial class AddPackageBillingTypeAndUpdateDefaults : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "BillingType",
                table: "Packages",
                type: "nvarchar(24)",
                maxLength: 24,
                nullable: false,
                defaultValue: "oneTime");

            migrationBuilder.AlterColumn<decimal>(
                name: "BillingDefaultSessionAmount",
                table: "Practices",
                type: "decimal(18,2)",
                precision: 18,
                scale: 2,
                nullable: false,
                defaultValue: 125m,
                oldClrType: typeof(decimal),
                oldType: "decimal(18,2)",
                oldPrecision: 18,
                oldScale: 2,
                oldDefaultValue: 100m);

            migrationBuilder.Sql("""
                UPDATE Practices
                SET BillingDefaultSessionAmount = 125
                WHERE BillingDefaultSessionAmount = 100
                """);

            migrationBuilder.Sql("""
                UPDATE Packages
                SET BillingType =
                    CASE
                        WHEN Name LIKE '%Month%' THEN 'recurring'
                        ELSE 'oneTime'
                    END
                WHERE BillingType = 'oneTime'
                """);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<decimal>(
                name: "BillingDefaultSessionAmount",
                table: "Practices",
                type: "decimal(18,2)",
                precision: 18,
                scale: 2,
                nullable: false,
                defaultValue: 100m,
                oldClrType: typeof(decimal),
                oldType: "decimal(18,2)",
                oldPrecision: 18,
                oldScale: 2,
                oldDefaultValue: 125m);

            migrationBuilder.DropColumn(
                name: "BillingType",
                table: "Packages");
        }
    }
}
