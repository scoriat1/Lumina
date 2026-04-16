using Lumina.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Lumina.Infrastructure.Data.Configurations;

public class PracticeConfiguration : IEntityTypeConfiguration<Practice>
{
    public void Configure(EntityTypeBuilder<Practice> builder)
    {
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Id).ValueGeneratedOnAdd().UseIdentityColumn();
        builder.Property(x => x.Name).HasMaxLength(200).IsRequired();
        builder.Property(x => x.BillingDefaultDueDays).HasDefaultValue(30).IsRequired();
        builder.Property(x => x.BillingDefaultSessionAmount).HasPrecision(18, 2).HasDefaultValue(125m).IsRequired();
        builder.Property(x => x.NotesTemplateMode).HasMaxLength(32).HasDefaultValue("default").IsRequired();
        builder.Property(x => x.NotesSelectedTemplateKind).HasMaxLength(16);
    }
}
