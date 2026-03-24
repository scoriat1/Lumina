using System.Security.Claims;
using Lumina.Domain.Entities;
using Lumina.Domain.Enums;
using Lumina.Infrastructure.Data;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<LuminaDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("Lumina")));

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

builder.Services.AddCors(options =>
{
    options.AddPolicy("client", policy =>
        policy.WithOrigins("http://localhost:5175").AllowAnyHeader().AllowAnyMethod().AllowCredentials());
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

    var clients = await db.Clients.Where(c => c.PracticeId == scope.Value.practiceId).OrderBy(c => c.Name).Select(c => new
    {
        id = c.Id,
        name = c.Name,
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

api.MapGet("/clients/{id:int}", async (int id, LuminaDbContext db, HttpContext context) =>
{
    var scope = await ResolveScopeAsync(context, db);
    if (scope is null) return Results.Unauthorized();

    var client = await db.Clients.Where(c => c.PracticeId == scope.Value.practiceId && c.Id == id).Select(c => new
    {
        id = c.Id,
        name = c.Name,
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
    client.Notes = request.Notes;
    await db.SaveChangesAsync();
    return Results.Ok();
});

api.MapGet("/clients/{id:int}/sessions", async (int id, LuminaDbContext db, HttpContext context) =>
{
    var scope = await ResolveScopeAsync(context, db);
    if (scope is null) return Results.Unauthorized();

    var sessions = await db.Sessions
        .Where(s => s.PracticeId == scope.Value.practiceId && s.ClientId == id)
        .Include(s => s.Client)
        .OrderByDescending(s => s.Date)
        .Select(s => new
        {
            id = s.Id,
            clientId = s.ClientId,
            client = s.Client.Name,
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
        })
        .ToListAsync();

    return Results.Ok(sessions);
});

api.MapGet("/clients/{id:int}/detail-view", async (int id, LuminaDbContext db, HttpContext context) =>
{
    var scope = await ResolveScopeAsync(context, db);
    if (scope is null) return Results.Unauthorized();

    var client = await db.Clients
        .AsNoTracking()
        .FirstOrDefaultAsync(c => c.PracticeId == scope.Value.practiceId && c.Id == id);
    if (client is null) return Results.NotFound();

    var sessions = await db.Sessions
        .AsNoTracking()
        .Where(s => s.PracticeId == scope.Value.practiceId && s.ClientId == id)
        .OrderBy(s => s.Date)
        .ToListAsync();

    var packages = await db.ClientPackages
        .AsNoTracking()
        .Where(cp => cp.PracticeId == scope.Value.practiceId && cp.ClientId == id)
        .Include(cp => cp.Package)
        .OrderBy(cp => cp.PurchasedAt)
        .ToListAsync();

    var notes = await db.SessionNotes
        .AsNoTracking()
        .Where(n => n.ClientId == id)
        .OrderByDescending(n => n.CreatedAt)
        .ToListAsync();

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
                .Where(s => s.Date >= boundary.Start && s.Date < boundary.End)
                .ToList();

            var completed = Math.Max(0, boundary.Package.Package.SessionCount - boundary.Package.RemainingSessions);
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
                usedSessions = completed,
                status = boundary.Package.RemainingSessions <= 0 ? "completed" : "active",
                sessions = packageSessions.Select(s => MapSessionDto(s, client.Name)).ToList()
            };
        })
        .ToList();

    var assignedSessionIds = engagementGroups
         .SelectMany(group => group.sessions.Select(s => s.id))
        .ToHashSet();

    var singleSessions = sessions
        .Where(s => !assignedSessionIds.Contains(s.Id))
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

    var query = db.Sessions
        .Where(s => s.PracticeId == scope.Value.practiceId)
        .Where(s => !clientId.HasValue || s.ClientId == clientId.Value)
        .Include(s => s.Client)
        .OrderBy(s => s.Date);

    var sessions = await query.Select(s => new
    {
        id = s.Id,
        clientId = s.ClientId,
        client = s.Client.Name,
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

api.MapGet("/sessions/{id:int}", async (int id, LuminaDbContext db, HttpContext context) =>
{
    var scope = await ResolveScopeAsync(context, db);
    if (scope is null) return Results.Unauthorized();

    var session = await db.Sessions
        .Where(s => s.PracticeId == scope.Value.practiceId && s.Id == id)
        .Include(s => s.Client)
        .Select(s => new
        {
            id = s.Id,
            clientId = s.ClientId,
            client = s.Client.Name,
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
        })
        .FirstOrDefaultAsync();

    return session is null ? Results.NotFound() : Results.Ok(session);
});

api.MapPost("/sessions", async (SessionCreateRequest request, LuminaDbContext db, HttpContext context) =>
{
    var scope = await ResolveScopeAsync(context, db);
    if (scope is null) return Results.Unauthorized();

    var clientExists = await db.Clients.AnyAsync(c => c.Id == request.ClientId && c.PracticeId == scope.Value.practiceId);
    if (!clientExists)
    {
        return Results.BadRequest(new { message = "Selected client was not found." });
    }

    var now = DateTimeOffset.UtcNow;
    var status = request.Status ?? (request.Mode == SessionEntryMode.LogPast ? SessionStatus.Completed : SessionStatus.Upcoming);

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

    var session = new Session
    {
        PracticeId = scope.Value.practiceId,
        ProviderId = scope.Value.providerId,
        ClientId = request.ClientId,
        Date = request.Date,
        Duration = request.Duration,
        SessionType = string.IsNullOrWhiteSpace(request.SessionType) ? "Session" : request.SessionType.Trim(),
        Focus = request.Focus?.Trim() ?? string.Empty,
        Status = status,
        Location = request.Location
    };
    db.Sessions.Add(session);
    await db.SaveChangesAsync();
    return Results.Ok(new { id = session.Id });
});

api.MapPut("/sessions/{id:int}", async (int id, SessionUpdateRequest request, LuminaDbContext db, HttpContext context) =>
{
    var scope = await ResolveScopeAsync(context, db);
    if (scope is null) return Results.Unauthorized();
    var session = await db.Sessions.FirstOrDefaultAsync(s => s.Id == id && s.PracticeId == scope.Value.practiceId);
    if (session is null) return Results.NotFound();

    if (request.Date is not null) session.Date = request.Date.Value;
    if (!string.IsNullOrWhiteSpace(request.SessionType)) session.SessionType = request.SessionType;
    if (request.Duration is not null) session.Duration = request.Duration.Value;
    if (request.Location is not null) session.Location = request.Location.Value;
    if (request.Status is not null) session.Status = request.Status.Value;
    if (!string.IsNullOrWhiteSpace(request.Focus)) session.Focus = request.Focus;
    if (request.Notes is not null) session.Notes = request.Notes;
    await db.SaveChangesAsync();
    return Results.Ok();
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
        clientId = i.ClientId,
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
        avatarColor = "#9B8B9E"
    }).ToListAsync();

    return Results.Ok(providers);
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

static ApiSessionItem MapSessionDto(Session session, string clientName)
{
    return new ApiSessionItem(
        session.Id,
        session.ClientId,
        clientName,
        session.SessionType,
        session.Date,
        session.Duration,
        session.Location.ToString().ToLowerInvariant(),
        session.Status.ToString().ToLowerInvariant(),
        "paid",
        "paid",
        "pay-per-session",
        null,
        session.Focus,
        session.Notes);
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
public record SessionCreateRequest(int ClientId, DateTimeOffset Date, int Duration, SessionLocation Location, SessionStatus? Status, string SessionType, string Focus, SessionEntryMode Mode = SessionEntryMode.Schedule, string? Payment = null);
public record NotesTemplateSettingsRequest(string TemplateMode, string? SelectedTemplateKind = null, int? SelectedTemplateId = null);
public record ClientUpsertRequest(string Name, string Email, string Phone, string Program, DateOnly StartDate, ClientStatus Status, string? Notes);
public record FromPresetRequest(int SourcePresetId, int? PracticeId = null, string? Name = null);
public record TemplateUpdateRequest(int PracticeId, string Name, string? Description, IReadOnlyList<TemplateUpdateFieldRequest> Fields);
public record TemplateUpdateFieldRequest(int Id, string Label, int SortOrder, string? FieldType);
public record ApiSessionItem(int id, int clientId, string client, string sessionType, DateTimeOffset date, int duration, string location, string status, string payment, string paymentStatus, string billingSource, int? packageRemaining, string focus, string? notes);
public record SessionStructuredNoteRequest(int? TemplateId, string Content, string LegacyNotes, string? NoteType = null);
public record ClientNoteCreateRequest(string Content, string? Type = null, string? Source = null);
public record NotesTemplateSettingsResponse(string TemplateMode, string? SelectedTemplateKind, int? SelectedTemplateId);
public record TemplateResponse(int Id, string Name, string Description, int PracticeId, int? SourcePresetId, DateTimeOffset CreatedAt, IReadOnlyList<TemplateFieldResponse> FieldsDetail, IReadOnlyList<string> Fields, bool Custom);
public record TemplateFieldResponse(int Id, string Label, int SortOrder, string? FieldType);
public enum SessionEntryMode
{
    Schedule = 1,
    LogPast = 2
}
