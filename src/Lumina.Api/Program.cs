using Lumina.Domain.Entities;
using Lumina.Domain.Enums;
using Lumina.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<LuminaDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("LuminaDb")));

builder.Services.AddCors(options =>
{
    options.AddPolicy("client", policy =>
        policy.AllowAnyHeader().AllowAnyMethod().AllowAnyOrigin());
});

var app = builder.Build();

app.UseCors("client");

app.MapGet("/health", () => Results.Ok(new { status = "ok" }));

app.MapGet("/api/clients", async (LuminaDbContext db) =>
{
    var clients = await db.Clients
        .Include(c => c.Sessions)
        .OrderBy(c => c.Name)
        .Select(c => new
        {
            id = c.Id,
            name = c.Name,
            initials = string.Join(string.Empty, c.Name.Split(' ', StringSplitOptions.RemoveEmptyEntries).Take(2).Select(n => n[0])).ToUpperInvariant(),
            avatarColor = c.AvatarColor,
            program = c.Program,
            progress = c.Sessions.Count == 0 ? 0 : Math.Min(100, c.Sessions.Count * 10),
            sessionsCompleted = c.Sessions.Count(s => s.Status == SessionStatus.Completed),
            totalSessions = Math.Max(1, c.Sessions.Count),
            nextSession = c.Sessions.Where(s => s.Date >= DateTimeOffset.UtcNow).OrderBy(s => s.Date).Select(s => s.Date.ToString("MMM d, h:mm tt")).FirstOrDefault(),
            status = c.Status.ToString().ToLowerInvariant(),
            email = c.Email,
            phone = c.Phone,
            startDate = c.StartDate.ToString("MMM d, yyyy"),
            notes = c.Notes
        })
        .ToListAsync();

    return Results.Ok(clients);
});

app.MapGet("/api/clients/{id:guid}", async (Guid id, LuminaDbContext db) =>
{
    var client = await db.Clients.Where(c => c.Id == id).Select(c => new
    {
        id = c.Id,
        name = c.Name,
        initials = string.Join(string.Empty, c.Name.Split(' ', StringSplitOptions.RemoveEmptyEntries).Take(2).Select(n => n[0])).ToUpperInvariant(),
        avatarColor = c.AvatarColor,
        program = c.Program,
        progress = 50,
        sessionsCompleted = c.Sessions.Count(s => s.Status == SessionStatus.Completed),
        totalSessions = Math.Max(1, c.Sessions.Count),
        nextSession = c.Sessions.Where(s => s.Date >= DateTimeOffset.UtcNow).OrderBy(s => s.Date).Select(s => s.Date.ToString("MMM d, h:mm tt")).FirstOrDefault(),
        status = c.Status.ToString().ToLowerInvariant(),
        email = c.Email,
        phone = c.Phone,
        startDate = c.StartDate.ToString("MMM d, yyyy"),
        notes = c.Notes
    }).FirstOrDefaultAsync();

    return client is null ? Results.NotFound() : Results.Ok(client);
});

app.MapGet("/api/sessions", async (LuminaDbContext db) =>
{
    var sessions = await db.Sessions.Include(s => s.Client).OrderBy(s => s.Date).Select(s => new
    {
        id = s.Id,
        clientId = s.ClientId,
        client = s.Client.Name,
        initials = string.Join(string.Empty, s.Client.Name.Split(' ', StringSplitOptions.RemoveEmptyEntries).Take(2).Select(n => n[0])).ToUpperInvariant(),
        avatarColor = s.Client.AvatarColor,
        sessionType = s.SessionType,
        date = s.Date,
        duration = s.Duration,
        location = s.Location.ToString().ToLowerInvariant(),
        status = s.Status.ToString().ToLowerInvariant(),
        payment = s.Payment,
        paymentStatus = s.PaymentStatus,
        billingSource = s.BillingSource,
        packageRemaining = s.PackageRemaining,
        focus = s.Focus,
        notes = s.Notes,
        isRecurring = false,
        recurringType = (string?)null
    }).ToListAsync();

    return Results.Ok(sessions);
});

app.MapGet("/api/sessions/{id:guid}", async (Guid id, LuminaDbContext db) =>
{
    var session = await db.Sessions.Include(s => s.Client).Where(s => s.Id == id).Select(s => new
    {
        id = s.Id,
        clientId = s.ClientId,
        client = s.Client.Name,
        initials = string.Join(string.Empty, s.Client.Name.Split(' ', StringSplitOptions.RemoveEmptyEntries).Take(2).Select(n => n[0])).ToUpperInvariant(),
        avatarColor = s.Client.AvatarColor,
        sessionType = s.SessionType,
        date = s.Date,
        duration = s.Duration,
        location = s.Location.ToString().ToLowerInvariant(),
        status = s.Status.ToString().ToLowerInvariant(),
        payment = s.Payment,
        paymentStatus = s.PaymentStatus,
        billingSource = s.BillingSource,
        packageRemaining = s.PackageRemaining,
        focus = s.Focus,
        notes = s.Notes
    }).FirstOrDefaultAsync();

    return session is null ? Results.NotFound() : Results.Ok(session);
});

