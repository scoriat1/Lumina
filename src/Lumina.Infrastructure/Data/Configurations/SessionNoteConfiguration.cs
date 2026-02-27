using Lumina.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Lumina.Infrastructure.Data.Configurations;

public class SessionNoteConfiguration : IEntityTypeConfiguration<SessionNote>
{
    public void Configure(EntityTypeBuilder<SessionNote> builder)
    {
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Content).IsRequired();
    }
}
