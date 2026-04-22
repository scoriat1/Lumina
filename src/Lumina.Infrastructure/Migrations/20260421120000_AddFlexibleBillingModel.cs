using System;
using Lumina.Infrastructure.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Lumina.Infrastructure.Migrations
{
    [DbContext(typeof(LuminaDbContext))]
    [Migration("20260421120000_AddFlexibleBillingModel")]
    public partial class AddFlexibleBillingModel : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "BillingModel",
                table: "Clients",
                type: "int",
                nullable: false,
                defaultValue: 1);

            migrationBuilder.AddColumn<decimal>(
                name: "PaymentAmount",
                table: "Sessions",
                type: "decimal(18,2)",
                precision: 18,
                scale: 2,
                nullable: true);

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "PaymentDate",
                table: "Sessions",
                type: "datetimeoffset",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PaymentMethod",
                table: "Sessions",
                type: "nvarchar(80)",
                maxLength: 80,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "PaymentStatus",
                table: "Sessions",
                type: "int",
                nullable: false,
                defaultValue: 1);

            migrationBuilder.AddColumn<decimal>(
                name: "PaymentAmount",
                table: "ClientPackages",
                type: "decimal(18,2)",
                precision: 18,
                scale: 2,
                nullable: true);

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "PaymentDate",
                table: "ClientPackages",
                type: "datetimeoffset",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PaymentMethod",
                table: "ClientPackages",
                type: "nvarchar(80)",
                maxLength: 80,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "PaymentStatus",
                table: "ClientPackages",
                type: "int",
                nullable: false,
                defaultValue: 2);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(name: "BillingModel", table: "Clients");
            migrationBuilder.DropColumn(name: "PaymentAmount", table: "Sessions");
            migrationBuilder.DropColumn(name: "PaymentDate", table: "Sessions");
            migrationBuilder.DropColumn(name: "PaymentMethod", table: "Sessions");
            migrationBuilder.DropColumn(name: "PaymentStatus", table: "Sessions");
            migrationBuilder.DropColumn(name: "PaymentAmount", table: "ClientPackages");
            migrationBuilder.DropColumn(name: "PaymentDate", table: "ClientPackages");
            migrationBuilder.DropColumn(name: "PaymentMethod", table: "ClientPackages");
            migrationBuilder.DropColumn(name: "PaymentStatus", table: "ClientPackages");
        }
    }
}
