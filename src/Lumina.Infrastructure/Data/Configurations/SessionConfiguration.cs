using Lumina.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Lumina.Infrastructure.Data.Configurations;

public class SessionConfiguration : IEntityTypeConfiguration<Session>
{
    public void Configure(EntityTypeBuilder<Session> builder)
    {
        builder.HasKey(x => x.Id);
        builder.Property(x => x.SessionType).HasMaxLength(150).IsRequired();
        builder.Property(x => x.Focus).HasMaxLength(500).IsRequired();
        builder.Property(x => x.Payment).HasMaxLength(50).IsRequired();
        builder.HasOne(x => x.Client)
            .WithMany(x => x.Sessions)
            .HasForeignKey(x => x.ClientId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
