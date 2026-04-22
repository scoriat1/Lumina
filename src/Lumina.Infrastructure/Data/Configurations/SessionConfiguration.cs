using Lumina.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Lumina.Infrastructure.Data.Configurations;

public class SessionConfiguration : IEntityTypeConfiguration<Session>
{
    public void Configure(EntityTypeBuilder<Session> builder)
    {
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Id).ValueGeneratedOnAdd().UseIdentityColumn();
        builder.Property(x => x.SessionType).HasMaxLength(150).IsRequired();
        builder.Property(x => x.Focus).HasMaxLength(500).IsRequired();
        builder.Property(x => x.PaymentAmount).HasPrecision(18, 2);
        builder.Property(x => x.PaymentStatus).HasDefaultValue(Lumina.Domain.Enums.PaymentStatus.Unpaid).IsRequired();
        builder.Property(x => x.PaymentMethod).HasMaxLength(80);
        builder.HasOne(x => x.Client).WithMany(x => x.Sessions).HasForeignKey(x => x.ClientId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(x => x.Provider).WithMany().HasForeignKey(x => x.ProviderId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(x => x.ClientPackage).WithMany(x => x.Sessions).HasForeignKey(x => x.ClientPackageId).OnDelete(DeleteBehavior.NoAction);
        builder.HasOne(x => x.Invoice).WithMany(x => x.Sessions).HasForeignKey(x => x.InvoiceId).OnDelete(DeleteBehavior.NoAction);
        builder.HasIndex(x => new { x.PracticeId, x.Date });
        builder.HasIndex(x => x.ClientPackageId);
        builder.HasIndex(x => x.InvoiceId);
    }
}
