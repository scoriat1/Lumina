using System.Security.Claims;
using Lumina.Domain.Entities;
using Lumina.Domain.Enums;
using Lumina.Infrastructure.Data;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<LuminaDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("Lumina")));

builder.Services.AddIdentity<AppUser, IdentityRole<Guid>>(options =>
    {
        options.Password.RequireDigit = true;
        options.Password.RequireUppercase = true;
        options.Password.RequireLowercase = true;
        options.Password.RequireNonAlphanumeric = true;
    })
    .AddEntityFrameworkStores<LuminaDbContext>()
    .AddDefaultTokenProviders();

builder.Services.ConfigureApplicationCookie(options =>
{
    options.Cookie.Name = "lumina.auth";
    options.Cookie.SameSite = SameSiteMode.Lax;
    options.Events.OnRedirectToLogin = ctx =>
    {
        if (ctx.Request.Path.StartsWithSegments("/api"))
        {
            ctx.Response.StatusCode = StatusCodes.Status401Unauthorized;
            return Task.CompletedTask;
        }

        ctx.Response.Redirect(ctx.RedirectUri);
        return Task.CompletedTask;
    };
});

builder.Services.AddAuthentication(options =>
    {
        options.DefaultAuthenticateScheme = IdentityConstants.ApplicationScheme;
        options.DefaultSignInScheme = IdentityConstants.ApplicationScheme;
        options.DefaultChallengeScheme = IdentityConstants.ApplicationScheme;
    })
    .AddCookie(IdentityConstants.ApplicationScheme)
    .AddGoogle("Google", options =>
    {
        options.ClientId = builder.Configuration["Authentication:Google:ClientId"] ?? "";
        options.ClientSecret = builder.Configuration["Authentication:Google:ClientSecret"] ?? "";
        options.SignInScheme = IdentityConstants.ExternalScheme;
    });

builder.Services.AddAuthorization();

builder.Services.AddCors(options =>
{
    options.AddPolicy("client", policy =>
        policy.WithOrigins("http://localhost:5173").AllowAnyHeader().AllowAnyMethod().AllowCredentials());
});

var app = builder.Build();

app.UseCors("client");
app.UseAuthentication();
app.UseAuthorization();

app.MapGet("/health", () => Results.Ok(new { status = "ok" }));

app.MapPost("/api/auth/login", async (LoginRequest request, SignInManager<AppUser> signInManager, UserManager<AppUser> userManager) =>
{
    var user = await userManager.FindByEmailAsync(request.Email);
    if (user is null) return Results.Unauthorized();

    var result = await signInManager.PasswordSignInAsync(user, request.Password, true, false);
    return result.Succeeded ? Results.Ok() : Results.Unauthorized();
});

app.MapPost("/api/auth/logout", async (SignInManager<AppUser> signInManager) =>
{
    await signInManager.SignOutAsync();
    return Results.Ok();
});

app.MapGet("/api/auth/google/login", (HttpContext httpContext) =>
{
    var redirectUri = "/api/auth/google/callback";
    var properties = new AuthenticationProperties { RedirectUri = redirectUri };
    return Results.Challenge(properties, ["Google"]);
});

app.MapGet("/api/auth/google/callback", async (HttpContext httpContext, SignInManager<AppUser> signInManager, UserManager<AppUser> userManager, LuminaDbContext db) =>
{
    var externalLoginInfo = await signInManager.GetExternalLoginInfoAsync();
    if (externalLoginInfo is null) return Results.Redirect("http://localhost:5173/login?error=google");

    var signInResult = await signInManager.ExternalLoginSignInAsync(externalLoginInfo.LoginProvider, externalLoginInfo.ProviderKey, true);
    if (!signInResult.Succeeded)
    {
        var email = externalLoginInfo.Principal.FindFirstValue(ClaimTypes.Email) ?? string.Empty;
        var displayName = externalLoginInfo.Principal.FindFirstValue(ClaimTypes.Name) ?? email;
        var user = new AppUser { UserName = email, Email = email, DisplayName = displayName, EmailConfirmed = true };
        var createResult = await userManager.CreateAsync(user);
        if (!createResult.Succeeded) return Results.Redirect("http://localhost:5173/login?error=google");

        await userManager.AddLoginAsync(user, externalLoginInfo);

        var practice = new Practice { Id = Guid.NewGuid(), Name = $"{displayName} Practice", CreatedAt = DateTimeOffset.UtcNow };
        db.Practices.Add(practice);
        db.Providers.Add(new Provider
        {
            Id = Guid.NewGuid(),
            PracticeId = practice.Id,
            UserId = user.Id,
            DisplayName = displayName,
            Role = ProviderRole.Owner,
            IsActive = true,
            CreatedAt = DateTimeOffset.UtcNow
        });
        await db.SaveChangesAsync();

        await signInManager.SignInAsync(user, true);
    }

    return Results.Redirect("http://localhost:5173/");
});

