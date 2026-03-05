using Lumina.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Lumina.Infrastructure.Data.Configurations;

public class TemplatePresetConfiguration : IEntityTypeConfiguration<TemplatePreset>
{
    public void Configure(EntityTypeBuilder<TemplatePreset> builder)
    {
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Id).ValueGeneratedOnAdd().UseIdentityColumn();
        builder.Property(x => x.Name).HasMaxLength(150).IsRequired();
        builder.Property(x => x.Description).HasMaxLength(500).IsRequired();
        builder.Property(x => x.Category).HasMaxLength(100).IsRequired();

        builder.HasMany(x => x.Fields)
            .WithOne(x => x.TemplatePreset)
            .HasForeignKey(x => x.TemplatePresetId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public class TemplatePresetFieldConfiguration : IEntityTypeConfiguration<TemplatePresetField>
{
    public void Configure(EntityTypeBuilder<TemplatePresetField> builder)
    {
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Id).ValueGeneratedOnAdd().UseIdentityColumn();
        builder.Property(x => x.Label).HasMaxLength(200).IsRequired();
        builder.Property(x => x.FieldType).HasMaxLength(50);
        builder.HasIndex(x => new { x.TemplatePresetId, x.SortOrder });
    }
}

public class TemplateConfiguration : IEntityTypeConfiguration<Template>
{
    public void Configure(EntityTypeBuilder<Template> builder)
    {
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Id).ValueGeneratedOnAdd().UseIdentityColumn();
        builder.Property(x => x.Name).HasMaxLength(150).IsRequired();
        builder.Property(x => x.Description).HasMaxLength(500).IsRequired();
        builder.HasIndex(x => new { x.PracticeId, x.Name });

        builder.HasOne(x => x.Practice)
            .WithMany(x => x.Templates)
            .HasForeignKey(x => x.PracticeId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(x => x.Fields)
            .WithOne(x => x.Template)
            .HasForeignKey(x => x.TemplateId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(x => x.SourcePreset)
            .WithMany()
            .HasForeignKey(x => x.SourcePresetId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}

public class TemplateFieldConfiguration : IEntityTypeConfiguration<TemplateField>
{
    public void Configure(EntityTypeBuilder<TemplateField> builder)
    {
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Id).ValueGeneratedOnAdd().UseIdentityColumn();
        builder.Property(x => x.Label).HasMaxLength(200).IsRequired();
        builder.Property(x => x.FieldType).HasMaxLength(50);
        builder.HasIndex(x => new { x.TemplateId, x.SortOrder });
    }
}
