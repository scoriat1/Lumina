using System.Security.Claims;
using System.Data.Common;
using System.Data;
using Lumina.Api.Repositories;
using Lumina.Api.Services;
using Lumina.Domain.Entities;
using Lumina.Domain.Enums;
using Lumina.Infrastructure.Data;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;

var builder = WebApplication.CreateBuilder(args);

const int DefaultInvoiceDueDays = 30;
const decimal DefaultSessionAmount = 125m;
var repoRootPath = FindRepoRoot(builder.Environment.ContentRootPath) ?? builder.Environment.ContentRootPath;
builder.Logging.ClearProviders();
builder.Logging.AddConsole();
var configuredLuminaConnectionString =
    builder.Configuration.GetConnectionString("Lumina")
    ?? throw new InvalidOperationException(
        "Connection string 'Lumina' is not configured.");
var luminaConnectionString = ResolveSqliteConnectionString(
    configuredLuminaConnectionString,
    repoRootPath);
var useSqlite = IsSqliteConnectionString(luminaConnectionString);
var dataProtectionKeysPath = Path.Combine(repoRootPath, ".dotnet", "data-protection-keys");

builder.Services.AddDataProtection()
    .PersistKeysToFileSystem(new DirectoryInfo(dataProtectionKeysPath))
    .SetApplicationName("Lumina");

builder.Services.AddDbContext<LuminaDbContext>(options =>
{
    if (useSqlite)
    {
        options.UseSqlite(luminaConnectionString);
        return;
    }

    options.UseSqlServer(luminaConnectionString);
});

builder.Services.AddIdentity<AppUser, IdentityRole>(options =>
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

var googleClientId = builder.Configuration["Authentication:Google:ClientId"];
var googleClientSecret = builder.Configuration["Authentication:Google:ClientSecret"];

if (!string.IsNullOrWhiteSpace(googleClientId) && !string.IsNullOrWhiteSpace(googleClientSecret))
{
    builder.Services.AddAuthentication()
        .AddGoogle("Google", options =>
        {
            options.ClientId = googleClientId;
            options.ClientSecret = googleClientSecret;
            options.SignInScheme = IdentityConstants.ExternalScheme;
        });
}

builder.Services.AddAuthorization();
builder.Services.AddScoped<IPracticeDataExportRepository, PracticeDataExportRepository>();
builder.Services.AddScoped<IDataExportService, DataExportService>();
builder.Services.AddScoped<IDataImportService, DataImportService>();

builder.Services.AddCors(options =>
{
    options.AddPolicy("client", policy =>
        policy
            .WithOrigins(
                "http://localhost:5175",
                "http://127.0.0.1:5175",
                "http://localhost:5176",
                "http://127.0.0.1:5176",
                "http://localhost:5177",
                "http://127.0.0.1:5177",
                "http://localhost:5178",
                "http://127.0.0.1:5178",
                "http://localhost:5179",
                "http://127.0.0.1:5179")
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials());
});

builder.Services.Configure<JsonOptions>(options =>
{
    options.SerializerOptions.Converters.Add(new JsonStringEnumConverter(JsonNamingPolicy.CamelCase));
});

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<LuminaDbContext>();
    var startupLogger = scope.ServiceProvider.GetRequiredService<ILoggerFactory>().CreateLogger("DatabaseStartup");
    var connection = db.Database.GetDbConnection();
    startupLogger.LogInformation(
        "SQL connection configured. DataSource={DataSource}; Database={Database}",
        connection.DataSource,
        connection.Database);

    if (app.Environment.IsDevelopment())
    {
        if (useSqlite)
        {
            db.Database.EnsureCreated();
        }
        else
        {
            db.Database.Migrate();
        }
    }
}

app.UseCors("client");
app.UseAuthentication();
app.UseAuthorization();

app.MapGet("/health", () => Results.Ok(new { status = "ok" }));

