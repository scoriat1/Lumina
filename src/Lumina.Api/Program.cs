using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Lumina.Domain.Entities;
using Lumina.Domain.Enums;
using Lumina.Infrastructure.Data;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<LuminaDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("LuminaDb")));

builder.Services.AddCors(options =>
{
    options.AddPolicy("client", policy =>
        policy.AllowAnyHeader().AllowAnyMethod().AllowAnyOrigin());
});

var jwtKey = builder.Configuration["Authentication:JwtKey"] ?? "lumina-dev-signing-key-change-for-production";
var jwtIssuer = builder.Configuration["Authentication:Issuer"] ?? "Lumina.Api";

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateIssuerSigningKey = true,
            ValidateLifetime = true,
            ValidIssuer = jwtIssuer,
            ValidAudience = jwtIssuer,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
            ClockSkew = TimeSpan.FromMinutes(2)
        };
    });

builder.Services.AddAuthorization();

var app = builder.Build();

app.UseCors("client");
app.UseAuthentication();
app.UseAuthorization();

app.MapGet("/health", () => Results.Ok(new { status = "ok" }));

app.MapPost("/api/auth/oauth/{provider}", async (string provider, LuminaDbContext db) =>
{
    var supportedProviders = new[] { "google", "microsoft", "github" };
    if (!supportedProviders.Contains(provider.ToLowerInvariant()))
    {
        return Results.BadRequest(new { error = "Unsupported OAuth provider." });
    }

    var devUser = await db.Users.OrderBy(u => u.Email).FirstOrDefaultAsync();
    if (devUser is null)
    {
        return Results.Problem("No users were found in the database.");
    }

    var token = CreateJwtToken(devUser, jwtIssuer, jwtKey, provider);
    return Results.Ok(new
    {
        accessToken = token,
        user = new { id = devUser.Id, name = devUser.Name, email = devUser.Email },
        provider = provider.ToLowerInvariant()
    });
});

app.MapGet("/api/auth/me", async (ClaimsPrincipal principal, LuminaDbContext db) =>
{
    var userIdClaim = principal.FindFirstValue(ClaimTypes.NameIdentifier);
    if (!Guid.TryParse(userIdClaim, out var userId))
    {
        return Results.Unauthorized();
    }

    var user = await db.Users.Where(u => u.Id == userId)
        .Select(u => new { id = u.Id, name = u.Name, email = u.Email })
        .FirstOrDefaultAsync();

    return user is null ? Results.Unauthorized() : Results.Ok(user);
}).RequireAuthorization();

app.MapPost("/api/dev/reset", async (LuminaDbContext db) =>
{
    db.Sessions.RemoveRange(db.Sessions);
    db.Clients.RemoveRange(db.Clients);
    db.Users.RemoveRange(db.Users);
    await db.SaveChangesAsync();

    await DbInitializer.SeedAsync(db);

    return Results.Ok(new
    {
        message = "Database cleared and reseeded for development.",
        cleared = new[] { "sessions", "clients", "users" }
    });
}).RequireAuthorization();

var api = app.MapGroup("/api").RequireAuthorization();

api.MapGet("/clients", async (LuminaDbContext db, ClaimsPrincipal principal) =>
{
    var userId = principal.GetUserId();
    var clients = await db.Clients
        .Where(c => c.UserId == userId)
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

api.MapGet("/clients/{id:guid}", async (Guid id, LuminaDbContext db, ClaimsPrincipal principal) =>
{
    var userId = principal.GetUserId();
    var client = await db.Clients.Where(c => c.Id == id && c.UserId == userId).Select(c => new
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

api.MapGet("/sessions", async (LuminaDbContext db, ClaimsPrincipal principal) =>
{
    var userId = principal.GetUserId();
    var sessions = await db.Sessions
        .Include(s => s.Client)
        .Where(s => s.Client.UserId == userId)
        .OrderBy(s => s.Date)
        .Select(s => new
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

api.MapGet("/sessions/{id:guid}", async (Guid id, LuminaDbContext db, ClaimsPrincipal principal) =>
{
    var userId = principal.GetUserId();
    var session = await db.Sessions.Include(s => s.Client).Where(s => s.Id == id && s.Client.UserId == userId).Select(s => new
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

api.MapPut("/sessions/{id:guid}", async (Guid id, SessionUpdateRequest request, LuminaDbContext db, ClaimsPrincipal principal) =>
{
    var userId = principal.GetUserId();
    var session = await db.Sessions.Include(x => x.Client).FirstOrDefaultAsync(x => x.Id == id && x.Client.UserId == userId);
    if (session is null) return Results.NotFound();

    if (request.Date is not null) session.Date = request.Date.Value;
    if (!string.IsNullOrWhiteSpace(request.SessionType)) session.SessionType = request.SessionType;
    if (!string.IsNullOrWhiteSpace(request.Focus)) session.Focus = request.Focus;

    await db.SaveChangesAsync();
    return Results.Ok();
});

api.MapPost("/sessions", async (SessionCreateRequest request, LuminaDbContext db, ClaimsPrincipal principal) =>
{
    var userId = principal.GetUserId();
    var client = await db.Clients.FirstOrDefaultAsync(c => c.Id == request.ClientId && c.UserId == userId);
    if (client is null)
    {
        return Results.BadRequest(new { error = "Client not found for current user." });
    }

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

api.MapGet("/dashboard", async (LuminaDbContext db, ClaimsPrincipal principal) =>
{
    var userId = principal.GetUserId();
    var activeClients = await db.Clients.CountAsync(c => c.UserId == userId && c.Status == ClientStatus.Active);
    var monthStart = new DateTimeOffset(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1, 0, 0, 0, TimeSpan.Zero);
    var sessionsThisMonth = await db.Sessions.CountAsync(s => s.Client.UserId == userId && s.Date >= monthStart);
    var revenueMtd = await db.Sessions.CountAsync(s => s.Client.UserId == userId && s.Date >= monthStart) * 150;
    var upcomingSessions = await db.Sessions.Include(s => s.Client).Where(s => s.Client.UserId == userId && s.Date >= DateTimeOffset.UtcNow).OrderBy(s => s.Date).Take(4).Select(s => new
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

    var clients = await db.Clients.Include(c => c.Sessions).Where(c => c.UserId == userId && c.Status == ClientStatus.Active).Take(4).Select(c => new
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

static string CreateJwtToken(User user, string issuer, string key, string provider)
{
    var claims = new List<Claim>
    {
        new(ClaimTypes.NameIdentifier, user.Id.ToString()),
        new(ClaimTypes.Name, user.Name),
        new(ClaimTypes.Email, user.Email),
        new("provider", provider.ToLowerInvariant())
    };

    var credentials = new SigningCredentials(
        new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key)),
        SecurityAlgorithms.HmacSha256);

    var token = new JwtSecurityToken(
        issuer,
        issuer,
        claims,
        expires: DateTime.UtcNow.AddHours(8),
        signingCredentials: credentials);

    return new JwtSecurityTokenHandler().WriteToken(token);
}

public record SessionUpdateRequest(DateTimeOffset? Date, string? SessionType, string? Focus);
public record SessionCreateRequest(Guid ClientId, DateTimeOffset Date, int Duration, string SessionType, string Focus, string Payment);

public static class ClaimsPrincipalExtensions
{
    public static Guid GetUserId(this ClaimsPrincipal principal)
    {
        var userIdClaim = principal.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!Guid.TryParse(userIdClaim, out var userId))
        {
            throw new InvalidOperationException("Authenticated user id is missing or invalid.");
        }

        return userId;
    }
}
