using System.Globalization;
using System.IO.Compression;
using System.Text;
using Lumina.Api.Repositories;

namespace Lumina.Api.Services;

public interface IDataExportService
{
    Task<DataExportFile> ExportPracticeDataAsync(int practiceId, CancellationToken cancellationToken);
    DataExportFile CreateImportTemplate();
}

public sealed class DataExportService(IPracticeDataExportRepository repository) : IDataExportService
{
    public async Task<DataExportFile> ExportPracticeDataAsync(int practiceId, CancellationToken cancellationToken)
    {
        var snapshot = await repository.GetSnapshotAsync(practiceId, cancellationToken);
        var generatedAt = DateTimeOffset.UtcNow;

        using var output = new MemoryStream();
        using (var archive = new ZipArchive(output, ZipArchiveMode.Create, leaveOpen: true))
        {
            WriteCsv(archive, "clients.csv",
                ["id", "name", "email", "phone", "program", "start_date", "status", "billing_model", "notes", "external_source", "external_id"],
                snapshot.Clients.Select(client => new[]
                {
                    client.Id.ToString(CultureInfo.InvariantCulture),
                    client.Name,
                    client.Email,
                    client.Phone,
                    client.Program,
                    client.StartDate.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture),
                    client.Status.ToString(),
                    client.BillingModel.ToString(),
                    client.Notes ?? string.Empty,
                    client.ExternalSource ?? string.Empty,
                    client.ExternalId ?? string.Empty,
                }));

            WriteCsv(archive, "sessions.csv",
                ["id", "provider_id", "client_id", "client_package_id", "invoice_id", "date", "duration", "location", "status", "payment_amount", "payment_status", "payment_date", "payment_method", "session_type", "focus", "notes"],
                snapshot.Sessions.Select(session => new[]
                {
                    session.Id.ToString(CultureInfo.InvariantCulture),
                    session.ProviderId.ToString(CultureInfo.InvariantCulture),
                    session.ClientId.ToString(CultureInfo.InvariantCulture),
                    FormatNullableInt(session.ClientPackageId),
                    FormatNullableInt(session.InvoiceId),
                    session.Date.ToString("O", CultureInfo.InvariantCulture),
                    session.Duration.ToString(CultureInfo.InvariantCulture),
                    session.Location.ToString(),
                    session.Status.ToString(),
                    FormatNullableDecimal(session.PaymentAmount),
                    session.PaymentStatus.ToString(),
                    FormatNullableDateTimeOffset(session.PaymentDate),
                    session.PaymentMethod ?? string.Empty,
                    session.SessionType,
                    session.Focus,
                    session.Notes ?? string.Empty,
                }));

            WriteCsv(archive, "session_notes.csv",
                ["id", "client_id", "session_id", "template_id", "note_type", "source", "content", "created_at", "updated_at"],
                snapshot.SessionNotes.Select(note => new[]
                {
                    note.Id.ToString(CultureInfo.InvariantCulture),
                    note.ClientId.ToString(CultureInfo.InvariantCulture),
                    FormatNullableInt(note.SessionId),
                    FormatNullableInt(note.TemplateId),
                    note.NoteType,
                    note.Source ?? string.Empty,
                    note.Content,
                    note.CreatedAt.ToString("O", CultureInfo.InvariantCulture),
                    note.UpdatedAt.ToString("O", CultureInfo.InvariantCulture),
                }));

            WriteCsv(archive, "invoices.csv",
                ["id", "client_id", "invoice_number", "description", "amount", "due_date", "status", "created_at"],
                snapshot.Invoices.Select(invoice => new[]
                {
                    invoice.Id.ToString(CultureInfo.InvariantCulture),
                    invoice.ClientId.ToString(CultureInfo.InvariantCulture),
                    invoice.InvoiceNumber,
                    invoice.Description,
                    invoice.Amount.ToString(CultureInfo.InvariantCulture),
                    invoice.DueDate.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture),
                    invoice.Status.ToString(),
                    invoice.CreatedAt.ToString("O", CultureInfo.InvariantCulture),
                }));

            WriteCsv(archive, "packages.csv",
                ["id", "name", "billing_type", "session_count", "price", "is_active"],
                snapshot.Packages.Select(package => new[]
                {
                    package.Id.ToString(CultureInfo.InvariantCulture),
                    package.Name,
                    package.BillingType,
                    package.SessionCount.ToString(CultureInfo.InvariantCulture),
                    FormatNullableDecimal(package.Price),
                    package.IsActive.ToString(),
                }));

            WriteCsv(archive, "client_packages.csv",
                ["id", "client_id", "package_id", "purchased_at", "remaining_sessions", "payment_amount", "payment_status", "payment_date", "payment_method"],
                snapshot.ClientPackages.Select(clientPackage => new[]
                {
                    clientPackage.Id.ToString(CultureInfo.InvariantCulture),
                    clientPackage.ClientId.ToString(CultureInfo.InvariantCulture),
                    clientPackage.PackageId.ToString(CultureInfo.InvariantCulture),
                    clientPackage.PurchasedAt.ToString("O", CultureInfo.InvariantCulture),
                    clientPackage.RemainingSessions.ToString(CultureInfo.InvariantCulture),
                    FormatNullableDecimal(clientPackage.PaymentAmount),
                    clientPackage.PaymentStatus.ToString(),
                    FormatNullableDateTimeOffset(clientPackage.PaymentDate),
                    clientPackage.PaymentMethod ?? string.Empty,
                }));

