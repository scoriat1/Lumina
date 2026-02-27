using Lumina.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Lumina.Infrastructure.Data;

public class LuminaDbContext(DbContextOptions<LuminaDbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();
    public DbSet<Client> Clients => Set<Client>();
    public DbSet<Session> Sessions => Set<Session>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(LuminaDbContext).Assembly);
    }
}