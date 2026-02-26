using Lumina.Domain.Entities;
using Lumina.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace Lumina.Infrastructure.Data;

public static class DbInitializer
{
    public static async Task SeedAsync(LuminaDbContext dbContext)
    {
        await dbContext.Database.MigrateAsync();

        if (await dbContext.Users.AnyAsync()) return;

        var devUser = new User
        {
            Id = Guid.Parse("11111111-aaaa-4444-bbbb-cccccccccccc"),
            Name = "Dev Coach",
            Email = "dev@lumina.local"
        };

        var client = new Client
        {
            Id = Guid.Parse("22222222-aaaa-4444-bbbb-cccccccccccc"),
            UserId = devUser.Id,
            Name = "Alex Thompson",
            Email = "alex.thompson@example.com",
            Phone = "(555) 123-4567",
            Program = "Executive Leadership",
            AvatarColor = "#9B8B9E",
            StartDate = DateOnly.FromDateTime(DateTime.UtcNow.AddMonths(-2)),
            Status = ClientStatus.Active,
            Notes = "Seeded development client"
        };

        var session = new Session
        {
            Id = Guid.Parse("33333333-aaaa-4444-bbbb-cccccccccccc"),
            ClientId = client.Id,
            Date = DateTimeOffset.UtcNow.AddDays(2),
            Duration = 60,
            Location = SessionLocation.Zoom,
            Status = SessionStatus.Upcoming,
            SessionType = "Follow-up Session",
            Focus = "Leadership planning",
            Payment = "paid",
            PaymentStatus = "paid",
            BillingSource = "pay-per-session"
        };

        dbContext.Users.Add(devUser);
        dbContext.Clients.Add(client);
        dbContext.Sessions.Add(session);
        await dbContext.SaveChangesAsync();
    }
}
