using Lumina.Domain.Entities;
using Lumina.Domain.Enums;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace Lumina.Infrastructure.Data;

public static class DbInitializer
{
    public static async Task SeedAsync(LuminaDbContext dbContext, UserManager<AppUser> userManager, bool enabled)
    {
        if (!enabled) return;

        const string devEmail = "dev@lumina.local";
        if (await userManager.FindByEmailAsync(devEmail) is not null) return;

        var now = DateTimeOffset.UtcNow;
        var practice = new Practice
        {
            Id = Guid.Parse("aaaa1111-1111-1111-1111-111111111111"),
            Name = "Lumina Dev Practice",
            CreatedAt = now
        };

        var user = new AppUser
        {
            Id = Guid.Parse("bbbb1111-1111-1111-1111-111111111111"),
            UserName = devEmail,
            Email = devEmail,
            DisplayName = "Dev Provider",
            EmailConfirmed = true
        };

        dbContext.Practices.Add(practice);
        var result = await userManager.CreateAsync(user, "Dev!23456");
        if (!result.Succeeded)
        {
            throw new InvalidOperationException($"Failed to seed dev user: {string.Join(",", result.Errors.Select(e => e.Description))}");
        }

        var provider = new Provider
        {
            Id = Guid.Parse("cccc1111-1111-1111-1111-111111111111"),
            PracticeId = practice.Id,
            UserId = user.Id,
            DisplayName = "Dev Provider",
            Role = ProviderRole.Owner,
            IsActive = true,
            CreatedAt = now
        };

        var clients = new[]
        {
            new Client { Id = Guid.NewGuid(), PracticeId = practice.Id, Name = "Alex Thompson", Email = "alex@example.com", Phone = "(555) 123-4567", Program = "Executive Leadership", AvatarColor = "#9B8B9E", StartDate = DateOnly.FromDateTime(DateTime.UtcNow.AddMonths(-2)), Status = ClientStatus.Active },
            new Client { Id = Guid.NewGuid(), PracticeId = practice.Id, Name = "Taylor Chen", Email = "taylor@example.com", Phone = "(555) 987-6543", Program = "Career Transition", AvatarColor = "#A8B5A0", StartDate = DateOnly.FromDateTime(DateTime.UtcNow.AddMonths(-1)), Status = ClientStatus.Active },
            new Client { Id = Guid.NewGuid(), PracticeId = practice.Id, Name = "Jamie Patel", Email = "jamie@example.com", Phone = "(555) 444-2211", Program = "Wellness", AvatarColor = "#9DAAB5", StartDate = DateOnly.FromDateTime(DateTime.UtcNow.AddMonths(-3)), Status = ClientStatus.Paused }
        };

        var sessions = new[]
        {
            new Session { Id = Guid.NewGuid(), PracticeId = practice.Id, ProviderId = provider.Id, ClientId = clients[0].Id, Date = now.AddDays(-10), Duration = 60, Location = SessionLocation.Zoom, Status = SessionStatus.Completed, SessionType = "Follow-up", Focus = "Leadership communication" },
            new Session { Id = Guid.NewGuid(), PracticeId = practice.Id, ProviderId = provider.Id, ClientId = clients[0].Id, Date = now.AddDays(2), Duration = 60, Location = SessionLocation.Zoom, Status = SessionStatus.Upcoming, SessionType = "Planning", Focus = "Quarter goals" },
            new Session { Id = Guid.NewGuid(), PracticeId = practice.Id, ProviderId = provider.Id, ClientId = clients[1].Id, Date = now.AddDays(4), Duration = 45, Location = SessionLocation.Phone, Status = SessionStatus.Upcoming, SessionType = "Coaching", Focus = "Interview prep" },
            new Session { Id = Guid.NewGuid(), PracticeId = practice.Id, ProviderId = provider.Id, ClientId = clients[2].Id, Date = now.AddDays(-4), Duration = 60, Location = SessionLocation.Office, Status = SessionStatus.Completed, SessionType = "Check-in", Focus = "Progress review" }
        };

        var presetDefinitions = new (string Name, string Description, string Category, string[] Fields)[]
        {
            ("Professional Coach", "General coaching framework", "Coaching", new[] { "Arrival State", "Intention", "Process", "Closing State / Takeaway", "Commitment" }),
            ("Speech/Physical Therapist", "Therapy progress framework", "Therapy", new[] { "Exercises Completed", "Progress Assessment", "Challenges Observed", "Homework Assigned", "Parent/Caregiver Notes" }),
            ("Nutritionist/Dietitian", "Nutrition session template", "Nutrition", new[] { "Meals Reviewed", "Weight & Measurements", "Supplements Discussed", "Dietary Changes", "Next Steps" }),
            ("Music Teacher", "Music lesson format", "Education", new[] { "Pieces Practiced", "Technique Focus", "Theory Covered", "Practice Assignment", "Performance Notes" }),
            ("Swim Instructor", "Swimming lesson format", "Sports", new[] { "Strokes Practiced", "Breathing Exercises", "Skills Mastered", "Areas for Improvement", "Goals for Next Session" }),
            ("Academic Tutor", "Tutoring session format", "Education", new[] { "Topics Covered", "Comprehension Level", "Homework Review", "Study Strategies", "Upcoming Tests/Projects" })
        };

        var templatePresets = presetDefinitions.Select(def => new TemplatePreset
        {
            Id = Guid.NewGuid(),
            Name = def.Name,
            Description = def.Description,
            Category = def.Category,
            IsActive = true,
            Fields = def.Fields.Select((label, index) => new TemplatePresetField { Id = Guid.NewGuid(), Label = label, SortOrder = index + 1 }).ToList()
        }).ToList();

        var invoices = new[]
        {
            new Invoice { Id = Guid.NewGuid(), PracticeId = practice.Id, ClientId = clients[0].Id, InvoiceNumber = "INV-2026-001", Description = "Executive Leadership sessions", Amount = 600m, DueDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(-8)), Status = InvoiceStatus.Paid, CreatedAt = now.AddDays(-15) },
            new Invoice { Id = Guid.NewGuid(), PracticeId = practice.Id, ClientId = clients[1].Id, InvoiceNumber = "INV-2026-002", Description = "Career Transition sessions", Amount = 450m, DueDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(7)), Status = InvoiceStatus.Pending, CreatedAt = now.AddDays(-5) },
            new Invoice { Id = Guid.NewGuid(), PracticeId = practice.Id, ClientId = clients[2].Id, InvoiceNumber = "INV-2026-003", Description = "Wellness program", Amount = 300m, DueDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(-2)), Status = InvoiceStatus.Overdue, CreatedAt = now.AddDays(-12) }
        };

        dbContext.Providers.Add(provider);
        dbContext.Clients.AddRange(clients);
        dbContext.Sessions.AddRange(sessions);
        dbContext.TemplatePresets.AddRange(templatePresets);
        dbContext.Invoices.AddRange(invoices);

        await dbContext.SaveChangesAsync();
    }
}
