using System.Globalization;
using System.IO.Compression;
using System.Security;
using Lumina.Api.Repositories;
using Lumina.Domain.Entities;
using Lumina.Domain.Enums;

namespace Lumina.Api.Services;

public interface IDataExportService
{
    Task<DataExportFile> ExportPracticeDataAsync(int practiceId, CancellationToken cancellationToken);
    DataExportFile CreateImportTemplate();
}

public sealed class DataExportService(IPracticeDataExportRepository repository) : IDataExportService
{
    private const string WorkbookContentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

    public async Task<DataExportFile> ExportPracticeDataAsync(int practiceId, CancellationToken cancellationToken)
    {
        var snapshot = await repository.GetSnapshotAsync(practiceId, cancellationToken);
        var generatedAt = DateTimeOffset.UtcNow;
        var workbook = CreateWorkbook(snapshot);

        return new DataExportFile(
            SimpleXlsxWorkbookWriter.Write(workbook),
            $"lumina-export-{generatedAt:yyyyMMdd-HHmmss}.xlsx",
            WorkbookContentType);
    }

    public DataExportFile CreateImportTemplate()
    {
        var workbook = CreateWorkbook(null);

        return new DataExportFile(
            SimpleXlsxWorkbookWriter.Write(workbook),
            "lumina-import-template.xlsx",
            WorkbookContentType);
    }