app.MapGet("/api/auth/me", async (HttpContext httpContext, LuminaDbContext db, UserManager<AppUser> userManager) =>
{
    if (!httpContext.User.Identity?.IsAuthenticated ?? true) return Results.Unauthorized();

    var user = await userManager.GetUserAsync(httpContext.User);
    if (user is null) return Results.Unauthorized();

    var provider = await db.Providers.FirstOrDefaultAsync(p => p.UserId == user.Id && p.IsActive);
    if (provider is null) return Results.Unauthorized();

    var initials = string.Join(string.Empty, user.DisplayName.Split(' ', StringSplitOptions.RemoveEmptyEntries).Take(2).Select(x => x[0])).ToUpperInvariant();
    return Results.Ok(new
    {
        userId = user.Id,
        email = user.Email,
        displayName = user.DisplayName,
        initials,
        practiceId = provider.PracticeId,
        providerId = provider.Id,
        role = provider.Role.ToString().ToLowerInvariant()
    });
});

var api = app.MapGroup("/api").RequireAuthorization();

api.MapGet("/clients", async (LuminaDbContext db, HttpContext context) =>
{
    var scope = await ResolveScopeAsync(context, db);
    if (scope is null) return Results.Unauthorized();

    var clients = await db.Clients.Where(c => c.PracticeId == scope.Value.practiceId).OrderBy(c => c.Name).Select(c => new
    {
        id = c.Id,
        name = c.Name,
        initials = string.Join(string.Empty, c.Name.Split(' ', StringSplitOptions.RemoveEmptyEntries).Take(2).Select(n => n[0])).ToUpperInvariant(),
        avatarColor = c.AvatarColor,
        program = c.Program,
        sessionsCompleted = c.Sessions.Count(s => s.Status == SessionStatus.Completed),
        totalSessions = c.Sessions.Count,
        nextSession = c.Sessions.Where(s => s.Date >= DateTimeOffset.UtcNow).OrderBy(s => s.Date).Select(s => s.Date).FirstOrDefault(),
        status = c.Status.ToString().ToLowerInvariant(),
        email = c.Email,
        phone = c.Phone,
        startDate = c.StartDate,
        notes = c.Notes
    }).ToListAsync();

    return Results.Ok(clients);
});

api.MapGet("/clients/{id:guid}", async (Guid id, LuminaDbContext db, HttpContext context) =>
{
    var scope = await ResolveScopeAsync(context, db);
    if (scope is null) return Results.Unauthorized();

    var client = await db.Clients.Where(c => c.PracticeId == scope.Value.practiceId && c.Id == id).Select(c => new
    {
        id = c.Id,
        name = c.Name,
        initials = string.Join(string.Empty, c.Name.Split(' ', StringSplitOptions.RemoveEmptyEntries).Take(2).Select(n => n[0])).ToUpperInvariant(),
        avatarColor = c.AvatarColor,
        program = c.Program,
        sessionsCompleted = c.Sessions.Count(s => s.Status == SessionStatus.Completed),
        totalSessions = c.Sessions.Count,
        nextSession = c.Sessions.Where(s => s.Date >= DateTimeOffset.UtcNow).OrderBy(s => s.Date).Select(s => s.Date).FirstOrDefault(),
        status = c.Status.ToString().ToLowerInvariant(),
        email = c.Email,
        phone = c.Phone,
        startDate = c.StartDate,
        notes = c.Notes
    }).FirstOrDefaultAsync();

    return client is null ? Results.NotFound() : Results.Ok(client);
});

