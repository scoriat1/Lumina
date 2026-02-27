using Lumina.Domain.Entities;
using Lumina.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace Lumina.Infrastructure.Data;

public static class DbInitializer
{
    /// <summary>
    /// Seeds DEV-ONLY data. Does NOT run migrations.
    /// Caller should gate this with environment + config.
    /// </summary>
    public static async Task SeedAsync(LuminaDbContext dbContext, bool enabled)
    {
        if (!enabled) return;

        // Idempotency guard: if dev user exists, do nothing
        var devEmail = "dev@lumina.local";
        if (await dbContext.Users.AnyAsync(u => u.Email == devEmail)) return;

        var devUserId = Guid.Parse("11111111-aaaa-4444-bbbb-cccccccccccc");
        var clientId = Guid.Parse("22222222-aaaa-4444-bbbb-cccccccccccc");
        var sessionId = Guid.Parse("33333333-aaaa-4444-bbbb-cccccccccccc");

        var devUser = new User
        {
            Id = devUserId,
            Name = "Dev Coach",
            Email = devEmail
        };

        var client = new Client
        {
            Id = clientId,
            UserId = devUserId,
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
            Id = sessionId,
            ClientId = clientId,
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