app.MapPost("/api/auth/login", async (LoginRequest request, SignInManager<AppUser> signInManager, UserManager<AppUser> userManager) =>
{
    var user = await userManager.FindByEmailAsync(request.Email);
    if (user is null)
        return Results.Json(new { reason = "user_not_found" }, statusCode: StatusCodes.Status401Unauthorized);

    var check = await signInManager.CheckPasswordSignInAsync(user, request.Password, lockoutOnFailure: false);
    if (!check.Succeeded)
    {
        return Results.Json(new
        {
            reason = "password_failed",
            check.IsLockedOut,
            check.IsNotAllowed,
            check.RequiresTwoFactor
        }, statusCode: StatusCodes.Status401Unauthorized);
    }

    await signInManager.SignInAsync(user, isPersistent: true);
    return Results.Ok(new { ok = true });
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
    if (externalLoginInfo is null) return Results.Redirect("http://localhost:5175/login?error=google");

    var signInResult = await signInManager.ExternalLoginSignInAsync(externalLoginInfo.LoginProvider, externalLoginInfo.ProviderKey, true);
    if (!signInResult.Succeeded)
    {
        var email = externalLoginInfo.Principal.FindFirstValue(ClaimTypes.Email) ?? string.Empty;
        var displayName = externalLoginInfo.Principal.FindFirstValue(ClaimTypes.Name) ?? email;
        var user = new AppUser { UserName = email, Email = email, DisplayName = displayName, EmailConfirmed = true };
        var createResult = await userManager.CreateAsync(user);
        if (!createResult.Succeeded) return Results.Redirect("http://localhost:5175/login?error=google");

        await userManager.AddLoginAsync(user, externalLoginInfo);

        var practice = new Practice { Name = $"{displayName} Practice", CreatedAt = DateTimeOffset.UtcNow };
        db.Practices.Add(practice);
        db.Providers.Add(new Provider
        {
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

    return Results.Redirect("http://localhost:5175/");
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
    await AutoCompletePastScheduledSessionsAsync(db, scope.Value.practiceId);
    var now = DateTimeOffset.UtcNow;

    var clients = await db.Clients.Where(c => c.PracticeId == scope.Value.practiceId).OrderBy(c => c.Name).Select(c => new
    {
        id = c.Id,
        name = c.Name,
        program = c.Program,
        sessionsCompleted = c.Sessions.Count(s => s.Status == SessionStatus.Completed),
        totalSessions = c.Sessions.Count,
        status = c.Status.ToString().ToLowerInvariant(),
        billingModel = c.BillingModel,
        email = c.Email,
        phone = c.Phone,
        startDate = c.StartDate,
        notes = c.Notes
    }).ToListAsync();

    var clientIds = clients.Select(c => c.id).ToArray();
    var nextSessions = await db.Sessions
        .Where(s => s.PracticeId == scope.Value.practiceId && clientIds.Contains(s.ClientId))
        .Select(s => new { s.ClientId, s.Date })
        .ToListAsync();

    var nextSessionByClientId = nextSessions
        .GroupBy(session => session.ClientId)
        .ToDictionary(
            group => group.Key,
            group => group
                .Where(session => session.Date >= now)
                .OrderBy(session => session.Date)
                .Select(session => (DateTimeOffset?)session.Date)
                .FirstOrDefault());

    return Results.Ok(clients.Select(client => new
    {
        client.id,
        client.name,
        client.program,
        progress = CalculateProgressPercentage(client.sessionsCompleted, client.totalSessions),
        client.sessionsCompleted,
        client.totalSessions,
        nextSession = nextSessionByClientId.GetValueOrDefault(client.id),
        client.status,
        billingModel = client.billingModel,
        client.email,
        client.phone,
        client.startDate,
        client.notes
    }));
});

api.MapGet("/clients/{id:int}", async (int id, LuminaDbContext db, HttpContext context) =>
{
    var scope = await ResolveScopeAsync(context, db);
    if (scope is null) return Results.Unauthorized();
    await AutoCompletePastScheduledSessionsAsync(db, scope.Value.practiceId);
    var now = DateTimeOffset.UtcNow;

    var client = await db.Clients.Where(c => c.PracticeId == scope.Value.practiceId && c.Id == id).Select(c => new
    {
        id = c.Id,
        name = c.Name,
        program = c.Program,
        sessionsCompleted = c.Sessions.Count(s => s.Status == SessionStatus.Completed),
        totalSessions = c.Sessions.Count,
        status = c.Status.ToString().ToLowerInvariant(),
        billingModel = c.BillingModel,
        email = c.Email,
        phone = c.Phone,
        startDate = c.StartDate,
        notes = c.Notes
    }).FirstOrDefaultAsync();

    if (client is null)
    {
        return Results.NotFound();
    }

    var nextSession = (await db.Sessions
        .Where(s => s.PracticeId == scope.Value.practiceId && s.ClientId == client.id)
        .Select(s => s.Date)
        .ToListAsync())
        .OrderBy(date => date)
        .FirstOrDefault(date => date >= now);

    return Results.Ok(new
    {
        client.id,
        client.name,
        client.program,
        progress = CalculateProgressPercentage(client.sessionsCompleted, client.totalSessions),
        client.sessionsCompleted,
        client.totalSessions,
        nextSession,
        client.status,
        billingModel = client.billingModel,
        client.email,
        client.phone,
        client.startDate,
        client.notes
    });
});

api.MapPost("/clients", async (ClientUpsertRequest request, LuminaDbContext db, HttpContext context) =>
{
    var scope = await ResolveScopeAsync(context, db);
    if (scope is null) return Results.Unauthorized();
    var normalizedNotes = string.IsNullOrWhiteSpace(request.Notes) ? null : request.Notes.Trim();
    var client = new Client
    {
        PracticeId = scope.Value.practiceId,
        Name = request.Name,
        Email = request.Email,
        Phone = request.Phone,
        Program = request.Program,
        StartDate = request.StartDate,
        Status = request.Status,
        BillingModel = request.BillingModel,
        Notes = normalizedNotes
    };
    db.Clients.Add(client);
    await db.SaveChangesAsync();

    if (normalizedNotes is not null)
    {
        var now = DateTimeOffset.UtcNow;
        db.SessionNotes.Add(new SessionNote
        {
            ClientId = client.Id,
            SessionId = null,
            NoteType = "general",
            Source = "client-create",
            Content = normalizedNotes,
            CreatedAt = now,
            UpdatedAt = now
        });

        await db.SaveChangesAsync();
    }

    return Results.Ok(new { id = client.Id });
});

api.MapPut("/clients/{id:int}", async (int id, ClientUpsertRequest request, LuminaDbContext db, HttpContext context) =>
{
    var scope = await ResolveScopeAsync(context, db);
    if (scope is null) return Results.Unauthorized();
    var client = await db.Clients.FirstOrDefaultAsync(c => c.Id == id && c.PracticeId == scope.Value.practiceId);
    if (client is null) return Results.NotFound();
    client.Name = request.Name;
    client.Email = request.Email;
    client.Phone = request.Phone;
    client.Program = request.Program;
    client.StartDate = request.StartDate;
    client.Status = request.Status;
    client.BillingModel = request.BillingModel;
    client.Notes = request.Notes;
    await db.SaveChangesAsync();
    return Results.Ok();
});

api.MapGet("/clients/{id:int}/sessions", async (int id, LuminaDbContext db, HttpContext context) =>
{
    var scope = await ResolveScopeAsync(context, db);
    if (scope is null) return Results.Unauthorized();
    await AutoCompletePastScheduledSessionsAsync(db, scope.Value.practiceId);

    var sessions = (await db.Sessions
        .Where(s => s.PracticeId == scope.Value.practiceId && s.ClientId == id)
        .Include(s => s.Client)
        .Include(s => s.Provider)
        .Include(s => s.ClientPackage)
            .ThenInclude(cp => cp!.Package)
        .Include(s => s.Invoice)
        .ToListAsync())
        .OrderByDescending(s => s.Date)
        .ToList();

    return Results.Ok(sessions.Select(s => MapSessionDto(s, s.Client.Name)));
});

api.MapGet("/clients/{id:int}/detail-view", async (int id, LuminaDbContext db, HttpContext context) =>
{
    var scope = await ResolveScopeAsync(context, db);
    if (scope is null) return Results.Unauthorized();
    await AutoCompletePastScheduledSessionsAsync(db, scope.Value.practiceId);

    var client = await db.Clients
        .AsNoTracking()
        .FirstOrDefaultAsync(c => c.PracticeId == scope.Value.practiceId && c.Id == id);
    if (client is null) return Results.NotFound();

    var sessions = (await db.Sessions
        .AsNoTracking()
        .Where(s => s.PracticeId == scope.Value.practiceId && s.ClientId == id)
        .Include(s => s.ClientPackage)
            .ThenInclude(cp => cp!.Package)
        .Include(s => s.Invoice)
        .ToListAsync())
        .OrderBy(s => s.Date)
        .ToList();

    var packages = (await db.ClientPackages
        .AsNoTracking()
        .Where(cp => cp.PracticeId == scope.Value.practiceId && cp.ClientId == id)
        .Include(cp => cp.Package)
        .ToListAsync())
        .OrderBy(cp => cp.PurchasedAt)
        .ToList();

    var notes = (await db.SessionNotes
        .AsNoTracking()
        .Where(n => n.ClientId == id)
        .ToListAsync())
        .OrderByDescending(n => n.CreatedAt)
        .ToList();

    var upcomingSession = sessions
        .Where(s => s.Date >= DateTimeOffset.UtcNow)
        .OrderBy(s => s.Date)
        .FirstOrDefault();

    var packageBoundaries = packages
        .Select((pkg, index) => new
        {
            Package = pkg,
            Start = pkg.PurchasedAt,
            End = index + 1 < packages.Count ? packages[index + 1].PurchasedAt : DateTimeOffset.MaxValue
        })
        .ToList();

    var engagementGroups = packageBoundaries
        .Select(boundary =>
        {
            var packageSessions = sessions
                .Where(s => s.ClientPackageId == boundary.Package.Id)
                .ToList();

            var packageStats = GetPackageSessionStats(
                boundary.Package.Package.SessionCount,
                packageSessions);
            var start = packageSessions.MinBy(s => s.Date)?.Date ?? boundary.Package.PurchasedAt;
            var end = packageSessions.MaxBy(s => s.Date)?.Date;

            return new
            {
                id = $"package-{boundary.Package.Id}",
                packageId = (int?)boundary.Package.PackageId,
                clientPackageId = (int?)boundary.Package.Id,
                name = boundary.Package.Package.Name,
                startDate = (DateTimeOffset?)start,
                endDate = end,
                price = boundary.Package.Package.Price,
                totalSessions = boundary.Package.Package.SessionCount,
                usedSessions = packageStats.UsedSessions,
                scheduledSessions = packageStats.ScheduledSessions,
                cancelledSessions = packageStats.CancelledSessions,
                availableSessions = packageStats.AvailableSessions,
                paymentStatus = (string?)boundary.Package.PaymentStatus.ToString().ToLowerInvariant(),
                paymentAmount = boundary.Package.PaymentAmount,
                paymentDate = boundary.Package.PaymentDate,
                paymentMethod = boundary.Package.PaymentMethod,
                status = packageStats.Status,
                sessions = packageSessions.Select(s => MapSessionDto(s, client.Name)).ToList()
            };
        })
        .ToList();

    var assignedSessionIds = engagementGroups
         .SelectMany(group => group.sessions.Select(s => s.id))
        .ToHashSet();

    var singleSessions = sessions
        .Where(s => s.ClientPackageId is null && !assignedSessionIds.Contains(s.Id))
        .ToList();

    if (singleSessions.Count > 0)
    {
        engagementGroups.Add(new
        {
            id = "single-sessions",
            packageId = (int?)null,
            clientPackageId = (int?)null,
            name = "Single Sessions",
            startDate = singleSessions.MinBy(s => s.Date)?.Date,
            endDate = singleSessions.MaxBy(s => s.Date)?.Date,
            price = (decimal?)null,
            totalSessions = singleSessions.Count,
            usedSessions = singleSessions.Count(s => s.Status == SessionStatus.Completed),
            scheduledSessions = singleSessions.Count(s => s.Status == SessionStatus.Upcoming),
            cancelledSessions = singleSessions.Count(s => s.Status == SessionStatus.Cancelled),
            availableSessions = 0,
            paymentStatus = (string?)null,
            paymentAmount = (decimal?)null,
            paymentDate = (DateTimeOffset?)null,
            paymentMethod = (string?)null,
            status = "active",
            sessions = singleSessions.Select(s => MapSessionDto(s, client.Name)).ToList()
        });
    }

    var timeline = sessions.Select(session => new
    {
        id = $"session-{session.Id}",
        entryType = "session",
        category = session.Status.ToString().ToLowerInvariant(),
        sessionId = (int?)session.Id,
        createdAt = session.Date,
        content = session.Focus,
        session = (ApiSessionItem?)MapSessionDto(session, client.Name)
    }).Concat(notes.Where(n => n.Source != "session-details").Select(note => new
    {
        id = $"note-{note.Id}",
        entryType = "note",
        category = string.IsNullOrWhiteSpace(note.NoteType) ? "general" : note.NoteType,
        sessionId = note.SessionId,
        createdAt = note.CreatedAt,
        content = note.Content,
        session = (ApiSessionItem?)null
    }))
    .OrderByDescending(entry => entry.createdAt)
    .ToList();

    return Results.Ok(new
    {
        nextStep = upcomingSession is null ? null : new
        {
            sessionId = upcomingSession.Id,
            date = upcomingSession.Date,
            sessionType = upcomingSession.SessionType,
            location = upcomingSession.Location.ToString().ToLowerInvariant()
        },
        engagements = engagementGroups,
        timeline,
        clientNotes = notes
            .Where(n => n.SessionId is null)
            .Select(n => new
            {
                id = n.Id,
                clientId = n.ClientId,
                sessionId = n.SessionId,
                type = n.NoteType,
                content = n.Content,
                createdAt = n.CreatedAt,
                updatedAt = n.UpdatedAt,
                source = n.Source
            })
            .OrderByDescending(n => n.createdAt)
            .ToList()
    });
});

api.MapGet("/sessions", async (int? clientId, LuminaDbContext db, HttpContext context) =>
{
    var scope = await ResolveScopeAsync(context, db);
    if (scope is null) return Results.Unauthorized();
    await AutoCompletePastScheduledSessionsAsync(db, scope.Value.practiceId);

    var query = db.Sessions
        .Where(s => s.PracticeId == scope.Value.practiceId)
        .Where(s => !clientId.HasValue || s.ClientId == clientId.Value)
        .Include(s => s.Client)
        .Include(s => s.Provider)
        .Include(s => s.ClientPackage)
            .ThenInclude(cp => cp!.Package)
        .Include(s => s.Invoice);

    var sessions = (await query.ToListAsync())
        .OrderBy(s => s.Date)
        .ToList();

    return Results.Ok(sessions.Select(s => MapSessionDto(s, s.Client.Name)));
});

api.MapGet("/sessions/{id:int}", async (int id, LuminaDbContext db, HttpContext context) =>
{
    var scope = await ResolveScopeAsync(context, db);
    if (scope is null) return Results.Unauthorized();
    await AutoCompletePastScheduledSessionsAsync(db, scope.Value.practiceId);

    var session = await db.Sessions
        .Where(s => s.PracticeId == scope.Value.practiceId && s.Id == id)
        .Include(s => s.Client)
        .Include(s => s.Provider)
        .Include(s => s.ClientPackage)
            .ThenInclude(cp => cp!.Package)
        .Include(s => s.Invoice)
        .FirstOrDefaultAsync();

    return session is null ? Results.NotFound() : Results.Ok(MapSessionDto(session, session.Client.Name));
});

api.MapPost("/sessions", async (SessionCreateRequest request, LuminaDbContext db, HttpContext context) =>
{
    var scope = await ResolveScopeAsync(context, db);
    if (scope is null) return Results.Unauthorized();

    var client = await db.Clients
        .FirstOrDefaultAsync(c => c.Id == request.ClientId && c.PracticeId == scope.Value.practiceId);
    if (client is null)
    {
        return Results.BadRequest(new { message = "Selected client was not found." });
    }

    var now = DateTimeOffset.UtcNow;
    var status = request.Status ?? (request.Mode == SessionEntryMode.LogPast ? SessionStatus.Completed : SessionStatus.Upcoming);
    var sessionsToCreate = request.RecurrenceCount.GetValueOrDefault(1);
    var hasRecurrence = sessionsToCreate > 1;

    if (sessionsToCreate <= 0)
    {
        return Results.BadRequest(new { message = "Recurring session count must be at least 1." });
    }

    string? recurrenceFrequency = null;
    if (hasRecurrence)
    {
        if (request.Mode != SessionEntryMode.Schedule)
        {
            return Results.BadRequest(new { message = "Recurring sessions can only be scheduled in schedule mode." });
        }

        if (!TryNormalizeRecurrenceFrequency(request.RecurrenceFrequency, out recurrenceFrequency))
        {
            return Results.BadRequest(new { message = "A valid recurrence frequency is required for recurring sessions." });
        }
    }

    if (request.Mode == SessionEntryMode.Schedule)
    {
        if (request.Date <= now)
        {
            return Results.BadRequest(new { message = "Scheduled sessions must be created in the future." });
        }

        if (status != SessionStatus.Upcoming)
        {
            return Results.BadRequest(new { message = "Schedule mode only supports scheduled sessions." });
        }
    }
    else
    {
        if (request.Date > now)
        {
            return Results.BadRequest(new { message = "Past sessions must be logged with a past date and time." });
        }

        if (status == SessionStatus.Upcoming)
        {
            return Results.BadRequest(new { message = "Past sessions cannot use the scheduled status." });
        }
    }

    var practice = await db.Practices
        .FirstOrDefaultAsync(p => p.Id == scope.Value.practiceId);

    if (practice is null) return Results.NotFound();

    await using var transaction = await db.Database.BeginTransactionAsync(IsolationLevel.Serializable);
    ClientPackage? clientPackage = null;

    if (request.BillingMode == SessionBillingMode.Package)
    {
        if (!request.ClientPackageId.HasValue && !request.PackageId.HasValue)
        {
            return Results.BadRequest(new { message = "A package is required for package billing." });
        }

        if (request.ClientPackageId.HasValue)
        {
            clientPackage = await db.ClientPackages
                .Include(cp => cp.Package)
                .Include(cp => cp.Sessions)
                .FirstOrDefaultAsync(cp =>
                    cp.Id == request.ClientPackageId.Value &&
                    cp.PracticeId == scope.Value.practiceId &&
                    cp.ClientId == request.ClientId);
        }
        else if (request.PackageId.HasValue)
        {
            var package = await db.Packages
                .FirstOrDefaultAsync(p =>
                    p.Id == request.PackageId.Value &&
                    p.PracticeId == scope.Value.practiceId &&
                    p.IsActive);

            if (package is null)
            {
                return Results.BadRequest(new { message = "Selected package was not found." });
            }

            var matchingClientPackages = await db.ClientPackages
                .Include(cp => cp.Package)
                .Include(cp => cp.Sessions)
                .Where(cp =>
                    cp.PracticeId == scope.Value.practiceId &&
                    cp.ClientId == request.ClientId &&
                    cp.PackageId == package.Id)
                .ToListAsync();

            clientPackage = matchingClientPackages
                .Where(cp => GetAvailablePackageSessions(cp) > 0)
                .OrderByDescending(cp => cp.PurchasedAt)
                .FirstOrDefault();

            if (clientPackage is null)
            {
                clientPackage = new ClientPackage
                {
                    PracticeId = scope.Value.practiceId,
                    ClientId = request.ClientId,
                    PackageId = package.Id,
                    PurchasedAt = now,
                    RemainingSessions = package.SessionCount,
                    Package = package
                };

                db.ClientPackages.Add(clientPackage);
            }
        }

        if (clientPackage is null)
        {
            return Results.BadRequest(new { message = "Selected package was not found for this client." });
        }

        var requiredPackageSlots = ConsumesPackageCapacity(status) ? sessionsToCreate : 0;
        var availablePackageSessions = GetAvailablePackageSessions(clientPackage);

        if (requiredPackageSlots > 0)
        {
            if (availablePackageSessions <= 0)
            {
                return Results.BadRequest(new { message = "Selected package has no remaining sessions." });
            }

            if (availablePackageSessions < requiredPackageSlots)
            {
                return Results.BadRequest(new
                {
                    message = $"Selected package only has {availablePackageSessions} session(s) remaining."
                });
            }
        }

        clientPackage.RemainingSessions = Math.Max(0, availablePackageSessions - requiredPackageSlots);
    }
    else if (request.BillingMode == SessionBillingMode.PayPerSession)
    {
        if (!request.Amount.HasValue || request.Amount.Value <= 0)
        {
            return Results.BadRequest(new { message = "A positive amount is required for pay-per-session billing." });
        }
    }
    else if (request.BillingMode == SessionBillingMode.Monthly)
    {
        if (request.Amount.HasValue && request.Amount.Value <= 0)
        {
            return Results.BadRequest(new { message = "Monthly session amount must be positive when provided." });
        }
    }

    var invoiceNumbers = request.BillingMode == SessionBillingMode.PayPerSession
        ? await GenerateInvoiceNumbersAsync(db, scope.Value.practiceId, sessionsToCreate)
        : [];
    var createdSessions = new List<Session>();
    for (var occurrence = 0; occurrence < sessionsToCreate; occurrence++)
    {
        var sessionDate = hasRecurrence && recurrenceFrequency is not null
            ? GetRecurringSessionDate(request.Date, recurrenceFrequency, occurrence)
            : request.Date;

        var session = new Session
        {
            PracticeId = scope.Value.practiceId,
            ProviderId = scope.Value.providerId,
            ClientId = request.ClientId,
            Date = sessionDate,
            Duration = request.Duration,
            SessionType = string.IsNullOrWhiteSpace(request.SessionType) ? "Session" : request.SessionType.Trim(),
            Focus = request.Focus?.Trim() ?? string.Empty,
            Status = status,
            Location = request.Location
        };

        if (request.BillingMode == SessionBillingMode.Package)
        {
            session.ClientPackage = clientPackage;
        }
        else if (request.BillingMode == SessionBillingMode.Monthly)
        {
            session.PaymentAmount = decimal.Round(
                request.Amount ?? practice.BillingDefaultSessionAmount,
                2,
                MidpointRounding.AwayFromZero);
            session.PaymentStatus = PaymentStatus.Pending;
        }
        else
        {
            var invoice = new Invoice
            {
                PracticeId = scope.Value.practiceId,
                ClientId = request.ClientId,
                InvoiceNumber = invoiceNumbers[occurrence],
                Description = string.IsNullOrWhiteSpace(session.SessionType)
                    ? $"Session for {client.Name}"
                    : $"{session.SessionType} session",
                Amount = decimal.Round(request.Amount!.Value, 2, MidpointRounding.AwayFromZero),
                DueDate = DateOnly.FromDateTime(DateTime.UtcNow.Date.AddDays(practice.BillingDefaultDueDays)),
                Status = InvoiceStatus.Pending,
                CreatedAt = now
            };

            db.Invoices.Add(invoice);
            session.Invoice = invoice;
            session.PaymentAmount = invoice.Amount;
            session.PaymentStatus = PaymentStatus.Pending;
        }

        db.Sessions.Add(session);
        createdSessions.Add(session);
    }

    await db.SaveChangesAsync();
    await transaction.CommitAsync();

    return Results.Ok(new
    {
        id = createdSessions[0].Id,
        ids = createdSessions.Select(s => s.Id).ToList(),
        createdCount = createdSessions.Count
    });
});

api.MapPut("/sessions/{id:int}", async (int id, SessionUpdateRequest request, LuminaDbContext db, HttpContext context) =>
{
    var scope = await ResolveScopeAsync(context, db);
    if (scope is null) return Results.Unauthorized();
    var session = await db.Sessions
        .Include(s => s.ClientPackage)
            .ThenInclude(cp => cp!.Package)
        .Include(s => s.ClientPackage)
            .ThenInclude(cp => cp!.Sessions)
        .FirstOrDefaultAsync(s => s.Id == id && s.PracticeId == scope.Value.practiceId);
    if (session is null) return Results.NotFound();

    var nextStatus = request.Status ?? session.Status;

    if (session.ClientPackage is not null)
    {
        var currentPackageSlots = ConsumesPackageCapacity(session.Status) ? 1 : 0;
        var nextPackageSlots = ConsumesPackageCapacity(nextStatus) ? 1 : 0;
        var requiredAdditionalSlots = nextPackageSlots - currentPackageSlots;
        var availablePackageSessions = GetAvailablePackageSessions(session.ClientPackage);

        if (requiredAdditionalSlots > 0 && availablePackageSessions < requiredAdditionalSlots)
        {
            return Results.BadRequest(new
            {
                message = $"This package only has {availablePackageSessions} session(s) available to schedule."
            });
        }
    }

    if (request.Date is not null) session.Date = request.Date.Value;
    if (!string.IsNullOrWhiteSpace(request.SessionType)) session.SessionType = request.SessionType;
    if (request.Duration is not null) session.Duration = request.Duration.Value;
    if (request.Location is not null) session.Location = request.Location.Value;
    if (request.Status is not null) session.Status = request.Status.Value;
    if (!string.IsNullOrWhiteSpace(request.Focus)) session.Focus = request.Focus;
    if (request.Notes is not null) session.Notes = request.Notes;

    if (session.ClientPackage is not null)
    {
        session.ClientPackage.RemainingSessions = GetAvailablePackageSessions(session.ClientPackage);
    }

    await db.SaveChangesAsync();
    return Results.Ok();
});

api.MapPost("/sessions/{id:int}/mark-paid", async (int id, SessionPaymentRequest request, LuminaDbContext db, HttpContext context) =>
{
    var scope = await ResolveScopeAsync(context, db);
    if (scope is null) return Results.Unauthorized();

    await using var transaction = await db.Database.BeginTransactionAsync(IsolationLevel.Serializable);

    var session = await db.Sessions
        .Include(s => s.Client)
        .Include(s => s.Invoice)
        .FirstOrDefaultAsync(s => s.Id == id && s.PracticeId == scope.Value.practiceId);

    if (session is null) return Results.NotFound();
    if (session.ClientPackageId.HasValue)
    {
        return Results.BadRequest(new { message = "Package sessions are paid through the package purchase." });
    }

    var practice = await db.Practices.FirstOrDefaultAsync(p => p.Id == scope.Value.practiceId);
    if (practice is null) return Results.NotFound();

    var amount = decimal.Round(
        request.Amount ?? session.PaymentAmount ?? session.Invoice?.Amount ?? practice.BillingDefaultSessionAmount,
        2,
        MidpointRounding.AwayFromZero);

    if (amount <= 0)
    {
        return Results.BadRequest(new { message = "Payment amount must be greater than 0." });
    }

    if (session.Invoice is null)
    {
        var invoiceNumber = (await GenerateInvoiceNumbersAsync(db, scope.Value.practiceId, 1))[0];
        var invoice = new Invoice
        {
            PracticeId = scope.Value.practiceId,
            ClientId = session.ClientId,
            InvoiceNumber = invoiceNumber,
            Description = string.IsNullOrWhiteSpace(session.SessionType)
                ? $"Session for {session.Client.Name}"
                : $"{session.SessionType} session",
            Amount = amount,
            DueDate = DateOnly.FromDateTime(DateTime.UtcNow.Date.AddDays(practice.BillingDefaultDueDays)),
            Status = InvoiceStatus.Paid,
            CreatedAt = DateTimeOffset.UtcNow
        };

        db.Invoices.Add(invoice);
        session.Invoice = invoice;
    }
    else
    {
        session.Invoice.Amount = amount;
        session.Invoice.Status = InvoiceStatus.Paid;
    }

    session.PaymentAmount = amount;
    session.PaymentStatus = PaymentStatus.Paid;
    session.PaymentDate = request.PaymentDate ?? DateTimeOffset.UtcNow;
    session.PaymentMethod = string.IsNullOrWhiteSpace(request.PaymentMethod)
        ? "manual"
        : request.PaymentMethod.Trim();

    await db.SaveChangesAsync();
    await transaction.CommitAsync();

    return Results.Ok(MapSessionDto(session, session.Client.Name));
});

api.MapPut("/sessions/{id:int}/payment", async (int id, SessionPaymentUpdateRequest request, LuminaDbContext db, HttpContext context) =>
{
    var scope = await ResolveScopeAsync(context, db);
    if (scope is null) return Results.Unauthorized();

    await using var transaction = await db.Database.BeginTransactionAsync(IsolationLevel.Serializable);

    var session = await db.Sessions
        .Include(s => s.Client)
        .Include(s => s.Invoice)
        .FirstOrDefaultAsync(s => s.Id == id && s.PracticeId == scope.Value.practiceId);

    if (session is null) return Results.NotFound();
    if (session.ClientPackageId.HasValue)
    {
        return Results.BadRequest(new { message = "Package sessions are paid through the package purchase." });
    }

    var practice = await db.Practices.FirstOrDefaultAsync(p => p.Id == scope.Value.practiceId);
    if (practice is null) return Results.NotFound();

    var amount = request.Amount.HasValue
        ? decimal.Round(request.Amount.Value, 2, MidpointRounding.AwayFromZero)
        : (decimal?)null;

    if (amount <= 0)
    {
        return Results.BadRequest(new { message = "Payment amount must be greater than 0." });
    }

    if (request.PaymentStatus == PaymentStatus.Paid && amount is null)
    {
        amount = decimal.Round(
            session.PaymentAmount ?? session.Invoice?.Amount ?? practice.BillingDefaultSessionAmount,
            2,
            MidpointRounding.AwayFromZero);
    }

    if (request.PaymentStatus != PaymentStatus.Unpaid && amount.HasValue && session.Invoice is null)
    {
        var invoiceNumber = (await GenerateInvoiceNumbersAsync(db, scope.Value.practiceId, 1))[0];
        var invoice = new Invoice
        {
            PracticeId = scope.Value.practiceId,
            ClientId = session.ClientId,
            InvoiceNumber = invoiceNumber,
            Description = string.IsNullOrWhiteSpace(session.SessionType)
                ? $"Session for {session.Client.Name}"
                : $"{session.SessionType} session",
            Amount = amount.Value,
            DueDate = DateOnly.FromDateTime(DateTime.UtcNow.Date.AddDays(practice.BillingDefaultDueDays)),
            Status = request.PaymentStatus == PaymentStatus.Paid ? InvoiceStatus.Paid : InvoiceStatus.Pending,
            CreatedAt = DateTimeOffset.UtcNow
        };

        db.Invoices.Add(invoice);
        session.Invoice = invoice;
    }
    else if (session.Invoice is not null)
    {
        if (amount.HasValue)
        {
            session.Invoice.Amount = amount.Value;
        }

        session.Invoice.Status = request.PaymentStatus == PaymentStatus.Paid
            ? InvoiceStatus.Paid
            : InvoiceStatus.Pending;
    }

    session.PaymentAmount = amount;
    session.PaymentStatus = request.PaymentStatus;
    session.PaymentDate = request.PaymentStatus == PaymentStatus.Paid
        ? request.PaymentDate ?? session.PaymentDate ?? DateTimeOffset.UtcNow
        : request.PaymentDate;
    session.PaymentMethod = string.IsNullOrWhiteSpace(request.PaymentMethod)
        ? null
        : request.PaymentMethod.Trim();

    await db.SaveChangesAsync();
    await transaction.CommitAsync();

    return Results.Ok(MapSessionDto(session, session.Client.Name));
});

api.MapGet("/sessions/{id:int}/note", async (int id, LuminaDbContext db, HttpContext context) =>
{
    var scope = await ResolveScopeAsync(context, db);
    if (scope is null) return Results.Unauthorized();

    var session = await db.Sessions
        .AsNoTracking()
        .FirstOrDefaultAsync(s => s.Id == id && s.PracticeId == scope.Value.practiceId);
    if (session is null) return Results.NotFound();

    var note = await db.SessionNotes
        .AsNoTracking()
        .FirstOrDefaultAsync(n => n.SessionId == id && n.Source == "session-details");

    return note is null
        ? Results.Ok(new { note = (object?)null })
        : Results.Ok(new
        {
            note = new
            {
                id = note.Id,
                sessionId = note.SessionId,
                clientId = note.ClientId,
                templateId = note.TemplateId,
                noteType = note.NoteType,
                source = note.Source,
                content = note.Content,
                createdAt = note.CreatedAt,
                updatedAt = note.UpdatedAt
            }
        });
});

api.MapPut("/sessions/{id:int}/note", async (int id, SessionStructuredNoteRequest request, LuminaDbContext db, HttpContext context) =>
{
    var scope = await ResolveScopeAsync(context, db);
    if (scope is null) return Results.Unauthorized();

    var session = await db.Sessions
        .FirstOrDefaultAsync(s => s.Id == id && s.PracticeId == scope.Value.practiceId);
    if (session is null) return Results.NotFound();

    var note = await db.SessionNotes
        .FirstOrDefaultAsync(n => n.SessionId == id && n.Source == "session-details");

    if (note is null)
    {
        note = new SessionNote
        {
            ClientId = session.ClientId,
            SessionId = session.Id,
            CreatedAt = DateTimeOffset.UtcNow,
            Source = "session-details"
        };
        db.SessionNotes.Add(note);
    }

    int? persistedTemplateId = null;
    if (request.TemplateId.HasValue)
    {
        var templateExists = await db.Templates.AnyAsync(t =>
            t.Id == request.TemplateId.Value &&
            t.PracticeId == scope.Value.practiceId);

        if (templateExists)
        {
            persistedTemplateId = request.TemplateId.Value;
        }
    }

    note.TemplateId = persistedTemplateId;
    note.NoteType = string.IsNullOrWhiteSpace(request.NoteType) ? "general" : request.NoteType.Trim().ToLowerInvariant();
    note.Content = request.Content;
    note.UpdatedAt = DateTimeOffset.UtcNow;

    session.Notes = request.LegacyNotes;

    await db.SaveChangesAsync();

    return Results.Ok();
});

api.MapGet("/clients/{id:int}/notes", async (int id, LuminaDbContext db, HttpContext context) =>
{
    var scope = await ResolveScopeAsync(context, db);
    if (scope is null) return Results.Unauthorized();

    var clientExists = await db.Clients.AnyAsync(c => c.Id == id && c.PracticeId == scope.Value.practiceId);
    if (!clientExists) return Results.NotFound();

    var notes = await db.SessionNotes
        .AsNoTracking()
        .Where(n => n.ClientId == id && n.SessionId == null)
        .OrderByDescending(n => n.CreatedAt)
        .Select(n => new
        {
            id = n.Id,
            clientId = n.ClientId,
            sessionId = n.SessionId,
            type = n.NoteType,
            content = n.Content,
            source = n.Source,
            createdAt = n.CreatedAt,
            updatedAt = n.UpdatedAt
        })
        .ToListAsync();

    return Results.Ok(notes);
});

api.MapPost("/clients/{id:int}/notes", async (int id, ClientNoteCreateRequest request, LuminaDbContext db, HttpContext context) =>
{
    var scope = await ResolveScopeAsync(context, db);
    if (scope is null) return Results.Unauthorized();

    var clientExists = await db.Clients.AnyAsync(c => c.Id == id && c.PracticeId == scope.Value.practiceId);
    if (!clientExists) return Results.NotFound();
    if (string.IsNullOrWhiteSpace(request.Content)) return Results.BadRequest(new { message = "Content is required." });

    var now = DateTimeOffset.UtcNow;
    var note = new SessionNote
    {
        ClientId = id,
        SessionId = null,
        NoteType = string.IsNullOrWhiteSpace(request.Type) ? "general" : request.Type.Trim().ToLowerInvariant(),
        Source = string.IsNullOrWhiteSpace(request.Source) ? "client-detail" : request.Source.Trim(),
        Content = request.Content.Trim(),
        CreatedAt = now,
        UpdatedAt = now
    };

    db.SessionNotes.Add(note);
    await db.SaveChangesAsync();

    return Results.Ok(new { id = note.Id });
});

api.MapGet("/clients/{id:int}/packages", async (int id, LuminaDbContext db, HttpContext context) =>
{
    var scope = await ResolveScopeAsync(context, db);
    if (scope is null) return Results.Unauthorized();
    await AutoCompletePastScheduledSessionsAsync(db, scope.Value.practiceId);

    var clientExists = await db.Clients.AnyAsync(c => c.Id == id && c.PracticeId == scope.Value.practiceId);
    if (!clientExists) return Results.NotFound();

    var packages = (await db.ClientPackages
        .AsNoTracking()
        .Where(cp => cp.PracticeId == scope.Value.practiceId && cp.ClientId == id)
        .Include(cp => cp.Package)
        .Include(cp => cp.Sessions)
        .Select(cp => new
        {
            id = cp.Id,
            packageId = cp.PackageId,
            packageName = cp.Package.Name,
            purchasedAt = cp.PurchasedAt,
            totalSessions = cp.Package.SessionCount,
            remainingSessions = Math.Max(
                0,
                cp.Package.SessionCount - cp.Sessions.Count(s => s.Status == SessionStatus.Upcoming || s.Status == SessionStatus.Completed || s.Status == SessionStatus.NoShow)),
            scheduledSessions = cp.Sessions.Count(s => s.Status == SessionStatus.Upcoming),
            usedSessions = cp.Sessions.Count(s => s.Status == SessionStatus.Completed || s.Status == SessionStatus.NoShow),
            cancelledSessions = cp.Sessions.Count(s => s.Status == SessionStatus.Cancelled),
            price = cp.Package.Price,
            paymentAmount = cp.PaymentAmount,
            paymentStatus = cp.PaymentStatus.ToString().ToLowerInvariant(),
            paymentDate = cp.PaymentDate,
            paymentMethod = cp.PaymentMethod,
            status =
                cp.Sessions.Count(s => s.Status == SessionStatus.Completed || s.Status == SessionStatus.NoShow) >= cp.Package.SessionCount
                    ? "completed"
                    : cp.Package.SessionCount - cp.Sessions.Count(s => s.Status == SessionStatus.Upcoming || s.Status == SessionStatus.Completed || s.Status == SessionStatus.NoShow) <= 0
                        ? "fullyScheduled"
                        : "active"
        })
        .ToListAsync())
        .OrderByDescending(cp => cp.purchasedAt)
        .ToList();

    return Results.Ok(packages);
});

api.MapPost("/clients/{clientId:int}/packages/{clientPackageId:int}/mark-paid", async (
    int clientId,
    int clientPackageId,
    SessionPaymentRequest request,
    LuminaDbContext db,
    HttpContext context) =>
{
    var scope = await ResolveScopeAsync(context, db);
    if (scope is null) return Results.Unauthorized();

    var clientPackage = await db.ClientPackages
        .Include(cp => cp.Package)
        .FirstOrDefaultAsync(cp =>
            cp.Id == clientPackageId &&
            cp.ClientId == clientId &&
            cp.PracticeId == scope.Value.practiceId);

    if (clientPackage is null) return Results.NotFound();

    var amount = decimal.Round(
        request.Amount ?? clientPackage.PaymentAmount ?? clientPackage.Package.Price ?? 0m,
        2,
        MidpointRounding.AwayFromZero);

    if (amount <= 0)
    {
        return Results.BadRequest(new { message = "Payment amount must be greater than 0." });
    }

    clientPackage.PaymentAmount = amount;
    clientPackage.PaymentStatus = PaymentStatus.Paid;
    clientPackage.PaymentDate = request.PaymentDate ?? DateTimeOffset.UtcNow;
    clientPackage.PaymentMethod = string.IsNullOrWhiteSpace(request.PaymentMethod)
        ? "manual"
        : request.PaymentMethod.Trim();

    await db.SaveChangesAsync();
    return Results.Ok();
});

api.MapPut("/clients/{clientId:int}/packages/{clientPackageId:int}/payment", async (
    int clientId,
    int clientPackageId,
    SessionPaymentUpdateRequest request,
    LuminaDbContext db,
    HttpContext context) =>
{
    var scope = await ResolveScopeAsync(context, db);
    if (scope is null) return Results.Unauthorized();

    var clientPackage = await db.ClientPackages
        .Include(cp => cp.Package)
        .FirstOrDefaultAsync(cp =>
            cp.Id == clientPackageId &&
            cp.ClientId == clientId &&
            cp.PracticeId == scope.Value.practiceId);

    if (clientPackage is null) return Results.NotFound();

    var amount = request.Amount.HasValue
        ? decimal.Round(request.Amount.Value, 2, MidpointRounding.AwayFromZero)
        : (decimal?)null;

    if (amount <= 0)
    {
        return Results.BadRequest(new { message = "Payment amount must be greater than 0." });
    }

    if (request.PaymentStatus == PaymentStatus.Paid && amount is null)
    {
        amount = decimal.Round(
            clientPackage.PaymentAmount ?? clientPackage.Package.Price ?? 0m,
            2,
            MidpointRounding.AwayFromZero);
    }

    if (request.PaymentStatus == PaymentStatus.Paid && amount <= 0)
    {
        return Results.BadRequest(new { message = "Payment amount must be greater than 0." });
    }

    clientPackage.PaymentAmount = amount;
    clientPackage.PaymentStatus = request.PaymentStatus;
    clientPackage.PaymentDate = request.PaymentStatus == PaymentStatus.Paid
        ? request.PaymentDate ?? clientPackage.PaymentDate ?? DateTimeOffset.UtcNow
        : request.PaymentDate;
    clientPackage.PaymentMethod = string.IsNullOrWhiteSpace(request.PaymentMethod)
        ? null
        : request.PaymentMethod.Trim();

    await db.SaveChangesAsync();
    return Results.Ok();
});

api.MapGet("/billing/summary", async (LuminaDbContext db, HttpContext context) =>
{
    var scope = await ResolveScopeAsync(context, db);
    if (scope is null) return Results.Unauthorized();

    var practice = await db.Practices.AsNoTracking().FirstOrDefaultAsync(p => p.Id == scope.Value.practiceId);
    if (practice is null) return Results.NotFound();
    var billingFilters = GetBillingFilters(context);

    var sessions = await db.Sessions
        .AsNoTracking()
        .Include(s => s.Invoice)
        .Where(s =>
            s.PracticeId == scope.Value.practiceId &&
            s.ClientPackageId == null &&
            s.Status != SessionStatus.Cancelled &&
            (!billingFilters.ClientId.HasValue || s.ClientId == billingFilters.ClientId.Value))
        .ToListAsync();

    var packages = await db.ClientPackages
        .AsNoTracking()
        .Include(cp => cp.Package)
        .Where(cp =>
            cp.PracticeId == scope.Value.practiceId &&
            (!billingFilters.ClientId.HasValue || cp.ClientId == billingFilters.ClientId.Value))
        .ToListAsync();

    var sessionPayments = sessions
        .Select(s => new
        {
            Amount = GetSessionPaymentAmount(s, practice.BillingDefaultSessionAmount),
            Status = s.PaymentStatus,
            ServiceDate = s.Date,
            PaymentDate = s.PaymentDate
        })
        .Where(payment =>
            payment.Amount > 0 &&
            IsBillingServiceDateInRange(payment.ServiceDate, billingFilters));

    var packagePayments = packages
        .Select(cp => new
        {
            Amount = GetPackagePaymentAmount(cp),
            Status = cp.PaymentStatus,
            ServiceDate = cp.PurchasedAt,
            PaymentDate = cp.PaymentDate
        })
        .Where(payment =>
            payment.Amount > 0 &&
            IsBillingServiceDateInRange(payment.ServiceDate, billingFilters));

    var allPayments = sessionPayments.Concat(packagePayments).ToList();
    var totalRevenue = allPayments.Where(payment => payment.Status == PaymentStatus.Paid).Sum(payment => payment.Amount);
    var pendingAmount = allPayments.Where(payment => payment.Status != PaymentStatus.Paid).Sum(payment => payment.Amount);

    return Results.Ok(new
    {
        totalRevenue,
        pendingAmount,
        overdueAmount = 0m,
        paidCount = allPayments.Count(payment => payment.Status == PaymentStatus.Paid),
        dueCount = allPayments.Count(payment => payment.Status != PaymentStatus.Paid)
    });
});

api.MapGet("/billing/payments", async (LuminaDbContext db, HttpContext context) =>
{
    var scope = await ResolveScopeAsync(context, db);
    if (scope is null) return Results.Unauthorized();

    var practice = await db.Practices.AsNoTracking().FirstOrDefaultAsync(p => p.Id == scope.Value.practiceId);
    if (practice is null) return Results.NotFound();
    var billingFilters = GetBillingFilters(context);

    var sessionPayments = (await db.Sessions
        .AsNoTracking()
        .Include(s => s.Client)
        .Include(s => s.Invoice)
        .Where(s =>
            s.PracticeId == scope.Value.practiceId &&
            s.ClientPackageId == null &&
            s.Status != SessionStatus.Cancelled &&
            (!billingFilters.ClientId.HasValue || s.ClientId == billingFilters.ClientId.Value))
        .ToListAsync())
        .Select(s => new BillingPaymentItem(
            id: $"session-{s.Id}",
            sourceType: "session",
            sourceId: s.Id,
            clientId: s.ClientId,
            clientName: s.Client.Name,
            description: string.IsNullOrWhiteSpace(s.SessionType) ? "Session" : s.SessionType,
            amount: GetSessionPaymentAmount(s, practice.BillingDefaultSessionAmount),
            paymentStatus: s.PaymentStatus.ToString().ToLowerInvariant(),
            billingSource: GetSessionBillingSource(s),
            serviceDate: s.Date,
            paymentDate: s.PaymentDate,
            paymentMethod: s.PaymentMethod))
        .Where(payment =>
            payment.amount > 0 &&
            IsBillingServiceDateInRange(payment.serviceDate, billingFilters));

    var packagePayments = (await db.ClientPackages
        .AsNoTracking()
        .Include(cp => cp.Client)
        .Include(cp => cp.Package)
        .Where(cp =>
            cp.PracticeId == scope.Value.practiceId &&
            (!billingFilters.ClientId.HasValue || cp.ClientId == billingFilters.ClientId.Value))
        .ToListAsync())
        .Select(cp => new BillingPaymentItem(
            id: $"package-{cp.Id}",
            sourceType: "package",
            sourceId: cp.Id,
            clientId: cp.ClientId,
            clientName: cp.Client.Name,
            description: cp.Package.Name,
            amount: GetPackagePaymentAmount(cp),
            paymentStatus: cp.PaymentStatus.ToString().ToLowerInvariant(),
            billingSource: "package",
            serviceDate: cp.PurchasedAt,
            paymentDate: cp.PaymentDate,
            paymentMethod: cp.PaymentMethod))
        .Where(payment =>
            payment.amount > 0 &&
            IsBillingServiceDateInRange(payment.serviceDate, billingFilters));

    var payments = sessionPayments
        .Concat(packagePayments)
        .OrderBy(payment => payment.paymentStatus == "paid" ? 1 : 0)
        .ThenByDescending(payment => payment.serviceDate)
        .ToList();

    return Results.Ok(payments);
});

api.MapGet("/billing/invoices", async (LuminaDbContext db, HttpContext context) =>
{
    var scope = await ResolveScopeAsync(context, db);
    if (scope is null) return Results.Unauthorized();
    await MarkOverdueInvoicesAsync(db, scope.Value.practiceId);

    var invoices = await db.Invoices.Where(i => i.PracticeId == scope.Value.practiceId).Include(i => i.Client).OrderByDescending(i => i.CreatedAt).Select(i => new
    {
        id = i.Id,
        invoiceNumber = i.InvoiceNumber,
        clientName = i.Client.Name,
        clientId = i.ClientId,
        amount = i.Amount,
        date = i.CreatedAt,
        dueDate = i.DueDate,
        status = i.Status.ToString().ToLowerInvariant(),
        sessionCount = i.Sessions.Count,
        description = i.Description
    }).ToListAsync();

    return Results.Ok(invoices);
});

api.MapPost("/billing/monthly-invoices", async (MonthlyInvoiceRequest request, LuminaDbContext db, HttpContext context) =>
{
    var scope = await ResolveScopeAsync(context, db);
    if (scope is null) return Results.Unauthorized();

    var year = request.Year ?? DateTime.UtcNow.AddMonths(-1).Year;
    var month = request.Month ?? DateTime.UtcNow.AddMonths(-1).Month;
    if (year < 2000 || month is < 1 or > 12)
    {
        return Results.BadRequest(new { message = "Provide a valid billing year and month." });
    }

    var periodStart = new DateTimeOffset(year, month, 1, 0, 0, 0, TimeSpan.Zero);
    var periodEnd = periodStart.AddMonths(1);
    var dueDate = request.DueDate ?? DateOnly.FromDateTime(DateTime.UtcNow.Date.AddDays(DefaultInvoiceDueDays));

    await using var transaction = await db.Database.BeginTransactionAsync(IsolationLevel.Serializable);

    var practice = await db.Practices.AsNoTracking().FirstOrDefaultAsync(p => p.Id == scope.Value.practiceId);
    if (practice is null) return Results.NotFound();

    if (request.DueDate is null)
    {
        dueDate = DateOnly.FromDateTime(DateTime.UtcNow.Date.AddDays(practice.BillingDefaultDueDays));
    }

    var eligibleSessions = await db.Sessions
        .Include(s => s.Client)
        .Where(s =>
            s.PracticeId == scope.Value.practiceId &&
            s.Client.BillingModel == BillingModel.Monthly &&
            (!request.ClientId.HasValue || s.ClientId == request.ClientId.Value) &&
            s.ClientPackageId == null &&
            s.InvoiceId == null &&
            s.Date >= periodStart &&
            s.Date < periodEnd &&
            s.Status != SessionStatus.Cancelled &&
            s.PaymentStatus != PaymentStatus.Paid)
        .ToListAsync();

    var sessionsByClient = eligibleSessions
        .GroupBy(s => s.ClientId)
        .Where(group => group.Any())
        .ToList();

    var invoiceNumbers = await GenerateInvoiceNumbersAsync(db, scope.Value.practiceId, sessionsByClient.Count);
    var createdInvoices = new List<Invoice>();
    var invoiceIndex = 0;

    foreach (var group in sessionsByClient)
    {
        var client = group.First().Client;
        var sessions = group.ToList();
        var amount = sessions.Sum(session => session.PaymentAmount ?? practice.BillingDefaultSessionAmount);

        if (amount <= 0)
        {
            continue;
        }

        var invoice = new Invoice
        {
            PracticeId = scope.Value.practiceId,
            ClientId = client.Id,
            InvoiceNumber = invoiceNumbers[invoiceIndex++],
            Description = $"{periodStart:MMMM yyyy} coaching sessions",
            Amount = decimal.Round(amount, 2, MidpointRounding.AwayFromZero),
            DueDate = dueDate,
            Status = InvoiceStatus.Pending,
            CreatedAt = DateTimeOffset.UtcNow
        };

        db.Invoices.Add(invoice);
        foreach (var session in sessions)
        {
            session.Invoice = invoice;
            session.PaymentStatus = PaymentStatus.Pending;
            session.PaymentAmount ??= practice.BillingDefaultSessionAmount;
        }

        createdInvoices.Add(invoice);
    }

    await db.SaveChangesAsync();
    await transaction.CommitAsync();

    return Results.Ok(new
    {
        createdCount = createdInvoices.Count,
        invoiceIds = createdInvoices.Select(invoice => invoice.Id).ToList()
    });
});

api.MapPost("/billing/invoices/{id:int}/mark-paid", async (int id, LuminaDbContext db, HttpContext context) =>
{
    var scope = await ResolveScopeAsync(context, db);
    if (scope is null) return Results.Unauthorized();

    var invoice = await db.Invoices
        .FirstOrDefaultAsync(i => i.Id == id && i.PracticeId == scope.Value.practiceId);

    if (invoice is null) return Results.NotFound();

    invoice.Status = InvoiceStatus.Paid;
    var invoiceSessions = await db.Sessions
        .Where(session => session.InvoiceId == invoice.Id && session.PracticeId == scope.Value.practiceId)
        .ToListAsync();

    foreach (var session in invoiceSessions)
    {
        session.PaymentStatus = PaymentStatus.Paid;
        session.PaymentDate ??= DateTimeOffset.UtcNow;
        session.PaymentMethod ??= "manual";
        session.PaymentAmount ??= invoice.Amount / Math.Max(1, invoiceSessions.Count);
    }

    await db.SaveChangesAsync();
    return Results.Ok();
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
        avatarColor = "#9B8B9E"
    }).ToListAsync();

    return Results.Ok(providers);
});

api.MapGet("/settings/packages", async (LuminaDbContext db, HttpContext context) =>
{
    var scope = await ResolveScopeAsync(context, db);
    if (scope is null) return Results.Unauthorized();

    var packages = await db.Packages
        .AsNoTracking()
        .Where(p => p.PracticeId == scope.Value.practiceId)
        .OrderBy(p => p.Id)
        .Select(p => new
        {
            id = p.Id,
            name = p.Name,
            sessionCount = p.SessionCount,
            price = p.Price,
            billingType = p.BillingType,
            status = p.IsActive ? "Active" : "Inactive",
            enabled = p.IsActive
        })
        .ToListAsync();

    return Results.Ok(packages);
});

api.MapPost("/settings/packages", async (CreatePackageRequest request, LuminaDbContext db, HttpContext context) =>
{
    var scope = await ResolveScopeAsync(context, db);
    if (scope is null) return Results.Unauthorized();

    var name = request.Name?.Trim();
    if (string.IsNullOrWhiteSpace(name))
    {
        return Results.BadRequest(new { message = "Package name is required." });
    }

    if (request.SessionCount <= 0)
    {
        return Results.BadRequest(new { message = "Session count must be greater than 0." });
    }

    if (request.Price <= 0)
    {
        return Results.BadRequest(new { message = "Price must be greater than 0." });
    }

    var package = new Package
    {
        PracticeId = scope.Value.practiceId,
        Name = name,
        BillingType = "oneTime",
        SessionCount = request.SessionCount,
        Price = decimal.Round(request.Price, 2, MidpointRounding.AwayFromZero),
        IsActive = request.Enabled
    };

    db.Packages.Add(package);
    await db.SaveChangesAsync();

    return Results.Ok(new
    {
        id = package.Id,
        name = package.Name,
        sessionCount = package.SessionCount,
        price = package.Price,
        billingType = package.BillingType,
        status = package.IsActive ? "Active" : "Inactive",
        enabled = package.IsActive
    });
});

api.MapPut("/settings/packages/{id:int}", async (int id, UpdatePackageRequest request, LuminaDbContext db, HttpContext context) =>
{
    var scope = await ResolveScopeAsync(context, db);
    if (scope is null) return Results.Unauthorized();

    var package = await db.Packages
        .FirstOrDefaultAsync(p => p.Id == id && p.PracticeId == scope.Value.practiceId);

    if (package is null) return Results.NotFound();

    var name = request.Name?.Trim();
    if (string.IsNullOrWhiteSpace(name))
    {
        return Results.BadRequest(new { message = "Package name is required." });
    }

    if (request.SessionCount <= 0)
    {
        return Results.BadRequest(new { message = "Session count must be greater than 0." });
    }

    if (request.Price <= 0)
    {
        return Results.BadRequest(new { message = "Price must be greater than 0." });
    }

    package.Name = name;
    package.SessionCount = request.SessionCount;
    package.Price = decimal.Round(request.Price, 2, MidpointRounding.AwayFromZero);
    package.IsActive = request.Enabled;

    await db.SaveChangesAsync();

    return Results.Ok(new
    {
        id = package.Id,
        name = package.Name,
        sessionCount = package.SessionCount,
        price = package.Price,
        billingType = package.BillingType,
        status = package.IsActive ? "Active" : "Inactive",
        enabled = package.IsActive
    });
});

api.MapGet("/settings/billing", async (LuminaDbContext db, HttpContext context) =>
{
    var scope = await ResolveScopeAsync(context, db);
    if (scope is null) return Results.Unauthorized();

    var practice = await db.Practices
        .AsNoTracking()
        .FirstOrDefaultAsync(p => p.Id == scope.Value.practiceId);

    if (practice is null) return Results.NotFound();

    return Results.Ok(MapBillingSettingsResponse(practice));
});

api.MapPut("/settings/billing", async (BillingSettingsRequest request, LuminaDbContext db, HttpContext context) =>
{
    var scope = await ResolveScopeAsync(context, db);
    if (scope is null) return Results.Unauthorized();

    var practice = await db.Practices
        .FirstOrDefaultAsync(p => p.Id == scope.Value.practiceId);

    if (practice is null) return Results.NotFound();

    if (request.DefaultDueDays <= 0)
    {
        return Results.BadRequest(new { message = "Default due days must be greater than 0." });
    }

    if (request.DefaultSessionAmount <= 0)
    {
        return Results.BadRequest(new { message = "Default session amount must be greater than 0." });
    }

    practice.BillingDefaultDueDays = request.DefaultDueDays;
    practice.BillingDefaultSessionAmount = decimal.Round(request.DefaultSessionAmount, 2, MidpointRounding.AwayFromZero);

    await db.SaveChangesAsync();

    return Results.Ok(MapBillingSettingsResponse(practice));
});

api.MapGet("/settings/notes", async (LuminaDbContext db, HttpContext context) =>
{
    var scope = await ResolveScopeAsync(context, db);
    if (scope is null) return Results.Unauthorized();

    var practice = await db.Practices
        .AsNoTracking()
        .FirstOrDefaultAsync(p => p.Id == scope.Value.practiceId);

    if (practice is null) return Results.NotFound();

    return Results.Ok(MapNotesTemplateSettingsResponse(practice));
});

api.MapPut("/settings/notes", async (NotesTemplateSettingsRequest request, LuminaDbContext db, HttpContext context) =>
{
    var scope = await ResolveScopeAsync(context, db);
    if (scope is null) return Results.Unauthorized();

    var practice = await db.Practices
        .FirstOrDefaultAsync(p => p.Id == scope.Value.practiceId);

    if (practice is null) return Results.NotFound();

    var templateMode = string.IsNullOrWhiteSpace(request.TemplateMode)
        ? "default"
        : request.TemplateMode.Trim().ToLowerInvariant();

    if (templateMode is not ("default" or "template"))
    {
        return Results.BadRequest(new { message = "Invalid templateMode." });
    }

    var selectedTemplateKind = string.IsNullOrWhiteSpace(request.SelectedTemplateKind)
        ? null
        : request.SelectedTemplateKind.Trim().ToLowerInvariant();
    var selectedTemplateId = request.SelectedTemplateId;

    if ((selectedTemplateKind is null) != (!selectedTemplateId.HasValue))
    {
        return Results.BadRequest(new { message = "selectedTemplateKind and selectedTemplateId must both be provided." });
    }

    if (selectedTemplateKind is not null)
    {
        if (selectedTemplateKind is not ("preset" or "custom"))
        {
            return Results.BadRequest(new { message = "Invalid selectedTemplateKind." });
        }

        var templateExists = selectedTemplateKind == "preset"
            ? await db.TemplatePresets.AnyAsync(p => p.Id == selectedTemplateId && p.IsActive)
            : await db.Templates.AnyAsync(t => t.Id == selectedTemplateId && t.PracticeId == scope.Value.practiceId);

        if (!templateExists)
        {
            return Results.BadRequest(new { message = "Selected template was not found." });
        }
    }

    practice.NotesTemplateMode = templateMode;
    practice.NotesSelectedTemplateKind = selectedTemplateKind;
    practice.NotesSelectedTemplateId = selectedTemplateId;

    await db.SaveChangesAsync();

    return Results.Ok(MapNotesTemplateSettingsResponse(practice));
});

api.MapGet("/templates/presets", async (LuminaDbContext db) =>
{
    var presets = await db.TemplatePresets
        .Where(p => p.IsActive)
        .OrderBy(p => p.Name)
        .Select(p => new
        {
            id = p.Id,
            name = p.Name,
            description = p.Description,
            fields = p.Fields.OrderBy(f => f.SortOrder).Select(f => f.Label).ToList()
        })
        .ToListAsync();

    return Results.Ok(presets);
});

api.MapGet("/templates/custom", async (int? practiceId, LuminaDbContext db, HttpContext context) =>
{
    var scope = await ResolveScopeAsync(context, db);
    if (scope is null) return Results.Unauthorized();

    var resolvedPracticeId = practiceId ?? scope.Value.practiceId;
    if (resolvedPracticeId != scope.Value.practiceId)
    {
        return Results.Forbid();
    }

    var templates = await db.Templates
        .AsNoTracking()
        .Include(t => t.Fields)
        .Where(t => t.PracticeId == resolvedPracticeId)
        .OrderBy(t => t.Name)
        .ToListAsync();

    return Results.Ok(templates.Select(MapTemplateResponse));
});


api.MapPost("/templates/from-preset", async (FromPresetRequest request, LuminaDbContext db, HttpContext context, ILoggerFactory loggerFactory) =>
{
    var logger = loggerFactory.CreateLogger("TemplateDuplication");
    var scope = await ResolveScopeAsync(context, db);
    if (scope is null) return Results.Unauthorized();

    var practiceId = request.PracticeId ?? scope.Value.practiceId;
    if (practiceId != scope.Value.practiceId)
    {
        return Results.Forbid();
    }

    var practiceExists = await db.Practices.AnyAsync(p => p.Id == practiceId);
    if (!practiceExists)
    {
        return Results.BadRequest(new { message = "Invalid practiceId." });
    }

    var preset = await db.TemplatePresets
        .AsNoTracking()
        .FirstOrDefaultAsync(p => p.Id == request.SourcePresetId);
    if (preset is null)
    {
        return Results.BadRequest(new { message = "Invalid sourcePresetId." });
    }

    var presetFields = await db.TemplatePresetFields
        .AsNoTracking()
        .Where(f => f.TemplatePresetId == preset.Id)
        .OrderBy(f => f.SortOrder)
        .ToListAsync();

    var templateName = string.IsNullOrWhiteSpace(request.Name)
        ? $"{preset.Name} (Copy)"
        : request.Name.Trim();

    logger.LogInformation(
        "FromPreset called. PracticeId={PracticeId}; SourcePresetId={SourcePresetId}",
        practiceId,
        request.SourcePresetId);

    await using var transaction = await db.Database.BeginTransactionAsync();

    var template = new Template
    {
        PracticeId = practiceId,
        Name = templateName,
        Description = preset.Description,
        SourcePresetId = preset.Id,
        CreatedAt = DateTimeOffset.UtcNow
    };

    db.Templates.Add(template);
    await db.SaveChangesAsync();

    var templateFields = presetFields.Select(presetField => new TemplateField
    {
        TemplateId = template.Id,
        Label = presetField.Label,
        SortOrder = presetField.SortOrder,
        FieldType = presetField.FieldType
    }).ToList();

    db.TemplateFields.AddRange(templateFields);
    await db.SaveChangesAsync();
    await transaction.CommitAsync();

    logger.LogInformation(
        "FromPreset persisted. PracticeId={PracticeId}; SourcePresetId={SourcePresetId}; CreatedTemplateId={CreatedTemplateId}; FieldCount={FieldCount}",
        practiceId,
        request.SourcePresetId,
        template.Id,
        templateFields.Count);

    var createdTemplate = await db.Templates
        .AsNoTracking()
        .Include(t => t.Fields)
        .FirstAsync(t => t.Id == template.Id);

    return Results.Ok(MapTemplateResponse(createdTemplate));
});

api.MapPut("/templates/{templateId:int}", async (int templateId, TemplateUpdateRequest request, LuminaDbContext db, HttpContext context, ILoggerFactory loggerFactory) =>
{
    var logger = loggerFactory.CreateLogger("TemplateUpdates");
    var scope = await ResolveScopeAsync(context, db);
    if (scope is null) return Results.Unauthorized();

    if (request.PracticeId != scope.Value.practiceId)
    {
        return Results.Forbid();
    }

    if (string.IsNullOrWhiteSpace(request.Name))
    {
        return Results.BadRequest(new { message = "Template name is required." });
    }

    var template = await db.Templates
        .Include(t => t.Fields)
        .FirstOrDefaultAsync(t => t.Id == templateId && t.PracticeId == request.PracticeId);

    if (template is null)
    {
        return Results.NotFound(new { message = "Template not found for this practice." });
    }

    var incomingFields = (request.Fields ?? [])
        .Select((field, index) => new
        {
            field.Id,
            Label = (field.Label ?? string.Empty).Trim(),
            FieldType = string.IsNullOrWhiteSpace(field.FieldType) ? null : field.FieldType.Trim(),
            SortOrder = field.SortOrder > 0 ? field.SortOrder : index + 1,
            PayloadOrder = index
        })
        .Where(field => !string.IsNullOrWhiteSpace(field.Label))
        .OrderBy(field => field.SortOrder)
        .ThenBy(field => field.PayloadOrder)
        .ToList();

    template.Name = request.Name.Trim();
    template.Description = request.Description?.Trim() ?? string.Empty;

    var existingById = template.Fields.ToDictionary(field => field.Id);
    var incomingIds = incomingFields.Where(field => field.Id > 0).Select(field => field.Id).ToHashSet();

    var toDelete = template.Fields.Where(field => !incomingIds.Contains(field.Id)).ToList();
    if (toDelete.Count > 0)
    {
        db.TemplateFields.RemoveRange(toDelete);
    }

    var inserted = 0;
    var updated = 0;
    var normalizedSortOrder = 1;

    foreach (var field in incomingFields)
    {
        if (field.Id > 0 && existingById.TryGetValue(field.Id, out var existingField))
        {
            existingField.Label = field.Label;
            existingField.FieldType = field.FieldType;
            existingField.SortOrder = normalizedSortOrder++;
            updated++;
            continue;
        }

        db.TemplateFields.Add(new TemplateField
        {
            TemplateId = template.Id,
            Label = field.Label,
            FieldType = field.FieldType,
            SortOrder = normalizedSortOrder++
        });
        inserted++;
    }

    await db.SaveChangesAsync();

    logger.LogInformation(
        "Template update persisted. TemplateId={TemplateId}; PracticeId={PracticeId}; FieldCount={FieldCount}; Inserted={Inserted}; Updated={Updated}; Deleted={Deleted}",
        templateId,
        request.PracticeId,
        incomingFields.Count,
        inserted,
        updated,
        toDelete.Count);

    var updatedTemplate = await db.Templates
        .AsNoTracking()
        .Include(t => t.Fields)
        .FirstAsync(t => t.Id == template.Id);

    return Results.Ok(MapTemplateResponse(updatedTemplate));
});

api.MapDelete("/templates/{templateId:int}", async (int templateId, LuminaDbContext db, HttpContext context) =>
{
    var scope = await ResolveScopeAsync(context, db);
    if (scope is null) return Results.Unauthorized();

    var template = await db.Templates
        .FirstOrDefaultAsync(t => t.Id == templateId && t.PracticeId == scope.Value.practiceId);

    if (template is null) return Results.NotFound();
    if (template.SourcePresetId.HasValue) return Results.BadRequest(new { message = "Seeded templates cannot be deleted." });

    db.Templates.Remove(template);
    await db.SaveChangesAsync();
    return Results.NoContent();
});

api.MapGet("/reports/custom", async (LuminaDbContext db, HttpContext context) =>
{
    var scope = await ResolveScopeAsync(context, db);
    if (scope is null) return Results.Unauthorized();

    var reports = await db.SavedReports
        .AsNoTracking()
        .Where(report =>
            report.PracticeId == scope.Value.practiceId &&
            report.ProviderId == scope.Value.providerId)
        .OrderBy(report => report.Name)
        .ToListAsync();

    return Results.Ok(reports.Select(MapSavedReportResponse));
});

api.MapPost("/reports/custom", async (SavedReportUpsertRequest request, LuminaDbContext db, HttpContext context) =>
{
    var scope = await ResolveScopeAsync(context, db);
    if (scope is null) return Results.Unauthorized();

    var validationError = await ValidateSavedReportRequestAsync(request, db, scope.Value.practiceId);
    if (validationError is not null)
    {
        return Results.BadRequest(new { message = validationError });
    }

    var now = DateTimeOffset.UtcNow;
    var report = new SavedReport
    {
        PracticeId = scope.Value.practiceId,
        ProviderId = scope.Value.providerId,
        Name = request.Name.Trim(),
        ReportType = request.ReportType.Trim(),
        TemplateId = request.TemplateId,
        TemplateFieldId = request.TemplateFieldId,
        FieldKey = string.IsNullOrWhiteSpace(request.FieldKey) ? null : request.FieldKey.Trim(),
        AnalysisType = string.IsNullOrWhiteSpace(request.AnalysisType) ? null : request.AnalysisType.Trim(),
        FiltersJson = NormalizeReportJson(request.FiltersJson),
        DisplayOptionsJson = NormalizeReportJson(request.DisplayOptionsJson),
        CreatedAt = now,
        UpdatedAt = now
    };

    db.SavedReports.Add(report);
    await db.SaveChangesAsync();

    return Results.Ok(MapSavedReportResponse(report));
});

api.MapPut("/reports/custom/{id:int}", async (int id, SavedReportUpsertRequest request, LuminaDbContext db, HttpContext context) =>
{
    var scope = await ResolveScopeAsync(context, db);
    if (scope is null) return Results.Unauthorized();

    var report = await db.SavedReports.FirstOrDefaultAsync(savedReport =>
        savedReport.Id == id &&
        savedReport.PracticeId == scope.Value.practiceId &&
        savedReport.ProviderId == scope.Value.providerId);

    if (report is null)
    {
        return Results.NotFound(new { message = "Saved report not found." });
    }

    var validationError = await ValidateSavedReportRequestAsync(request, db, scope.Value.practiceId);
    if (validationError is not null)
    {
        return Results.BadRequest(new { message = validationError });
    }

    report.Name = request.Name.Trim();
    report.ReportType = request.ReportType.Trim();
    report.TemplateId = request.TemplateId;
    report.TemplateFieldId = request.TemplateFieldId;
    report.FieldKey = string.IsNullOrWhiteSpace(request.FieldKey) ? null : request.FieldKey.Trim();
    report.AnalysisType = string.IsNullOrWhiteSpace(request.AnalysisType) ? null : request.AnalysisType.Trim();
    report.FiltersJson = NormalizeReportJson(request.FiltersJson);
    report.DisplayOptionsJson = NormalizeReportJson(request.DisplayOptionsJson);
    report.UpdatedAt = DateTimeOffset.UtcNow;

    await db.SaveChangesAsync();

    return Results.Ok(MapSavedReportResponse(report));
});

api.MapDelete("/reports/custom/{id:int}", async (int id, LuminaDbContext db, HttpContext context) =>
{
    var scope = await ResolveScopeAsync(context, db);
    if (scope is null) return Results.Unauthorized();

    var report = await db.SavedReports.FirstOrDefaultAsync(savedReport =>
        savedReport.Id == id &&
        savedReport.PracticeId == scope.Value.practiceId &&
        savedReport.ProviderId == scope.Value.providerId);

    if (report is null)
    {
        return Results.NotFound(new { message = "Saved report not found." });
    }

    db.SavedReports.Remove(report);
    await db.SaveChangesAsync();
    return Results.NoContent();
});

api.MapGet("/data-export", async (IDataExportService exportService, LuminaDbContext db, HttpContext context, CancellationToken cancellationToken) =>
{
    var scope = await ResolveScopeAsync(context, db);
    if (scope is null) return Results.Unauthorized();

    var export = await exportService.ExportPracticeDataAsync(scope.Value.practiceId, cancellationToken);
    return Results.File(export.Content, export.ContentType, export.FileName);
});

api.MapGet("/data-export/import-template", (IDataExportService exportService) =>
{
    var template = exportService.CreateImportTemplate();
    return Results.File(template.Content, template.ContentType, template.FileName);
});

api.MapPost("/data-export/import", async (IDataImportService importService, LuminaDbContext db, HttpContext context, CancellationToken cancellationToken) =>
{
    var scope = await ResolveScopeAsync(context, db);
    if (scope is null) return Results.Unauthorized();

    if (!context.Request.HasFormContentType)
    {
        return Results.BadRequest(new { message = "Please upload the Excel import template." });
    }

    var form = await context.Request.ReadFormAsync(cancellationToken);
    var file = form.Files.GetFile("file");
    if (file is null || file.Length == 0)
    {
        return Results.BadRequest(new { message = "Please choose an Excel file to import." });
    }

    var extension = Path.GetExtension(file.FileName);
    if (!string.Equals(extension, ".xlsx", StringComparison.OrdinalIgnoreCase))
    {
        return Results.BadRequest(new { message = "Please upload the Lumina Excel import template (.xlsx)." });
    }

    await using var stream = file.OpenReadStream();
    var result = await importService.ImportPracticeDataAsync(
        scope.Value.practiceId,
        scope.Value.providerId,
        stream,
        cancellationToken);

    if (!result.Success)
    {
        return Results.BadRequest(new
        {
            message = "Please fix the import template and try again.",
            errors = result.Errors
        });
    }

    return Results.Ok(new
    {
        clientsImported = result.ClientsImported,
        sessionsImported = result.SessionsImported,
        notesImported = result.NotesImported
    });
});

api.MapGet("/dashboard", async (LuminaDbContext db, HttpContext context) =>
{
    var scope = await ResolveScopeAsync(context, db);
    if (scope is null) return Results.Unauthorized();
    await AutoCompletePastScheduledSessionsAsync(db, scope.Value.practiceId);

    var activeClients = await db.Clients.CountAsync(c => c.PracticeId == scope.Value.practiceId && c.Status == ClientStatus.Active);
    var monthStart = new DateTimeOffset(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1, 0, 0, 0, TimeSpan.Zero);
    var nextMonth = monthStart.AddMonths(1);
    var sessionsThisMonth = await db.Sessions.CountAsync(s => s.PracticeId == scope.Value.practiceId && s.Date >= monthStart && s.Date < nextMonth);
    var practice = await db.Practices.AsNoTracking().FirstOrDefaultAsync(p => p.Id == scope.Value.practiceId);
    if (practice is null) return Results.NotFound();

    var billableSessionsThisMonth = await db.Sessions
        .AsNoTracking()
        .Include(s => s.Invoice)
        .Where(s =>
            s.PracticeId == scope.Value.practiceId &&
            s.ClientPackageId == null &&
            s.Status != SessionStatus.Cancelled &&
            s.Date >= monthStart &&
            s.Date < nextMonth)
        .ToListAsync();

    var packagesThisMonth = await db.ClientPackages
        .AsNoTracking()
        .Include(cp => cp.Package)
        .Where(cp =>
            cp.PracticeId == scope.Value.practiceId &&
            cp.PurchasedAt >= monthStart &&
            cp.PurchasedAt < nextMonth)
        .ToListAsync();

    var revenueMtd =
        billableSessionsThisMonth
            .Where(session =>
                session.PaymentStatus == PaymentStatus.Paid)
            .Sum(session => GetSessionPaymentAmount(session, practice.BillingDefaultSessionAmount)) +
        packagesThisMonth
            .Where(package =>
                package.PaymentStatus == PaymentStatus.Paid)
            .Sum(GetPackagePaymentAmount);

    var unpaidMtd =
        billableSessionsThisMonth
            .Where(session => session.PaymentStatus != PaymentStatus.Paid)
            .Sum(session => GetSessionPaymentAmount(session, practice.BillingDefaultSessionAmount)) +
        packagesThisMonth
            .Where(package => package.PaymentStatus != PaymentStatus.Paid)
            .Sum(GetPackagePaymentAmount);

    var upcomingSessions = await db.Sessions.Where(s => s.PracticeId == scope.Value.practiceId && s.Date >= DateTimeOffset.UtcNow).Include(s => s.Client).OrderBy(s => s.Date).Take(4).Select(s => new
    {
        id = s.Id,
        clientId = s.ClientId,
        client = s.Client.Name,
        sessionType = s.SessionType,
        date = s.Date,
        duration = s.Duration,
        location = s.Location.ToString().ToLowerInvariant(),
        status = s.Status.ToString().ToLowerInvariant(),
        focus = s.Focus
    }).ToListAsync();

    var activeClientPreviewData = await db.Clients.Where(c => c.PracticeId == scope.Value.practiceId && c.Status == ClientStatus.Active).Take(4).Select(c => new
    {
        id = c.Id,
        name = c.Name,
        program = c.Program,
        sessionsCompleted = c.Sessions.Count(s => s.Status == SessionStatus.Completed),
        totalSessions = c.Sessions.Count,
        status = c.Status.ToString().ToLowerInvariant(),
        email = c.Email,
        phone = c.Phone,
        startDate = c.StartDate,
        notes = c.Notes
    }).ToListAsync();

    var activeClientPreview = activeClientPreviewData.Select(client => new
    {
        client.id,
        client.name,
        client.program,
        progress = CalculateProgressPercentage(client.sessionsCompleted, client.totalSessions),
        client.sessionsCompleted,
        client.totalSessions,
        client.status,
        client.email,
        client.phone,
        client.startDate,
        client.notes
    });

    return Results.Ok(new { activeClients, sessionsThisMonth, revenueMtd, unpaidMtd, calendarFilledPercent = 15, upcomingSessions, activeClientPreview });
});

var seedEnabled = app.Environment.IsDevelopment() && app.Configuration.GetValue<bool>("Seed:Enabled");
if (seedEnabled)
{
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<LuminaDbContext>();
    var userManager = scope.ServiceProvider.GetRequiredService<UserManager<AppUser>>();
    await DbInitializer.SeedAsync(db, userManager, true);
}

static TemplateResponse MapTemplateResponse(Template template)
{
    var fields = template.Fields
        .OrderBy(f => f.SortOrder)
        .Select(f => new TemplateFieldResponse(f.Id, f.Label, f.SortOrder, f.FieldType))
        .ToList();

    return new TemplateResponse(
        template.Id,
        template.Name,
        template.Description,
        template.PracticeId,
        template.SourcePresetId,
        template.CreatedAt,
        fields,
        fields.Select(field => field.Label).ToList(),
        true);
}

static NotesTemplateSettingsResponse MapNotesTemplateSettingsResponse(Practice practice)
{
    return new NotesTemplateSettingsResponse(
        string.IsNullOrWhiteSpace(practice.NotesTemplateMode)
            ? "default"
            : practice.NotesTemplateMode,
        practice.NotesSelectedTemplateKind,
        practice.NotesSelectedTemplateId);
}

static SavedReportResponse MapSavedReportResponse(SavedReport report) =>
    new(
        report.Id,
        report.Name,
        report.ReportType,
        report.TemplateId,
        report.TemplateFieldId,
        report.FieldKey,
        report.AnalysisType,
        report.FiltersJson,
        report.DisplayOptionsJson,
        report.CreatedAt,
        report.UpdatedAt,
        report.PracticeId,
        report.ProviderId);

static async Task<string?> ValidateSavedReportRequestAsync(
    SavedReportUpsertRequest request,
    LuminaDbContext db,
    int practiceId)
{
    if (string.IsNullOrWhiteSpace(request.Name))
    {
        return "Report name is required.";
    }

    if (string.IsNullOrWhiteSpace(request.ReportType))
    {
        return "Report type is required.";
    }

    if (request.TemplateId.HasValue)
    {
        var templateExists = await db.Templates.AnyAsync(template =>
            template.Id == request.TemplateId.Value &&
            template.PracticeId == practiceId);

        if (!templateExists)
        {
            return "Selected template was not found.";
        }
    }

    if (!IsValidReportJson(request.FiltersJson))
    {
        return "Filters JSON must be valid JSON.";
    }

    if (!IsValidReportJson(request.DisplayOptionsJson))
    {
        return "Display options JSON must be valid JSON.";
    }

    return null;
}

static string NormalizeReportJson(string? value) =>
    string.IsNullOrWhiteSpace(value) ? "{}" : value.Trim();

static bool IsValidReportJson(string? value)
{
    try
    {
        JsonDocument.Parse(NormalizeReportJson(value));
        return true;
    }
    catch (JsonException)
    {
        return false;
    }
}

static BillingSettingsResponse MapBillingSettingsResponse(Practice practice)
{
    return new BillingSettingsResponse(
        practice.BillingDefaultDueDays <= 0 ? DefaultInvoiceDueDays : practice.BillingDefaultDueDays,
        practice.BillingDefaultSessionAmount <= 0 ? DefaultSessionAmount : practice.BillingDefaultSessionAmount);
}

static bool ConsumesPackageCapacity(SessionStatus status) =>
    status is SessionStatus.Upcoming or SessionStatus.Completed or SessionStatus.NoShow;

static int CountCompletedPackageSessions(IEnumerable<Session> sessions) =>
    sessions.Count(session => session.Status is SessionStatus.Completed or SessionStatus.NoShow);

static PackageSessionStats GetPackageSessionStats(
    int totalSessions,
    IEnumerable<Session> sessions)
{
    var sessionList = sessions.ToList();
    var usedSessions = CountCompletedPackageSessions(sessionList);
    var scheduledSessions = sessionList.Count(session => session.Status == SessionStatus.Upcoming);
    var cancelledSessions = sessionList.Count(session => session.Status == SessionStatus.Cancelled);
    var availableSessions = Math.Max(0, totalSessions - usedSessions - scheduledSessions);
    var status = usedSessions >= totalSessions
        ? "completed"
        : availableSessions == 0 && (usedSessions + scheduledSessions) >= totalSessions
            ? "fullyScheduled"
            : "active";

    return new PackageSessionStats(
        usedSessions,
        scheduledSessions,
        cancelledSessions,
        availableSessions,
        status);
}

static int GetAvailablePackageSessions(ClientPackage clientPackage)
{
    var totalSessions = clientPackage.Package.SessionCount;
    var scheduledOrConsumedSessions = clientPackage.Sessions.Count(session => ConsumesPackageCapacity(session.Status));
    return Math.Max(0, totalSessions - scheduledOrConsumedSessions);
}

static async Task AutoCompletePastScheduledSessionsAsync(LuminaDbContext db, int practiceId)
{
    var now = DateTimeOffset.UtcNow;
    var overdueSessions = await db.Sessions
        .Where(session =>
            session.PracticeId == practiceId &&
            session.Status == SessionStatus.Upcoming &&
            session.Date <= now)
        .ToListAsync();

    if (overdueSessions.Count == 0)
    {
        return;
    }

    foreach (var session in overdueSessions)
    {
        session.Status = SessionStatus.Completed;
    }

    await db.SaveChangesAsync();
}

static ApiSessionItem MapSessionDto(Session session, string clientName)
{
    var billingSource = GetSessionBillingSource(session);
    var paymentStatus = GetSessionPaymentStatus(session);

    return new ApiSessionItem(
        session.Id,
        session.ClientId,
        clientName,
        session.SessionType,
        session.Date,
        session.Duration,
        session.Location.ToString().ToLowerInvariant(),
        session.Status.ToString().ToLowerInvariant(),
        paymentStatus,
        paymentStatus,
        billingSource,
        session.ClientPackage?.RemainingSessions,
        session.Focus,
        session.Notes,
        session.ClientPackage?.PackageId,
        session.ClientPackageId,
        session.ClientPackage?.Package.Name,
        session.ClientPackage?.Package.Price,
        session.InvoiceId,
        session.PaymentAmount,
        session.PaymentDate,
        session.PaymentMethod,
        session.ProviderId,
        session.Provider?.DisplayName);
}

static string GetSessionBillingSource(Session session) =>
    session.ClientPackageId.HasValue
        ? "package"
        : session.InvoiceId.HasValue
            ? "pay-per-session"
            : "monthly";

static string GetSessionPaymentStatus(Session session)
{
    if (session.ClientPackageId.HasValue)
    {
        return "paid";
    }

    if (session.PaymentStatus == PaymentStatus.Paid)
    {
        return "paid";
    }

    if (session.PaymentStatus == PaymentStatus.Pending)
    {
        return "pending";
    }

    return session.Invoice?.Status == InvoiceStatus.Paid ? "paid" : "unpaid";
}

static BillingFilters GetBillingFilters(HttpContext context)
{
    int? clientId = null;
    if (int.TryParse(context.Request.Query["clientId"], out var parsedClientId))
    {
        clientId = parsedClientId;
    }

    DateTimeOffset? start = null;
    if (DateOnly.TryParse(context.Request.Query["startDate"], out var parsedStartDate))
    {
        start = parsedStartDate.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc);
    }

    DateTimeOffset? endExclusive = null;
    if (DateOnly.TryParse(context.Request.Query["endDate"], out var parsedEndDate))
    {
        endExclusive = parsedEndDate.AddDays(1).ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc);
    }

    return new BillingFilters(clientId, start, endExclusive);
}