api.MapPost("/clients", async (ClientUpsertRequest request, LuminaDbContext db, HttpContext context) =>
{
    var scope = await ResolveScopeAsync(context, db);
    if (scope is null) return Results.Unauthorized();
    var client = new Client
    {
        Id = Guid.NewGuid(),
        PracticeId = scope.Value.practiceId,
        Name = request.Name,
        Email = request.Email,
        Phone = request.Phone,
        Program = request.Program,
        AvatarColor = request.AvatarColor,
        StartDate = request.StartDate,
        Status = request.Status,
        Notes = request.Notes
    };
    db.Clients.Add(client);
    await db.SaveChangesAsync();
    return Results.Ok(new { id = client.Id });
});

api.MapPut("/clients/{id:guid}", async (Guid id, ClientUpsertRequest request, LuminaDbContext db, HttpContext context) =>
{
    var scope = await ResolveScopeAsync(context, db);
    if (scope is null) return Results.Unauthorized();
    var client = await db.Clients.FirstOrDefaultAsync(c => c.Id == id && c.PracticeId == scope.Value.practiceId);
    if (client is null) return Results.NotFound();
    client.Name = request.Name;
    client.Email = request.Email;
    client.Phone = request.Phone;
    client.Program = request.Program;
    client.AvatarColor = request.AvatarColor;
    client.StartDate = request.StartDate;
    client.Status = request.Status;
    client.Notes = request.Notes;
    await db.SaveChangesAsync();
    return Results.Ok();
});

api.MapGet("/sessions", async (LuminaDbContext db, HttpContext context) =>
{
    var scope = await ResolveScopeAsync(context, db);
    if (scope is null) return Results.Unauthorized();

    var sessions = await db.Sessions.Where(s => s.PracticeId == scope.Value.practiceId).Include(s => s.Client).OrderBy(s => s.Date).Select(s => new
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
        payment = "paid",
        paymentStatus = "paid",
        billingSource = "pay-per-session",
        packageRemaining = (int?)null,
        focus = s.Focus,
        notes = s.Notes
    }).ToListAsync();

    return Results.Ok(sessions);
});

api.MapPost("/sessions", async (SessionCreateRequest request, LuminaDbContext db, HttpContext context) =>
{
    var scope = await ResolveScopeAsync(context, db);
    if (scope is null) return Results.Unauthorized();
    var session = new Session
    {
        Id = Guid.NewGuid(),
        PracticeId = scope.Value.practiceId,
        ProviderId = scope.Value.providerId,
        ClientId = request.ClientId,
        Date = request.Date,
        Duration = request.Duration,
        SessionType = request.SessionType,
        Focus = request.Focus,
        Status = SessionStatus.Upcoming,
        Location = SessionLocation.Zoom
    };
    db.Sessions.Add(session);
    await db.SaveChangesAsync();
    return Results.Ok(new { id = session.Id });
});

api.MapPut("/sessions/{id:guid}", async (Guid id, SessionUpdateRequest request, LuminaDbContext db, HttpContext context) =>
{
    var scope = await ResolveScopeAsync(context, db);
    if (scope is null) return Results.Unauthorized();
    var session = await db.Sessions.FirstOrDefaultAsync(s => s.Id == id && s.PracticeId == scope.Value.practiceId);
    if (session is null) return Results.NotFound();

    if (request.Date is not null) session.Date = request.Date.Value;
    if (!string.IsNullOrWhiteSpace(request.SessionType)) session.SessionType = request.SessionType;
    if (!string.IsNullOrWhiteSpace(request.Focus)) session.Focus = request.Focus;
    await db.SaveChangesAsync();
    return Results.Ok();
});