            WriteCsv(archive, "templates.csv",
                ["id", "name", "description", "source_preset_id", "created_at"],
                snapshot.Templates.Select(template => new[]
                {
                    template.Id.ToString(CultureInfo.InvariantCulture),
                    template.Name,
                    template.Description,
                    FormatNullableInt(template.SourcePresetId),
                    template.CreatedAt.ToString("O", CultureInfo.InvariantCulture),
                }));

            WriteCsv(archive, "template_fields.csv",
                ["id", "template_id", "label", "sort_order", "field_type"],
                snapshot.TemplateFields.Select(field => new[]
                {
                    field.Id.ToString(CultureInfo.InvariantCulture),
                    field.TemplateId.ToString(CultureInfo.InvariantCulture),
                    field.Label,
                    field.SortOrder.ToString(CultureInfo.InvariantCulture),
                    field.FieldType ?? string.Empty,
                }));

            WriteCsv(archive, "billing_payments.csv",
                ["source_type", "source_id", "client_id", "description", "amount", "payment_status", "payment_date", "payment_method"],
                snapshot.Sessions
                    .Where(session => session.PaymentAmount.HasValue || session.PaymentStatus.ToString() != "Unpaid" || !string.IsNullOrWhiteSpace(session.PaymentMethod))
                    .Select(session => new[]
                    {
                        "session",
                        session.Id.ToString(CultureInfo.InvariantCulture),
                        session.ClientId.ToString(CultureInfo.InvariantCulture),
                        session.SessionType,
                        FormatNullableDecimal(session.PaymentAmount),
                        session.PaymentStatus.ToString(),
                        FormatNullableDateTimeOffset(session.PaymentDate),
                        session.PaymentMethod ?? string.Empty,
                    })
                    .Concat(snapshot.ClientPackages.Select(clientPackage => new[]
                    {
                        "client_package",
                        clientPackage.Id.ToString(CultureInfo.InvariantCulture),
                        clientPackage.ClientId.ToString(CultureInfo.InvariantCulture),
                        $"Package {clientPackage.PackageId}",
                        FormatNullableDecimal(clientPackage.PaymentAmount),
                        clientPackage.PaymentStatus.ToString(),
                        FormatNullableDateTimeOffset(clientPackage.PaymentDate),
                        clientPackage.PaymentMethod ?? string.Empty,
                    })));

            WriteCsv(archive, "manifest.csv",
                ["exported_at_utc", "practice_id", "clients", "sessions", "session_notes", "invoices", "packages", "client_packages", "templates", "template_fields"],
                [new[]
                {
                    generatedAt.ToString("O", CultureInfo.InvariantCulture),
                    practiceId.ToString(CultureInfo.InvariantCulture),
                    snapshot.Clients.Count.ToString(CultureInfo.InvariantCulture),
                    snapshot.Sessions.Count.ToString(CultureInfo.InvariantCulture),
                    snapshot.SessionNotes.Count.ToString(CultureInfo.InvariantCulture),
                    snapshot.Invoices.Count.ToString(CultureInfo.InvariantCulture),
                    snapshot.Packages.Count.ToString(CultureInfo.InvariantCulture),
                    snapshot.ClientPackages.Count.ToString(CultureInfo.InvariantCulture),
                    snapshot.Templates.Count.ToString(CultureInfo.InvariantCulture),
                    snapshot.TemplateFields.Count.ToString(CultureInfo.InvariantCulture),
                }]);
        }

        return new DataExportFile(
            output.ToArray(),
            $"lumina-export-{generatedAt:yyyyMMdd-HHmmss}.zip",
            "application/zip");
    }

    public DataExportFile CreateImportTemplate()
    {
        using var output = new MemoryStream();
        using (var archive = new ZipArchive(output, ZipArchiveMode.Create, leaveOpen: true))
        {
            WriteCsv(archive, "clients-template.csv",
                ["name", "email", "phone", "program", "start_date", "status", "billing_model", "notes"],
                []);
            WriteCsv(archive, "sessions-template.csv",
                ["client_email", "date", "duration", "location", "status", "session_type", "focus", "notes"],
                []);
            WriteCsv(archive, "notes-template.csv",
                ["client_email", "session_date", "note_type", "content"],
                []);
        }

        return new DataExportFile(
            output.ToArray(),
            "lumina-import-template.zip",
            "application/zip");
    }

    private static void WriteCsv(ZipArchive archive, string entryName, IReadOnlyList<string> headers, IEnumerable<IReadOnlyList<string>> rows)
    {
        var entry = archive.CreateEntry(entryName, CompressionLevel.Fastest);
        using var stream = entry.Open();
        using var writer = new StreamWriter(stream, new UTF8Encoding(encoderShouldEmitUTF8Identifier: false));

        writer.WriteLine(string.Join(",", headers.Select(EscapeCsvValue)));
        foreach (var row in rows)
        {
            writer.WriteLine(string.Join(",", row.Select(EscapeCsvValue)));
        }
    }

    private static string EscapeCsvValue(string value)
    {
        if (!value.Contains('"') && !value.Contains(',') && !value.Contains('\n') && !value.Contains('\r'))
        {
            return value;
        }

        return $"\"{value.Replace("\"", "\"\"", StringComparison.Ordinal)}\"";
    }

    private static string FormatNullableInt(int? value) =>
        value.HasValue ? value.Value.ToString(CultureInfo.InvariantCulture) : string.Empty;

    private static string FormatNullableDecimal(decimal? value) =>
        value.HasValue ? value.Value.ToString(CultureInfo.InvariantCulture) : string.Empty;

    private static string FormatNullableDateTimeOffset(DateTimeOffset? value) =>
        value.HasValue ? value.Value.ToString("O", CultureInfo.InvariantCulture) : string.Empty;
}

public sealed record DataExportFile(byte[] Content, string FileName, string ContentType);