static bool IsBillingServiceDateInRange(
    DateTimeOffset serviceDate,
    BillingFilters filters)
{
    if (filters.Start.HasValue && serviceDate < filters.Start.Value)
    {
        return false;
    }

    if (filters.EndExclusive.HasValue && serviceDate >= filters.EndExclusive.Value)
    {
        return false;
    }

    return true;
}

static decimal GetSessionPaymentAmount(Session session, decimal defaultSessionAmount)
{
    var amount = session.PaymentAmount ?? session.Invoice?.Amount ?? defaultSessionAmount;
    return decimal.Round(amount, 2, MidpointRounding.AwayFromZero);
}

static decimal GetPackagePaymentAmount(ClientPackage clientPackage)
{
    var amount = clientPackage.PaymentAmount ?? clientPackage.Package.Price ?? 0m;
    return decimal.Round(amount, 2, MidpointRounding.AwayFromZero);
}

static int CalculateProgressPercentage(int completed, int total)
{
    if (total <= 0)
    {
        return 0;
    }

    return Math.Clamp((int)Math.Round((double)completed / total * 100, MidpointRounding.AwayFromZero), 0, 100);
}

static async Task MarkOverdueInvoicesAsync(LuminaDbContext db, int practiceId)
{
    var today = DateOnly.FromDateTime(DateTime.UtcNow.Date);
    var overdueInvoices = await db.Invoices
        .Where(invoice =>
            invoice.PracticeId == practiceId &&
            invoice.Status == InvoiceStatus.Pending &&
            invoice.DueDate < today)
        .ToListAsync();

    if (overdueInvoices.Count == 0)
    {
        return;
    }

    foreach (var invoice in overdueInvoices)
    {
        invoice.Status = InvoiceStatus.Overdue;
    }

    await db.SaveChangesAsync();
}