api.MapGet("/billing/summary", async (LuminaDbContext db, HttpContext context) =>
{
    var scope = await ResolveScopeAsync(context, db);
    if (scope is null) return Results.Unauthorized();

    var invoices = db.Invoices.Where(i => i.PracticeId == scope.Value.practiceId);
    var totalRevenue = await invoices.Where(i => i.Status == InvoiceStatus.Paid).SumAsync(i => i.Amount);
    var pendingAmount = await invoices.Where(i => i.Status == InvoiceStatus.Pending).SumAsync(i => i.Amount);
    var overdueAmount = await invoices.Where(i => i.Status == InvoiceStatus.Overdue).SumAsync(i => i.Amount);
    return Results.Ok(new { totalRevenue, pendingAmount, overdueAmount });
});

api.MapGet("/billing/invoices", async (LuminaDbContext db, HttpContext context) =>
{
    var scope = await ResolveScopeAsync(context, db);
    if (scope is null) return Results.Unauthorized();

    var invoices = await db.Invoices.Where(i => i.PracticeId == scope.Value.practiceId).Include(i => i.Client).OrderByDescending(i => i.CreatedAt).Select(i => new
    {
        id = i.Id,
        invoiceNumber = i.InvoiceNumber,
        clientName = i.Client.Name,
        clientInitials = string.Join(string.Empty, i.Client.Name.Split(' ', StringSplitOptions.RemoveEmptyEntries).Take(2).Select(n => n[0])).ToUpperInvariant(),
        clientColor = i.Client.AvatarColor,
        amount = i.Amount,
        date = i.CreatedAt,
        dueDate = i.DueDate,
        status = i.Status.ToString().ToLowerInvariant(),
        sessionCount = i.Description,
        description = i.Description
    }).ToListAsync();

    return Results.Ok(invoices);
});

api.MapGet("/settings/providers", async (LuminaDbContext db, HttpContext context) =>
{
    var scope = await ResolveScopeAsync(context, db);
    if (scope is null) return Results.Unauthorized();

    var providers = await db.Providers.Where(p => p.PracticeId == scope.Value.practiceId).Include(p => p.User).OrderBy(p => p.DisplayName).Select(p => new
    {
        id = p.Id,
        name = p.DisplayName,
        email = p.User.Email,
        role = p.Role.ToString(),
        status = p.IsActive ? "Active" : "Inactive",
        initials = string.Join(string.Empty, p.DisplayName.Split(' ', StringSplitOptions.RemoveEmptyEntries).Take(2).Select(n => n[0])).ToUpperInvariant(),
        avatarColor = "#9B8B9E"
    }).ToListAsync();

    return Results.Ok(providers);
});

api.MapGet("/templates/presets", async (LuminaDbContext db) =>
{
    var presets = await db.TemplatePresets.Where(p => p.IsActive).OrderBy(p => p.Name).Select(p => new
    {
        id = p.Id,
        name = p.Name,
        description = p.Description,
        fields = p.Fields.OrderBy(f => f.SortOrder).Select(f => f.Label).ToList()
    }).ToListAsync();
    return Results.Ok(presets);
});

api.MapGet("/templates/custom", async (LuminaDbContext db, HttpContext context) =>
{
    var scope = await ResolveScopeAsync(context, db);
    if (scope is null) return Results.Unauthorized();

    var templates = await db.Templates.Where(t => t.PracticeId == scope.Value.practiceId).OrderBy(t => t.Name).Select(t => new
    {
        id = t.Id,
        name = t.Name,
        fields = t.Fields.OrderBy(f => f.SortOrder).Select(f => f.Label).ToList(),
        custom = true
    }).ToListAsync();
    return Results.Ok(templates);
});

api.MapPost("/templates/custom/from-preset", async (FromPresetRequest request, LuminaDbContext db, HttpContext context) =>
{
    var scope = await ResolveScopeAsync(context, db);
    if (scope is null) return Results.Unauthorized();

    var preset = await db.TemplatePresets.Include(p => p.Fields).FirstOrDefaultAsync(p => p.Id == request.PresetId);
    if (preset is null) return Results.NotFound();

    var template = new Template
    {
        Id = Guid.NewGuid(),
        PracticeId = scope.Value.practiceId,
        Name = preset.Name,
        Description = preset.Description,
        SourcePresetId = preset.Id,
        CreatedAt = DateTimeOffset.UtcNow,
        Fields = preset.Fields.OrderBy(f => f.SortOrder).Select(f => new TemplateField
        {
            Id = Guid.NewGuid(),
            Label = f.Label,
            SortOrder = f.SortOrder,
            FieldType = f.FieldType
        }).ToList()
    };

    db.Templates.Add(template);
    await db.SaveChangesAsync();
    return Results.Ok(new { id = template.Id });
});

