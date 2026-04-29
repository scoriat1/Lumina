using Lumina.Domain.Entities;
using Lumina.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Lumina.Api.Repositories;

public interface IPracticeDataExportRepository
{
    Task<PracticeDataExportSnapshot> GetSnapshotAsync(int practiceId, CancellationToken cancellationToken);
}

public sealed class PracticeDataExportRepository : IPracticeDataExportRepository
{
    private readonly LuminaDbContext db;

    public PracticeDataExportRepository(LuminaDbContext db)
    {
        this.db = db;
    }

    public async Task<PracticeDataExportSnapshot> GetSnapshotAsync(int practiceId, CancellationToken cancellationToken)
    {
        var practice = await db.Practices
            .AsNoTracking()
            .FirstOrDefaultAsync(practice => practice.Id == practiceId, cancellationToken);

        var clients = await db.Clients
            .AsNoTracking()
            .Where(client => client.PracticeId == practiceId)
            .OrderBy(client => client.Id)
            .ToListAsync(cancellationToken);

        var providers = await db.Providers
            .AsNoTracking()
            .Include(provider => provider.User)
            .Where(provider => provider.PracticeId == practiceId)
            .OrderBy(provider => provider.DisplayName)
            .ToListAsync(cancellationToken);

        var sessions = await db.Sessions
            .AsNoTracking()
            .Where(session => session.PracticeId == practiceId)
            .OrderBy(session => session.Id)
            .ToListAsync(cancellationToken);

        var sessionNotes = await db.SessionNotes
            .AsNoTracking()
            .Where(note => note.Client.PracticeId == practiceId)
            .OrderBy(note => note.Id)
            .ToListAsync(cancellationToken);

        var invoices = await db.Invoices
            .AsNoTracking()
            .Where(invoice => invoice.PracticeId == practiceId)
            .OrderBy(invoice => invoice.Id)
            .ToListAsync(cancellationToken);

        var packages = await db.Packages
            .AsNoTracking()
            .Where(package => package.PracticeId == practiceId)
            .OrderBy(package => package.Id)
            .ToListAsync(cancellationToken);

        var clientPackages = await db.ClientPackages
            .AsNoTracking()
            .Where(clientPackage => clientPackage.PracticeId == practiceId)
            .OrderBy(clientPackage => clientPackage.Id)
            .ToListAsync(cancellationToken);

        var templates = await db.Templates
            .AsNoTracking()
            .Where(template => template.PracticeId == practiceId)
            .OrderBy(template => template.Id)
            .ToListAsync(cancellationToken);

        var templateFields = await db.TemplateFields
            .AsNoTracking()
            .Where(field => field.Template.PracticeId == practiceId)
            .OrderBy(field => field.TemplateId)
            .ThenBy(field => field.SortOrder)
            .ThenBy(field => field.Id)
            .ToListAsync(cancellationToken);

        return new PracticeDataExportSnapshot(
            practice,
            clients,
            providers,
            sessions,
            sessionNotes,
            invoices,
            packages,
            clientPackages,
            templates,
            templateFields);
    }
}

public sealed class PracticeDataExportSnapshot
{
    public PracticeDataExportSnapshot(
        Practice? practice,
        IReadOnlyList<Client> clients,
        IReadOnlyList<Provider> providers,
        IReadOnlyList<Session> sessions,
        IReadOnlyList<SessionNote> sessionNotes,
        IReadOnlyList<Invoice> invoices,
        IReadOnlyList<Package> packages,
        IReadOnlyList<ClientPackage> clientPackages,
        IReadOnlyList<Template> templates,
        IReadOnlyList<TemplateField> templateFields)
    {
        Practice = practice;
        Clients = clients;
        Providers = providers;
        Sessions = sessions;
        SessionNotes = sessionNotes;
        Invoices = invoices;
        Packages = packages;
        ClientPackages = clientPackages;
        Templates = templates;
        TemplateFields = templateFields;
    }

    public Practice? Practice { get; }

    public IReadOnlyList<Client> Clients { get; }

    public IReadOnlyList<Provider> Providers { get; }

    public IReadOnlyList<Session> Sessions { get; }

    public IReadOnlyList<SessionNote> SessionNotes { get; }

    public IReadOnlyList<Invoice> Invoices { get; }

    public IReadOnlyList<Package> Packages { get; }

    public IReadOnlyList<ClientPackage> ClientPackages { get; }

    public IReadOnlyList<Template> Templates { get; }

    public IReadOnlyList<TemplateField> TemplateFields { get; }
}