static async Task<IReadOnlyList<string>> GenerateInvoiceNumbersAsync(
    LuminaDbContext db,
    int practiceId,
    int count)
{
    if (count <= 0)
    {
        return [];
    }

    var prefix = $"INV-{DateTime.UtcNow:yyyy}-";
    var invoiceNumbers = await db.Invoices
        .Where(i => i.PracticeId == practiceId && i.InvoiceNumber.StartsWith(prefix))
        .Select(i => i.InvoiceNumber)
        .ToListAsync();

    var nextNumber = invoiceNumbers
        .Select(invoiceNumber =>
        {
            var suffix = invoiceNumber[prefix.Length..];
            return int.TryParse(suffix, out var parsed) ? parsed : 0;
        })
        .DefaultIfEmpty(0)
        .Max();

    return Enumerable.Range(nextNumber + 1, count)
        .Select(number => $"{prefix}{number:000}")
        .ToArray();
}

static bool TryNormalizeRecurrenceFrequency(string? frequency, out string? normalized)
{
    normalized = frequency?.Trim().ToLowerInvariant();
    return normalized is "weekly" or "biweekly" or "monthly";
}

static DateTimeOffset GetRecurringSessionDate(
    DateTimeOffset baseDate,
    string recurrenceFrequency,
    int occurrence)
{
    if (occurrence <= 0)
    {
        return baseDate;
    }

    return recurrenceFrequency switch
    {
        "weekly" => baseDate.AddDays(7 * occurrence),
        "biweekly" => baseDate.AddDays(14 * occurrence),
        "monthly" => baseDate.AddMonths(occurrence),
        _ => baseDate
    };
}