    private static IReadOnlyList<WorkbookSheet> CreateWorkbook(PracticeDataExportSnapshot? snapshot)
    {
        var clients = snapshot?.Clients ?? [];
        var sessions = snapshot?.Sessions ?? [];
        var sessionNotes = snapshot?.SessionNotes ?? [];
        var packages = snapshot?.Packages ?? [];
        var clientPackages = snapshot?.ClientPackages ?? [];
        var invoices = snapshot?.Invoices ?? [];
        var providers = snapshot?.Providers ?? [];
        var practice = snapshot?.Practice;

        var clientById = clients.ToDictionary(client => client.Id);
        var packageById = packages.ToDictionary(package => package.Id);
        var sessionById = sessions.ToDictionary(session => session.Id);
        var templateById = (snapshot?.Templates ?? []).ToDictionary(template => template.Id);

        return
        [
            new WorkbookSheet(
                "Start Here",
                [],
                [
                    ["Lumina Excel Import Guide"],
                    [""],
                    ["Import order", "Clients, Providers, Settings, Packages, Sessions, Session Notes, Payments."],
                    ["Required fields", "Clients require Client Name. Sessions require Client Email or Client Name and Session Date."],
                    ["Date format", "Use YYYY-MM-DD for dates. Use HH:MM for Start Time."],
                    ["Accepted client status values", "Active, Paused, Completed, Archived."],
                    ["Accepted session status values", "Upcoming, Completed, Cancelled, NoShow."],
                    ["Accepted payment status values", "Paid, Pending, Unpaid, Overdue."],
                    ["Accepted session locations", "Zoom, Phone, Office, Other."],
                    ["Matching rules", "Lumina will match clients by Email first, then Client Name. Sessions and notes use Client Email/Client Name plus Session Date."],
                    ["Import status", "Actual Excel import is coming soon. This workbook is ready for export review and future imports."],
                ]),
            new WorkbookSheet(
                "Clients",
                ["Client Name", "Email", "Phone", "Status", "Program", "Start Date", "Address", "City", "State", "Zip", "Notes"],
                clients.Select(client => new[]
                {
                    client.Name,
                    client.Email,
                    client.Phone,
                    client.Status.ToString(),
                    client.Program,
                    FormatDate(client.StartDate),
                    string.Empty,
                    string.Empty,
                    string.Empty,
                    string.Empty,
                    client.Notes ?? string.Empty,
                })),
            new WorkbookSheet(
                "Sessions",
                ["Client Email", "Client Name", "Session Date", "Start Time", "Duration Minutes", "Session Type", "Location", "Status", "Payment Amount", "Payment Status", "Payment Date", "Payment Method", "Internal Notes"],
                sessions.Select(session =>
                {
                    var client = clientById.GetValueOrDefault(session.ClientId);
                    return new[]
                    {
                        client?.Email ?? string.Empty,
                        client?.Name ?? string.Empty,
                        FormatDate(session.Date),
                        FormatTime(session.Date),
                        session.Duration.ToString(CultureInfo.InvariantCulture),
                        session.SessionType,
                        session.Location.ToString(),
                        session.Status.ToString(),
                        FormatNullableDecimal(session.PaymentAmount),
                        session.PaymentStatus.ToString(),
                        FormatNullableDate(session.PaymentDate),
                        session.PaymentMethod ?? string.Empty,
                        session.Notes ?? session.Focus,
                    };
                })),
            new WorkbookSheet(
                "Session Notes",
                ["Client Email", "Client Name", "Session Date", "Note Type", "Note Text", "Template Name", "Field Name", "Field Value", "Created Date"],
                sessionNotes.Select(note =>
                {
                    var client = clientById.GetValueOrDefault(note.ClientId);
                    var session = note.SessionId.HasValue ? sessionById.GetValueOrDefault(note.SessionId.Value) : null;
                    var template = note.TemplateId.HasValue ? templateById.GetValueOrDefault(note.TemplateId.Value) : null;
                    return new[]
                    {
                        client?.Email ?? string.Empty,
                        client?.Name ?? string.Empty,
                        session is null ? string.Empty : FormatDate(session.Date),
                        note.NoteType,
                        note.Content,
                        template?.Name ?? string.Empty,
                        string.Empty,
                        string.Empty,
                        FormatDate(note.CreatedAt),
                    };
                })),
            new WorkbookSheet(
                "Packages",
                ["Client Email", "Client Name", "Package Name", "Purchase Date", "Total Sessions", "Sessions Used", "Price", "Payment Status", "Payment Date", "Payment Method"],
                clientPackages.Select(clientPackage =>
                {
                    var client = clientById.GetValueOrDefault(clientPackage.ClientId);
                    var package = packageById.GetValueOrDefault(clientPackage.PackageId);
                    var totalSessions = package?.SessionCount ?? clientPackage.RemainingSessions;
                    var usedSessions = Math.Max(0, totalSessions - clientPackage.RemainingSessions);
                    return new[]
                    {
                        client?.Email ?? string.Empty,
                        client?.Name ?? string.Empty,
                        package?.Name ?? string.Empty,
                        FormatDate(clientPackage.PurchasedAt),
                        totalSessions.ToString(CultureInfo.InvariantCulture),
                        usedSessions.ToString(CultureInfo.InvariantCulture),
                        FormatNullableDecimal(clientPackage.PaymentAmount ?? package?.Price),
                        clientPackage.PaymentStatus.ToString(),
                        FormatNullableDate(clientPackage.PaymentDate),
                        clientPackage.PaymentMethod ?? string.Empty,
                    };
                })),
            new WorkbookSheet(
                "Payments",
                ["Client Email", "Client Name", "Payment Date", "Amount", "Payment Method", "Payment Status", "Related Type", "Related Date", "Notes"],
                BuildPaymentRows(sessions, clientPackages, invoices, clientById, packageById)),
            new WorkbookSheet(
                "Providers",
                ["Provider Name", "Email", "Role", "Phone", "Active"],
                providers.Select(provider => new[]
                {
                    provider.DisplayName,
                    provider.User.Email ?? string.Empty,
                    provider.Role.ToString(),
                    string.Empty,
                    provider.IsActive ? "Yes" : "No",
                })),
            new WorkbookSheet(
                "Settings",
                ["Setting Name", "Value"],
                practice is null
                    ? []
                    : [
                        ["Practice Name", practice.Name],
                        ["Default Invoice Due Days", practice.BillingDefaultDueDays.ToString(CultureInfo.InvariantCulture)],
                        ["Default Session Amount", practice.BillingDefaultSessionAmount.ToString(CultureInfo.InvariantCulture)],
                        ["Notes Template Mode", practice.NotesTemplateMode],
                        ["Selected Notes Template Kind", practice.NotesSelectedTemplateKind ?? string.Empty],
                    ]),
        ];
    }