app.MapPut("/api/sessions/{id:guid}", async (Guid id, SessionUpdateRequest request, LuminaDbContext db) =>
{
    var session = await db.Sessions.FirstOrDefaultAsync(x => x.Id == id);
    if (session is null) return Results.NotFound();

    if (request.Date is not null) session.Date = request.Date.Value;
    if (!string.IsNullOrWhiteSpace(request.SessionType)) session.SessionType = request.SessionType;
    if (!string.IsNullOrWhiteSpace(request.Focus)) session.Focus = request.Focus;

    await db.SaveChangesAsync();
    return Results.Ok();
});

app.MapPost("/api/sessions", async (SessionCreateRequest request, LuminaDbContext db) =>
{
    var session = new Session
    {
        Id = Guid.NewGuid(),
        ClientId = request.ClientId,
        Date = request.Date,
        Duration = request.Duration,
        SessionType = request.SessionType,
        Focus = request.Focus,
        Payment = request.Payment,
        Status = SessionStatus.Upcoming,
        Location = SessionLocation.Zoom
    };

    db.Sessions.Add(session);
    await db.SaveChangesAsync();
    return Results.Ok(session);
});

app.MapGet("/api/dashboard", async (LuminaDbContext db) =>
{
    var activeClients = await db.Clients.CountAsync(c => c.Status == ClientStatus.Active);
    var monthStart = new DateTimeOffset(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1, 0, 0, 0, TimeSpan.Zero);
    var sessionsThisMonth = await db.Sessions.CountAsync(s => s.Date >= monthStart);
    var revenueMtd = await db.Sessions.CountAsync(s => s.Date >= monthStart) * 150;
    var upcomingSessions = await db.Sessions.Include(s => s.Client).Where(s => s.Date >= DateTimeOffset.UtcNow).OrderBy(s => s.Date).Take(4).Select(s => new
    {
        id = s.Id,
        clientId = s.ClientId,
        client = s.Client.Name,
        initials = string.Join(string.Empty, s.Client.Name.Split(' ', StringSplitOptions.RemoveEmptyEntries).Take(2).Select(n => n[0])).ToUpperInvariant(),
        avatarColor = s.Client.AvatarColor,
        sessionType = s.SessionType,
        date = s.Date,
        duration = s.Duration,
        location = s.Location.ToString().ToLowerInvariant(),
        status = s.Status.ToString().ToLowerInvariant(),
        payment = s.Payment,
        focus = s.Focus
    }).ToListAsync();

    var clients = await db.Clients.Include(c => c.Sessions).Where(c => c.Status == ClientStatus.Active).Take(4).Select(c => new
    {
        id = c.Id,
        name = c.Name,
        initials = string.Join(string.Empty, c.Name.Split(' ', StringSplitOptions.RemoveEmptyEntries).Take(2).Select(n => n[0])).ToUpperInvariant(),
        avatarColor = c.AvatarColor,
        program = c.Program,
        progress = c.Sessions.Count == 0 ? 0 : Math.Min(100, c.Sessions.Count * 10),
        sessionsCompleted = c.Sessions.Count(s => s.Status == SessionStatus.Completed),
        totalSessions = Math.Max(1, c.Sessions.Count),
        nextSession = c.Sessions.Where(s => s.Date >= DateTimeOffset.UtcNow).OrderBy(s => s.Date).Select(s => s.Date.ToString("MMM d, h:mm tt")).FirstOrDefault(),
        status = c.Status.ToString().ToLowerInvariant(),
        email = c.Email,
        phone = c.Phone,
        startDate = c.StartDate.ToString("MMM d, yyyy"),
        notes = c.Notes
    }).ToListAsync();

    return Results.Ok(new { activeClients, sessionsThisMonth, revenueMtd, calendarFilledPercent = 15, upcomingSessions, activeClientPreview = clients });
});

using var scope = app.Services.CreateScope();
var dbContext = scope.ServiceProvider.GetRequiredService<LuminaDbContext>();
await DbInitializer.SeedAsync(dbContext);

app.Run();

public record SessionUpdateRequest(DateTimeOffset? Date, string? SessionType, string? Focus);
public record SessionCreateRequest(Guid ClientId, DateTimeOffset Date, int Duration, string SessionType, string Focus, string Payment);