static bool IsSqliteConnectionString(string connectionString)
{
    return connectionString.Contains("Data Source=", StringComparison.OrdinalIgnoreCase)
        && (connectionString.Contains(".db", StringComparison.OrdinalIgnoreCase)
            || connectionString.Contains(".sqlite", StringComparison.OrdinalIgnoreCase)
            || connectionString.Contains("mode=memory", StringComparison.OrdinalIgnoreCase));
}

static string ResolveSqliteConnectionString(string connectionString, string rootPath)
{
    if (!IsSqliteConnectionString(connectionString))
    {
        return connectionString;
    }

    var builder = new DbConnectionStringBuilder
    {
        ConnectionString = connectionString
    };
    var dataSourceKey = builder.Keys
        .Cast<string>()
        .FirstOrDefault(key => string.Equals(key, "Data Source", StringComparison.OrdinalIgnoreCase));

    if (dataSourceKey is null || builder[dataSourceKey] is not string dataSource || string.IsNullOrWhiteSpace(dataSource))
    {
        return connectionString;
    }

    if (Path.IsPathRooted(dataSource) || dataSource.Contains("mode=memory", StringComparison.OrdinalIgnoreCase))
    {
        return connectionString;
    }

    var resolvedDataSource = Path.GetFullPath(Path.Combine(rootPath, dataSource));
    var directory = Path.GetDirectoryName(resolvedDataSource);
    if (!string.IsNullOrWhiteSpace(directory))
    {
        Directory.CreateDirectory(directory);
    }

    builder[dataSourceKey] = resolvedDataSource;
    return builder.ConnectionString;
}

