using Lumina.Domain.Entities;
using Lumina.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Lumina.Api.Repositories;

public interface IPracticeDataExportRepository
{
    Task<PracticeDataExportSnapshot> GetSnapshotAsync(int practiceId, CancellationToken cancellationToken);
}

public sealed class PracticeDataExportRepository(LuminaDbContext db) : IPracticeDataExportRepository
{
    public async Task<PracticeDataExportSnapshot> GetSnapshotAsync(int practiceId, CancellationToken cancellationToken)
    {
        var clients = await db.Clients
            .AsNoTracking()
            .Where(client => client.PracticeId == practiceId)
            .OrderBy(client => client.Id)
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
            clients,
            sessions,
            sessionNotes,
            invoices,
            packages,
            clientPackages,
            templates,
            templateFields);
    }
}

public sealed record PracticeDataExportSnapshot(
    IReadOnlyList<Client> Clients,
    IReadOnlyList<Session> Sessions,
    IReadOnlyList<SessionNote> SessionNotes,
    IReadOnlyList<Invoice> Invoices,
    IReadOnlyList<Package> Packages,
    IReadOnlyList<ClientPackage> ClientPackages,
    IReadOnlyList<Template> Templates,
    IReadOnlyList<TemplateField> TemplateFields);
