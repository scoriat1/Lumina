using Lumina.Domain.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace Lumina.Infrastructure.Data;

public class LuminaDbContext(DbContextOptions<LuminaDbContext> options)
    : IdentityDbContext<AppUser, IdentityRole<Guid>, Guid>(options)
{
    public DbSet<Practice> Practices => Set<Practice>();
    public DbSet<Provider> Providers => Set<Provider>();
    public DbSet<Client> Clients => Set<Client>();
    public DbSet<Session> Sessions => Set<Session>();
    public DbSet<TemplatePreset> TemplatePresets => Set<TemplatePreset>();
    public DbSet<TemplatePresetField> TemplatePresetFields => Set<TemplatePresetField>();
    public DbSet<Template> Templates => Set<Template>();
    public DbSet<TemplateField> TemplateFields => Set<TemplateField>();
    public DbSet<SessionNote> SessionNotes => Set<SessionNote>();
    public DbSet<Invoice> Invoices => Set<Invoice>();
    public DbSet<Package> Packages => Set<Package>();
    public DbSet<ClientPackage> ClientPackages => Set<ClientPackage>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(LuminaDbContext).Assembly);
    }
}