static string? FindRepoRoot(string startPath)
{
    var current = new DirectoryInfo(startPath);
    while (current is not null)
    {
        var hasSolution = current.GetFiles("*.sln").Length > 0;
        var hasDotNetFolder = Directory.Exists(Path.Combine(current.FullName, ".dotnet"));
        if (hasSolution || hasDotNetFolder)
        {
            return current.FullName;
        }

        current = current.Parent;
    }

    return null;
}

app.Run();

static async Task<(int practiceId, int providerId)?> ResolveScopeAsync(HttpContext context, LuminaDbContext db)
{
    var userIdRaw = context.User.FindFirstValue(ClaimTypes.NameIdentifier);
    if (string.IsNullOrWhiteSpace(userIdRaw)) return null;
    var provider = await db.Providers.FirstOrDefaultAsync(p => p.UserId == userIdRaw && p.IsActive);
    return provider is null ? null : (provider.PracticeId, provider.Id);
}

public record LoginRequest(string Email, string Password);
public record SessionUpdateRequest(DateTimeOffset? Date, string? SessionType, int? Duration, SessionLocation? Location, SessionStatus? Status, string? Focus, string? Notes);
public record SessionCreateRequest(int ClientId, DateTimeOffset Date, int Duration, SessionLocation Location, SessionStatus? Status, string SessionType, string Focus, SessionEntryMode Mode = SessionEntryMode.Schedule, SessionBillingMode BillingMode = SessionBillingMode.PayPerSession, int? PackageId = null, int? ClientPackageId = null, decimal? Amount = null, string? RecurrenceFrequency = null, int? RecurrenceCount = null);
public record CreatePackageRequest(string Name, int SessionCount, decimal Price, bool Enabled = true);
public record UpdatePackageRequest(string Name, int SessionCount, decimal Price, bool Enabled = true);
public record BillingSettingsRequest(int DefaultDueDays, decimal DefaultSessionAmount);
public record NotesTemplateSettingsRequest(string TemplateMode, string? SelectedTemplateKind = null, int? SelectedTemplateId = null);
public record ClientUpsertRequest(string Name, string Email, string Phone, string Program, DateOnly StartDate, ClientStatus Status, BillingModel BillingModel = BillingModel.PayPerSession, string? Notes = null);
public record SessionPaymentRequest(decimal? Amount = null, string? PaymentMethod = null, DateTimeOffset? PaymentDate = null);
public record SessionPaymentUpdateRequest(PaymentStatus PaymentStatus, decimal? Amount = null, string? PaymentMethod = null, DateTimeOffset? PaymentDate = null);
public record MonthlyInvoiceRequest(int? Year = null, int? Month = null, int? ClientId = null, DateOnly? DueDate = null);
public record FromPresetRequest(int SourcePresetId, int? PracticeId = null, string? Name = null);
public record TemplateUpdateRequest(int PracticeId, string Name, string? Description, IReadOnlyList<TemplateUpdateFieldRequest> Fields);
public record TemplateUpdateFieldRequest(int Id, string Label, int SortOrder, string? FieldType);
public record SavedReportUpsertRequest(string Name, string ReportType, int? TemplateId = null, int? TemplateFieldId = null, string? FieldKey = null, string? AnalysisType = null, string? FiltersJson = null, string? DisplayOptionsJson = null);
public readonly record struct BillingFilters(int? ClientId, DateTimeOffset? Start, DateTimeOffset? EndExclusive);
public record ApiSessionItem(int id, int clientId, string client, string sessionType, DateTimeOffset date, int duration, string location, string status, string payment, string paymentStatus, string billingSource, int? packageRemaining, string focus, string? notes, int? packageId = null, int? clientPackageId = null, string? packageName = null, decimal? packagePrice = null, int? invoiceId = null, decimal? paymentAmount = null, DateTimeOffset? paymentDate = null, string? paymentMethod = null, int? providerId = null, string? providerName = null);
public record BillingPaymentItem(string id, string sourceType, int sourceId, int clientId, string clientName, string description, decimal amount, string paymentStatus, string billingSource, DateTimeOffset serviceDate, DateTimeOffset? paymentDate, string? paymentMethod);
public record SessionStructuredNoteRequest(int? TemplateId, string Content, string LegacyNotes, string? NoteType = null);
public record ClientNoteCreateRequest(string Content, string? Type = null, string? Source = null);
public record BillingSettingsResponse(int DefaultDueDays, decimal DefaultSessionAmount);
public record NotesTemplateSettingsResponse(string TemplateMode, string? SelectedTemplateKind, int? SelectedTemplateId);
public record TemplateResponse(int Id, string Name, string Description, int PracticeId, int? SourcePresetId, DateTimeOffset CreatedAt, IReadOnlyList<TemplateFieldResponse> FieldsDetail, IReadOnlyList<string> Fields, bool Custom);
public record TemplateFieldResponse(int Id, string Label, int SortOrder, string? FieldType);
public record SavedReportResponse(int Id, string Name, string ReportType, int? TemplateId, int? TemplateFieldId, string? FieldKey, string? AnalysisType, string FiltersJson, string DisplayOptionsJson, DateTimeOffset CreatedAt, DateTimeOffset UpdatedAt, int PracticeId, int ProviderId);
public record PackageSessionStats(int UsedSessions, int ScheduledSessions, int CancelledSessions, int AvailableSessions, string Status);
public enum SessionEntryMode
{
    Schedule = 1,
    LogPast = 2
}
public enum SessionBillingMode
{
    PayPerSession = 1,
    Monthly = 2,
    Package = 3
}
