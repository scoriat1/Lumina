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
        var now = DateTimeOffset.UtcNow;
        var user = await userManager.FindByEmailAsync(devEmail);

        if (user is null)
        {
            user = new AppUser
            {
                UserName = devEmail,
                Email = devEmail,
                DisplayName = "Dev Provider",
                EmailConfirmed = true
            };

            var result = await userManager.CreateAsync(user, "Dev!23456");
            if (!result.Succeeded)
            {
                throw new InvalidOperationException($"Failed to seed dev user: {string.Join(",", result.Errors.Select(e => e.Description))}");
            }
        }

        var provider = await dbContext.Providers
            .Include(p => p.Practice)
            .FirstOrDefaultAsync(p => p.UserId == user.Id);

        Practice practice;
        if (provider is null)
        {
            practice = new Practice
            {
                Name = "Lumina Dev Practice",
                BillingDefaultSessionAmount = 125m,
                CreatedAt = now
            };
            dbContext.Practices.Add(practice);
            await dbContext.SaveChangesAsync();

            provider = new Provider
            {
                PracticeId = practice.Id,
                UserId = user.Id,
                DisplayName = "Dev Provider",
                Role = ProviderRole.Owner,
                IsActive = true,
                CreatedAt = now
            };

            dbContext.Providers.Add(provider);
            await dbContext.SaveChangesAsync();
        }
        else
        {
            practice = provider.Practice;
        }

        practice.BillingDefaultSessionAmount = 125m;
        if (practice.BillingDefaultDueDays <= 0)
        {
            practice.BillingDefaultDueDays = 30;
        }

        var clients = await EnsureDevClientsAsync(dbContext, practice.Id);
        var packages = await EnsureDefaultPackagesAsync(dbContext, practice.Id);
        var clientPackages = await EnsureDefaultClientPackagesAsync(dbContext, practice.Id, clients, packages, now);
        var invoices = await EnsureDefaultInvoicesAsync(dbContext, practice.Id, clients, now);
        await EnsureDefaultSessionsAsync(dbContext, practice.Id, provider.Id, clients, clientPackages, invoices, now);

        var presetDefinitions = new (string Name, string Description, string Category, string[] Fields)[] 
        {
            ("Professional Coach", "General coaching framework", "Coaching", new[] { "Arrival State", "Intention", "Process", "Closing State / Takeaway", "Commitment" }),
            ("Speech/Physical Therapist", "Therapy progress framework", "Therapy", new[] { "Exercises Completed", "Progress Assessment", "Challenges Observed", "Homework Assigned", "Parent/Caregiver Notes" }),
            ("Nutritionist/Dietitian", "Nutrition session template", "Nutrition", new[] { "Meals Reviewed", "Weight & Measurements", "Supplements Discussed", "Dietary Changes", "Next Steps" }),
            ("Music Teacher", "Music lesson format", "Education", new[] { "Pieces Practiced", "Technique Focus", "Theory Covered", "Practice Assignment", "Performance Notes" }),
            ("Swim Instructor", "Swimming lesson format", "Sports", new[] { "Strokes Practiced", "Breathing Exercises", "Skills Mastered", "Areas for Improvement", "Goals for Next Session" }),
            ("Academic Tutor", "Tutoring session format", "Education", new[] { "Topics Covered", "Comprehension Level", "Homework Review", "Study Strategies", "Upcoming Tests/Projects" })
        };

        var hasTemplatePresets = await dbContext.TemplatePresets.AnyAsync();
        if (!hasTemplatePresets)
        {
            var templatePresets = presetDefinitions.Select(def => new TemplatePreset
            {
                Name = def.Name,
                Description = def.Description,
                Category = def.Category,
                IsActive = true,
                Fields = def.Fields.Select((label, index) => new TemplatePresetField { Label = label, SortOrder = index + 1 }).ToList()
            }).ToList();

            dbContext.TemplatePresets.AddRange(templatePresets);
            await dbContext.SaveChangesAsync();
        }
    }

    private static async Task<Client[]> EnsureDevClientsAsync(LuminaDbContext dbContext, int practiceId)
    {
        var existingClients = await dbContext.Clients
            .Where(c => c.PracticeId == practiceId)
            .OrderBy(c => c.Id)
            .ToListAsync();

        if (existingClients.Count > 0)
        {
            return existingClients.ToArray();
        }

        var clients = new[]
        {
            new Client { PracticeId = practiceId, Name = "Alex Thompson", Email = "alex@example.com", Phone = "(555) 123-4567", Program = "Executive Leadership", StartDate = DateOnly.FromDateTime(DateTime.UtcNow.AddMonths(-2)), Status = ClientStatus.Active },
            new Client { PracticeId = practiceId, Name = "Taylor Chen", Email = "taylor@example.com", Phone = "(555) 987-6543", Program = "Career Transition", StartDate = DateOnly.FromDateTime(DateTime.UtcNow.AddMonths(-1)), Status = ClientStatus.Active },
            new Client { PracticeId = practiceId, Name = "Jamie Patel", Email = "jamie@example.com", Phone = "(555) 444-2211", Program = "Wellness", StartDate = DateOnly.FromDateTime(DateTime.UtcNow.AddMonths(-3)), Status = ClientStatus.Paused }
        };

        dbContext.Clients.AddRange(clients);
        await dbContext.SaveChangesAsync();
        return clients;
    }

    private static async Task<Package[]> EnsureDefaultPackagesAsync(LuminaDbContext dbContext, int practiceId)
    {
        var existingPackages = await dbContext.Packages
            .Where(p => p.PracticeId == practiceId)
            .OrderBy(p => p.Id)
            .ToListAsync();

        if (existingPackages.Count == 0)
        {
            var packages = new[]
            {
                new Package { PracticeId = practiceId, Name = "4-Session Package", BillingType = "oneTime", SessionCount = 4, Price = 450m, IsActive = true },
                new Package { PracticeId = practiceId, Name = "3-Month Package", BillingType = "recurring", SessionCount = 12, Price = 1350m, IsActive = true }
            };

            dbContext.Packages.AddRange(packages);
            await dbContext.SaveChangesAsync();
            return packages;
        }

        return existingPackages.ToArray();
    }

    private static async Task<ClientPackage[]> EnsureDefaultClientPackagesAsync(
        LuminaDbContext dbContext,
        int practiceId,
        IReadOnlyList<Client> clients,
        IReadOnlyList<Package> packages,
        DateTimeOffset now)
    {
        var existingClientPackages = await dbContext.ClientPackages
            .Where(cp => cp.PracticeId == practiceId)
            .OrderBy(cp => cp.Id)
            .ToListAsync();

        if (existingClientPackages.Count > 0 || clients.Count < 3 || packages.Count < 2)
        {
            return existingClientPackages.ToArray();
        }

        var clientPackages = new[]
        {
            new ClientPackage { PracticeId = practiceId, ClientId = clients[0].Id, PackageId = packages[0].Id, PurchasedAt = now.AddDays(-21), RemainingSessions = 3 },
            new ClientPackage { PracticeId = practiceId, ClientId = clients[2].Id, PackageId = packages[1].Id, PurchasedAt = now.AddDays(-30), RemainingSessions = 11 }
        };

        dbContext.ClientPackages.AddRange(clientPackages);
        await dbContext.SaveChangesAsync();
        return clientPackages;
    }

    private static async Task<Invoice[]> EnsureDefaultInvoicesAsync(
        LuminaDbContext dbContext,
        int practiceId,
        IReadOnlyList<Client> clients,
        DateTimeOffset now)
    {
        var existingInvoices = await dbContext.Invoices
            .Where(i => i.PracticeId == practiceId)
            .OrderBy(i => i.Id)
            .ToListAsync();

        if (existingInvoices.Count > 0 || clients.Count < 3)
        {
            return existingInvoices.ToArray();
        }

        var invoices = new[]
        {
            new Invoice { PracticeId = practiceId, ClientId = clients[0].Id, InvoiceNumber = "INV-2026-001", Description = "Executive Leadership sessions", Amount = 600m, DueDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(-8)), Status = InvoiceStatus.Paid, CreatedAt = now.AddDays(-15) },
            new Invoice { PracticeId = practiceId, ClientId = clients[1].Id, InvoiceNumber = "INV-2026-002", Description = "Career Transition sessions", Amount = 450m, DueDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(7)), Status = InvoiceStatus.Pending, CreatedAt = now.AddDays(-5) },
            new Invoice { PracticeId = practiceId, ClientId = clients[2].Id, InvoiceNumber = "INV-2026-003", Description = "Wellness program", Amount = 300m, DueDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(-2)), Status = InvoiceStatus.Overdue, CreatedAt = now.AddDays(-12) }
        };

        dbContext.Invoices.AddRange(invoices);
        await dbContext.SaveChangesAsync();
        return invoices;
    }

    private static async Task EnsureDefaultSessionsAsync(
        LuminaDbContext dbContext,
        int practiceId,
        int providerId,
        IReadOnlyList<Client> clients,
        IReadOnlyList<ClientPackage> clientPackages,
        IReadOnlyList<Invoice> invoices,
        DateTimeOffset now)
    {
        var hasSessions = await dbContext.Sessions.AnyAsync(s => s.PracticeId == practiceId);
        if (hasSessions || clients.Count < 3 || clientPackages.Count < 2 || invoices.Count < 2)
        {
            return;
        }

        var sessions = new[]
        {
            new Session { PracticeId = practiceId, ProviderId = providerId, ClientId = clients[0].Id, ClientPackageId = clientPackages[0].Id, Date = now.AddDays(-10), Duration = 60, Location = SessionLocation.Zoom, Status = SessionStatus.Completed, SessionType = "Follow-up", Focus = "Leadership communication" },
            new Session { PracticeId = practiceId, ProviderId = providerId, ClientId = clients[0].Id, InvoiceId = invoices[0].Id, Date = now.AddDays(2), Duration = 60, Location = SessionLocation.Zoom, Status = SessionStatus.Upcoming, SessionType = "Planning", Focus = "Quarter goals" },
            new Session { PracticeId = practiceId, ProviderId = providerId, ClientId = clients[1].Id, InvoiceId = invoices[1].Id, Date = now.AddDays(4), Duration = 45, Location = SessionLocation.Phone, Status = SessionStatus.Upcoming, SessionType = "Coaching", Focus = "Interview prep" },
            new Session { PracticeId = practiceId, ProviderId = providerId, ClientId = clients[2].Id, ClientPackageId = clientPackages[1].Id, Date = now.AddDays(-4), Duration = 60, Location = SessionLocation.Office, Status = SessionStatus.Completed, SessionType = "Check-in", Focus = "Progress review" }
        };

        dbContext.Sessions.AddRange(sessions);
        await dbContext.SaveChangesAsync();
    }
}