    private static IEnumerable<IReadOnlyList<string>> BuildPaymentRows(
        IReadOnlyList<Session> sessions,
        IReadOnlyList<ClientPackage> clientPackages,
        IReadOnlyList<Invoice> invoices,
        IReadOnlyDictionary<int, Client> clientById,
        IReadOnlyDictionary<int, Package> packageById)
    {
        foreach (var session in sessions.Where(session =>
            session.PaymentAmount.HasValue ||
            session.PaymentStatus != PaymentStatus.Unpaid ||
            !string.IsNullOrWhiteSpace(session.PaymentMethod)))
        {
            var client = clientById.GetValueOrDefault(session.ClientId);
            yield return
            [
                client?.Email ?? string.Empty,
                client?.Name ?? string.Empty,
                FormatNullableDate(session.PaymentDate),
                FormatNullableDecimal(session.PaymentAmount),
                session.PaymentMethod ?? string.Empty,
                session.PaymentStatus.ToString(),
                "Session",
                FormatDate(session.Date),
                session.SessionType,
            ];
        }

        foreach (var clientPackage in clientPackages)
        {
            var client = clientById.GetValueOrDefault(clientPackage.ClientId);
            var package = packageById.GetValueOrDefault(clientPackage.PackageId);
            yield return
            [
                client?.Email ?? string.Empty,
                client?.Name ?? string.Empty,
                FormatNullableDate(clientPackage.PaymentDate),
                FormatNullableDecimal(clientPackage.PaymentAmount ?? package?.Price),
                clientPackage.PaymentMethod ?? string.Empty,
                clientPackage.PaymentStatus.ToString(),
                "Package",
                FormatDate(clientPackage.PurchasedAt),
                package?.Name ?? string.Empty,
            ];
        }

        foreach (var invoice in invoices)
        {
            var client = clientById.GetValueOrDefault(invoice.ClientId);
            yield return
            [
                client?.Email ?? string.Empty,
                client?.Name ?? string.Empty,
                invoice.Status == InvoiceStatus.Paid ? FormatDate(invoice.CreatedAt) : string.Empty,
                invoice.Amount.ToString(CultureInfo.InvariantCulture),
                string.Empty,
                invoice.Status.ToString(),
                "Invoice",
                FormatDate(invoice.DueDate),
                $"{invoice.InvoiceNumber} {invoice.Description}".Trim(),
            ];
        }
    }

    private static string FormatDate(DateOnly value) => value.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture);

    private static string FormatDate(DateTimeOffset value) => value.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture);

    private static string FormatTime(DateTimeOffset value) => value.ToString("HH:mm", CultureInfo.InvariantCulture);

    private static string FormatNullableDate(DateTimeOffset? value) =>
        value.HasValue ? FormatDate(value.Value) : string.Empty;

    private static string FormatNullableDecimal(decimal? value) =>
        value.HasValue ? value.Value.ToString(CultureInfo.InvariantCulture) : string.Empty;
}

public sealed record DataExportFile(byte[] Content, string FileName, string ContentType);

internal sealed record WorkbookSheet(
    string Name,
    IReadOnlyList<string> Headers,
    IEnumerable<IReadOnlyList<string>> Rows);

internal static class SimpleXlsxWorkbookWriter
{
    public static byte[] Write(IReadOnlyList<WorkbookSheet> sheets)
    {
        using var output = new MemoryStream();
        using (var archive = new ZipArchive(output, ZipArchiveMode.Create, leaveOpen: true))
        {
            WriteEntry(archive, "[Content_Types].xml", CreateContentTypesXml(sheets.Count));
            WriteEntry(archive, "_rels/.rels", """
                <?xml version="1.0" encoding="UTF-8" standalone="yes"?>
                <Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
                  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
                </Relationships>
                """);
            WriteEntry(archive, "xl/workbook.xml", CreateWorkbookXml(sheets));
            WriteEntry(archive, "xl/_rels/workbook.xml.rels", CreateWorkbookRelationshipsXml(sheets.Count));
            WriteEntry(archive, "xl/styles.xml", """
                <?xml version="1.0" encoding="UTF-8" standalone="yes"?>
                <styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
                  <fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts>
                  <fills count="1"><fill><patternFill patternType="none"/></fill></fills>
                  <borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>
                  <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
                  <cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0"/></cellXfs>
                </styleSheet>
                """);

            for (var i = 0; i < sheets.Count; i++)
            {
                WriteEntry(archive, $"xl/worksheets/sheet{i + 1}.xml", CreateWorksheetXml(sheets[i]));
            }
        }

        return output.ToArray();
    }