api.MapGet("/dashboard", async (LuminaDbContext db, HttpContext context) =>
{
    var scope = await ResolveScopeAsync(context, db);
    if (scope is null) return Results.Unauthorized();

    var activeClients = await db.Clients.CountAsync(c => c.PracticeId == scope.Value.practiceId && c.Status == ClientStatus.Active);
    var monthStart = new DateTimeOffset(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1, 0, 0, 0, TimeSpan.Zero);
    var nextMonth = monthStart.AddMonths(1);
    var sessionsThisMonth = await db.Sessions.CountAsync(s => s.PracticeId == scope.Value.practiceId && s.Date >= monthStart && s.Date < nextMonth);
    var revenueMtd = await db.Invoices.Where(i => i.PracticeId == scope.Value.practiceId && i.Status == InvoiceStatus.Paid && i.CreatedAt >= monthStart && i.CreatedAt < nextMonth).SumAsync(i => i.Amount);

    var upcomingSessions = await db.Sessions.Where(s => s.PracticeId == scope.Value.practiceId && s.Date >= DateTimeOffset.UtcNow).Include(s => s.Client).OrderBy(s => s.Date).Take(4).Select(s => new
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
        focus = s.Focus
    }).ToListAsync();

    var activeClientPreview = await db.Clients.Where(c => c.PracticeId == scope.Value.practiceId && c.Status == ClientStatus.Active).Take(4).Select(c => new
    {
        id = c.Id,
        name = c.Name,
        initials = string.Join(string.Empty, c.Name.Split(' ', StringSplitOptions.RemoveEmptyEntries).Take(2).Select(n => n[0])).ToUpperInvariant(),
        avatarColor = c.AvatarColor,
        program = c.Program,
        progress = 0,
        sessionsCompleted = c.Sessions.Count(s => s.Status == SessionStatus.Completed),
        totalSessions = c.Sessions.Count,
        status = c.Status.ToString().ToLowerInvariant(),
        email = c.Email,
        phone = c.Phone,
        startDate = c.StartDate,
        notes = c.Notes
    }).ToListAsync();

    return Results.Ok(new { activeClients, sessionsThisMonth, revenueMtd, calendarFilledPercent = 15, upcomingSessions, activeClientPreview });
});

var seedEnabled = app.Environment.IsDevelopment() && app.Configuration.GetValue<bool>("Seed:Enabled");
if (seedEnabled)
{
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<LuminaDbContext>();
    var userManager = scope.ServiceProvider.GetRequiredService<UserManager<AppUser>>();
    await DbInitializer.SeedAsync(db, userManager, true);
}

app.Run();

static async Task<(Guid practiceId, Guid providerId)?> ResolveScopeAsync(HttpContext context, LuminaDbContext db)
{
    var userIdRaw = context.User.FindFirstValue(ClaimTypes.NameIdentifier);
    if (!Guid.TryParse(userIdRaw, out var userId)) return null;
    var provider = await db.Providers.FirstOrDefaultAsync(p => p.UserId == userId && p.IsActive);
    return provider is null ? null : (provider.PracticeId, provider.Id);
}

public record LoginRequest(string Email, string Password);
public record SessionUpdateRequest(DateTimeOffset? Date, string? SessionType, string? Focus);
public record SessionCreateRequest(Guid ClientId, DateTimeOffset Date, int Duration, string SessionType, string Focus, string? Payment = null);
public record ClientUpsertRequest(string Name, string Email, string Phone, string Program, string AvatarColor, DateOnly StartDate, ClientStatus Status, string? Notes);
public record FromPresetRequest(Guid PresetId);