    private static string CreateContentTypesXml(int sheetCount)
    {
        var overrides = string.Join(string.Empty, Enumerable.Range(1, sheetCount)
            .Select(index => $"""<Override PartName="/xl/worksheets/sheet{index}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>"""));

        return $$"""
            <?xml version="1.0" encoding="UTF-8" standalone="yes"?>
            <Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
              <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
              <Default Extension="xml" ContentType="application/xml"/>
              <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
              <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
              {{overrides}}
            </Types>
            """;
    }

    private static string CreateWorkbookXml(IReadOnlyList<WorkbookSheet> sheets)
    {
        var sheetNodes = string.Join(string.Empty, sheets.Select((sheet, index) =>
            $"""<sheet name="{EscapeAttribute(sheet.Name)}" sheetId="{index + 1}" r:id="rId{index + 1}"/>"""));

        return $$"""
            <?xml version="1.0" encoding="UTF-8" standalone="yes"?>
            <workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
              <sheets>{{sheetNodes}}</sheets>
            </workbook>
            """;
    }

    private static string CreateWorkbookRelationshipsXml(int sheetCount)
    {
        var relationships = string.Join(string.Empty, Enumerable.Range(1, sheetCount)
            .Select(index => $"""<Relationship Id="rId{index}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet{index}.xml"/>"""));

        return $$"""
            <?xml version="1.0" encoding="UTF-8" standalone="yes"?>
            <Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
              {{relationships}}
              <Relationship Id="rId{{sheetCount + 1}}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
            </Relationships>
            """;
    }

    private static string CreateWorksheetXml(WorkbookSheet sheet)
    {
        var rows = new List<IReadOnlyList<string>>();
        if (sheet.Headers.Count > 0)
        {
            rows.Add(sheet.Headers);
        }

        rows.AddRange(sheet.Rows);
        var rowNodes = rows.Select((row, rowIndex) => CreateRowXml(rowIndex + 1, row, rowIndex == 0 && sheet.Headers.Count > 0));

        return $$"""
            <?xml version="1.0" encoding="UTF-8" standalone="yes"?>
            <worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
              <sheetData>{{string.Join(string.Empty, rowNodes)}}</sheetData>
            </worksheet>
            """;
    }

    private static string CreateRowXml(int rowNumber, IReadOnlyList<string> values, bool isHeader)
    {
        var cells = values.Select((value, columnIndex) =>
            $"""<c r="{GetCellReference(columnIndex, rowNumber)}" t="inlineStr"{(isHeader ? " s=\"1\"" : string.Empty)}><is><t>{EscapeText(value)}</t></is></c>""");

        return $"""<row r="{rowNumber}">{string.Join(string.Empty, cells)}</row>""";
    }

    private static string GetCellReference(int columnIndex, int rowNumber)
    {
        var dividend = columnIndex + 1;
        var columnName = string.Empty;
        while (dividend > 0)
        {
            var modulo = (dividend - 1) % 26;
            columnName = Convert.ToChar('A' + modulo) + columnName;
            dividend = (dividend - modulo) / 26;
        }

        return $"{columnName}{rowNumber}";
    }

    private static void WriteEntry(ZipArchive archive, string path, string content)
    {
        var entry = archive.CreateEntry(path, CompressionLevel.Fastest);
        using var stream = entry.Open();
        using var writer = new StreamWriter(stream);
        writer.Write(content);
    }

    private static string EscapeText(string value) => SecurityElement.Escape(value) ?? string.Empty;

    private static string EscapeAttribute(string value) => SecurityElement.Escape(value) ?? string.Empty;
}
