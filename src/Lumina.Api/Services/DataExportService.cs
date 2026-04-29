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

public sealed class DataExportService : IDataExportService
{
    private const string WorkbookContentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    private readonly IPracticeDataExportRepository repository;

    public DataExportService(IPracticeDataExportRepository repository)
    {
        this.repository = repository;
    }

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
        var workbook = CreateImportWorkbook();

        return new DataExportFile(
            SimpleXlsxWorkbookWriter.Write(workbook),
            "lumina-import-template.xlsx",
            WorkbookContentType);
    }

    private static IReadOnlyList<WorkbookSheet> CreateImportWorkbook()
    {
        return new List<WorkbookSheet>
        {
            new WorkbookSheet(
                "Start Here",
                Array.Empty<string>(),
                new List<IReadOnlyList<string>>
                {
                    new[] { "Simple Excel import (Clients + Sessions)" },
                    new[] { "" },
                    new[] { "Import order", "1. Clients, 2. Sessions, 3. Notes if you have them." },
                    new[] { "Required client fields", "Client Name and Status." },
                    new[] { "Required session fields", "Client Name, Session Date, Duration (minutes), and Status." },
                    new[] { "Optional notes", "Use the Notes sheet only when you want to attach a note to a client/session." },
                    new[] { "Date format", "Use YYYY-MM-DD, for example 2026-04-29." },
                    new[] { "Client status values", "Active or Inactive." },
                    new[] { "Session status values", "Completed, Upcoming, or Cancelled." },
                    new[] { "Matching rules", "Lumina will match sessions and notes to clients by Client Name." },
                    new[] { "Notes sheet dropdowns", "Choose a Client Name first, then choose a Session Date from that client's sessions." },
                    new[] { "Import status", "Actual Excel import is coming soon. This template is for preparing clean import data." },
                }),
            new WorkbookSheet(
                "Clients",
                new[] { "Client Name", "Email", "Phone (optional)", "Status" },
                Array.Empty<IReadOnlyList<string>>(),
                new[]
                {
                    WorkbookValidation.List("D2:D1000", "Active,Inactive"),
                }),
            new WorkbookSheet(
                "Sessions",
                new[] { "Client Name", "Session Date", "Duration (minutes)", "Status", "Amount (optional)" },
                Array.Empty<IReadOnlyList<string>>(),
                new[]
                {
                    WorkbookValidation.Range("A2:A1000", "'Clients'!$A$2:$A$1000"),
                    WorkbookValidation.List("D2:D1000", "Completed,Upcoming,Cancelled"),
                },
                new[]
                {
                    new WorkbookColumnStyle("B", WorkbookColumnFormat.Date),
                }),
            new WorkbookSheet(
                "Notes",
                new[] { "Client Name", "Session Date", "Note" },
                Array.Empty<IReadOnlyList<string>>(),
                new[]
                {
                    WorkbookValidation.Range("A2:A1000", "'Clients'!$A$2:$A$1000"),
                    WorkbookValidation.FormulaList("B2:B1000", "OFFSET('Sessions'!$B$1,MATCH($A2,'Sessions'!$A$2:$A$1000,0),0,COUNTIF('Sessions'!$A$2:$A$1000,$A2),1)"),
                },
                new[]
                {
                    new WorkbookColumnStyle("B", WorkbookColumnFormat.Date),
                }),
        };
    }

    private static IReadOnlyList<WorkbookSheet> CreateWorkbook(PracticeDataExportSnapshot? snapshot)
    {
        var clients = snapshot?.Clients ?? Array.Empty<Client>();
        var sessions = snapshot?.Sessions ?? Array.Empty<Session>();
        var sessionNotes = snapshot?.SessionNotes ?? Array.Empty<SessionNote>();
        var packages = snapshot?.Packages ?? Array.Empty<Package>();
        var clientPackages = snapshot?.ClientPackages ?? Array.Empty<ClientPackage>();
        var invoices = snapshot?.Invoices ?? Array.Empty<Invoice>();
        var providers = snapshot?.Providers ?? Array.Empty<Provider>();
        var practice = snapshot?.Practice;

        var clientById = clients.ToDictionary(client => client.Id);
        var packageById = packages.ToDictionary(package => package.Id);
        var sessionById = sessions.ToDictionary(session => session.Id);
        var templateById = (snapshot?.Templates ?? Array.Empty<Template>()).ToDictionary(template => template.Id);

        return new List<WorkbookSheet>
        {
            new WorkbookSheet(
                "Start Here",
                Array.Empty<string>(),
                new List<IReadOnlyList<string>>
                {
                    new[] { "Lumina Excel Import Guide" },
                    new[] { "" },
                    new[] { "Import order", "Clients, Providers, Settings, Packages, Sessions, Session Notes, Payments." },
                    new[] { "Required fields", "Clients require Client Name. Sessions require Client Email or Client Name and Session Date." },
                    new[] { "Date format", "Use YYYY-MM-DD for dates. Use HH:MM for Start Time." },
                    new[] { "Accepted client status values", "Active, Paused, Completed, Archived." },
                    new[] { "Accepted session status values", "Upcoming, Completed, Cancelled, NoShow." },
                    new[] { "Accepted payment status values", "Paid, Pending, Unpaid, Overdue." },
                    new[] { "Accepted session locations", "Zoom, Phone, Office, Other." },
                    new[] { "Matching rules", "Lumina will match clients by Email first, then Client Name. Sessions and notes use Client Email/Client Name plus Session Date." },
                    new[] { "Import status", "Actual Excel import is coming soon. This workbook is ready for export review and future imports." },
                }),
            new WorkbookSheet(
                "Clients",
                new[] { "Client Name", "Email", "Phone", "Status", "Program", "Start Date", "Address", "City", "State", "Zip", "Notes" },
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
                new[] { "Client Email", "Client Name", "Session Date", "Start Time", "Duration Minutes", "Session Type", "Location", "Status", "Payment Amount", "Payment Status", "Payment Date", "Payment Method", "Internal Notes" },
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
                new[] { "Client Email", "Client Name", "Session Date", "Note Type", "Note Text", "Template Name", "Field Name", "Field Value", "Created Date" },
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
                new[] { "Client Email", "Client Name", "Package Name", "Purchase Date", "Total Sessions", "Sessions Used", "Price", "Payment Status", "Payment Date", "Payment Method" },
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
                new[] { "Client Email", "Client Name", "Payment Date", "Amount", "Payment Method", "Payment Status", "Related Type", "Related Date", "Notes" },
                BuildPaymentRows(sessions, clientPackages, invoices, clientById, packageById)),
            new WorkbookSheet(
                "Providers",
                new[] { "Provider Name", "Email", "Role", "Phone", "Active" },
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
                new[] { "Setting Name", "Value" },
                practice is null
                    ? Array.Empty<IReadOnlyList<string>>()
                    : new List<IReadOnlyList<string>>
                    {
                        new[] { "Practice Name", practice.Name },
                        new[] { "Default Invoice Due Days", practice.BillingDefaultDueDays.ToString(CultureInfo.InvariantCulture) },
                        new[] { "Default Session Amount", practice.BillingDefaultSessionAmount.ToString(CultureInfo.InvariantCulture) },
                        new[] { "Notes Template Mode", practice.NotesTemplateMode },
                        new[] { "Selected Notes Template Kind", practice.NotesSelectedTemplateKind ?? string.Empty },
                    }),
        };
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
            yield return new[]
            {
                client?.Email ?? string.Empty,
                client?.Name ?? string.Empty,
                FormatNullableDate(session.PaymentDate),
                FormatNullableDecimal(session.PaymentAmount),
                session.PaymentMethod ?? string.Empty,
                session.PaymentStatus.ToString(),
                "Session",
                FormatDate(session.Date),
                session.SessionType,
            };
        }

        foreach (var clientPackage in clientPackages)
        {
            var client = clientById.GetValueOrDefault(clientPackage.ClientId);
            var package = packageById.GetValueOrDefault(clientPackage.PackageId);
            yield return new[]
            {
                client?.Email ?? string.Empty,
                client?.Name ?? string.Empty,
                FormatNullableDate(clientPackage.PaymentDate),
                FormatNullableDecimal(clientPackage.PaymentAmount ?? package?.Price),
                clientPackage.PaymentMethod ?? string.Empty,
                clientPackage.PaymentStatus.ToString(),
                "Package",
                FormatDate(clientPackage.PurchasedAt),
                package?.Name ?? string.Empty,
            };
        }

        foreach (var invoice in invoices)
        {
            var client = clientById.GetValueOrDefault(invoice.ClientId);
            yield return new[]
            {
                client?.Email ?? string.Empty,
                client?.Name ?? string.Empty,
                invoice.Status == InvoiceStatus.Paid ? FormatDate(invoice.CreatedAt) : string.Empty,
                invoice.Amount.ToString(CultureInfo.InvariantCulture),
                string.Empty,
                invoice.Status.ToString(),
                "Invoice",
                FormatDate(invoice.DueDate),
                $"{invoice.InvoiceNumber} {invoice.Description}".Trim(),
            };
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

public sealed class DataExportFile
{
    public DataExportFile(byte[] content, string fileName, string contentType)
    {
        Content = content;
        FileName = fileName;
        ContentType = contentType;
    }

    public byte[] Content { get; }

    public string FileName { get; }

    public string ContentType { get; }
}

internal sealed class WorkbookSheet
{
    public WorkbookSheet(
        string name,
        IReadOnlyList<string> headers,
        IEnumerable<IReadOnlyList<string>> rows,
        IReadOnlyList<WorkbookValidation>? validations = null,
        IReadOnlyList<WorkbookColumnStyle>? columnStyles = null)
    {
        Name = name;
        Headers = headers;
        Rows = rows;
        Validations = validations;
        ColumnStyles = columnStyles;
    }

    public string Name { get; }

    public IReadOnlyList<string> Headers { get; }

    public IEnumerable<IReadOnlyList<string>> Rows { get; }

    public IReadOnlyList<WorkbookValidation>? Validations { get; }

    public IReadOnlyList<WorkbookColumnStyle>? ColumnStyles { get; }
}

internal sealed class WorkbookValidation
{
    private WorkbookValidation(string sqref, string formula, bool quoteFormula)
    {
        Sqref = sqref;
        Formula = formula;
        QuoteFormula = quoteFormula;
    }

    public string Sqref { get; }

    public string Formula { get; }

    public bool QuoteFormula { get; }

    public static WorkbookValidation List(string sqref, string valuesCsv) =>
        new WorkbookValidation(sqref, valuesCsv, true);

    public static WorkbookValidation Range(string sqref, string rangeFormula) =>
        new WorkbookValidation(sqref, rangeFormula, false);

    public static WorkbookValidation FormulaList(string sqref, string formula) =>
        new WorkbookValidation(sqref, formula, false);
}

internal sealed class WorkbookColumnStyle
{
    public WorkbookColumnStyle(string column, WorkbookColumnFormat format)
    {
        Column = column;
        Format = format;
    }

    public string Column { get; }

    public WorkbookColumnFormat Format { get; }
}

internal enum WorkbookColumnFormat
{
    Date,
}

internal static class SimpleXlsxWorkbookWriter
{
    public static byte[] Write(IReadOnlyList<WorkbookSheet> sheets)
    {
        using var output = new MemoryStream();
        using (var archive = new ZipArchive(output, ZipArchiveMode.Create, leaveOpen: true))
        {
            WriteEntry(archive, "[Content_Types].xml", CreateContentTypesXml(sheets.Count));
            WriteEntry(archive, "_rels/.rels",
                "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>" +
                "<Relationships xmlns=\"http://schemas.openxmlformats.org/package/2006/relationships\">" +
                "<Relationship Id=\"rId1\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument\" Target=\"xl/workbook.xml\"/>" +
                "</Relationships>");
            WriteEntry(archive, "xl/workbook.xml", CreateWorkbookXml(sheets));
            WriteEntry(archive, "xl/_rels/workbook.xml.rels", CreateWorkbookRelationshipsXml(sheets.Count));
            WriteEntry(archive, "xl/styles.xml",
                "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>" +
                "<styleSheet xmlns=\"http://schemas.openxmlformats.org/spreadsheetml/2006/main\">" +
                "<numFmts count=\"1\"><numFmt numFmtId=\"164\" formatCode=\"yyyy-mm-dd\"/></numFmts>" +
                "<fonts count=\"2\"><font><sz val=\"11\"/><name val=\"Calibri\"/></font><font><b/><sz val=\"11\"/><name val=\"Calibri\"/></font></fonts>" +
                "<fills count=\"1\"><fill><patternFill patternType=\"none\"/></fill></fills>" +
                "<borders count=\"1\"><border><left/><right/><top/><bottom/><diagonal/></border></borders>" +
                "<cellStyleXfs count=\"1\"><xf numFmtId=\"0\" fontId=\"0\" fillId=\"0\" borderId=\"0\"/></cellStyleXfs>" +
                "<cellXfs count=\"3\"><xf numFmtId=\"0\" fontId=\"0\" fillId=\"0\" borderId=\"0\" xfId=\"0\"/><xf numFmtId=\"0\" fontId=\"1\" fillId=\"0\" borderId=\"0\" xfId=\"0\"/><xf numFmtId=\"164\" fontId=\"0\" fillId=\"0\" borderId=\"0\" xfId=\"0\" applyNumberFormat=\"1\"/></cellXfs>" +
                "</styleSheet>");

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
            .Select(index => $"<Override PartName=\"/xl/worksheets/sheet{index}.xml\" ContentType=\"application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml\"/>"));

        return
            "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>" +
            "<Types xmlns=\"http://schemas.openxmlformats.org/package/2006/content-types\">" +
            "<Default Extension=\"rels\" ContentType=\"application/vnd.openxmlformats-package.relationships+xml\"/>" +
            "<Default Extension=\"xml\" ContentType=\"application/xml\"/>" +
            "<Override PartName=\"/xl/workbook.xml\" ContentType=\"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml\"/>" +
            "<Override PartName=\"/xl/styles.xml\" ContentType=\"application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml\"/>" +
            overrides +
            "</Types>";
    }

    private static string CreateWorkbookXml(IReadOnlyList<WorkbookSheet> sheets)
    {
        var sheetNodes = string.Join(string.Empty, sheets.Select((sheet, index) =>
            $"<sheet name=\"{EscapeAttribute(sheet.Name)}\" sheetId=\"{index + 1}\" r:id=\"rId{index + 1}\"/>"));

        return
            "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>" +
            "<workbook xmlns=\"http://schemas.openxmlformats.org/spreadsheetml/2006/main\" xmlns:r=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships\">" +
            $"<sheets>{sheetNodes}</sheets>" +
            "</workbook>";
    }

    private static string CreateWorkbookRelationshipsXml(int sheetCount)
    {
        var relationships = string.Join(string.Empty, Enumerable.Range(1, sheetCount)
            .Select(index => $"<Relationship Id=\"rId{index}\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet\" Target=\"worksheets/sheet{index}.xml\"/>"));

        return
            "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>" +
            "<Relationships xmlns=\"http://schemas.openxmlformats.org/package/2006/relationships\">" +
            relationships +
            $"<Relationship Id=\"rId{sheetCount + 1}\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles\" Target=\"styles.xml\"/>" +
            "</Relationships>";
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
        var columnNodes = CreateColumnWidthXml(rows, sheet.ColumnStyles);
        var validationNodes = CreateDataValidationsXml(sheet.Validations);

        return
            "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>" +
            "<worksheet xmlns=\"http://schemas.openxmlformats.org/spreadsheetml/2006/main\">" +
            columnNodes +
            $"<sheetData>{string.Join(string.Empty, rowNodes)}</sheetData>" +
            validationNodes +
            "</worksheet>";
    }

    private static string CreateColumnWidthXml(
        IReadOnlyList<IReadOnlyList<string>> rows,
        IReadOnlyList<WorkbookColumnStyle>? columnStyles)
    {
        var columnCount = rows.Count == 0 ? 0 : rows.Max(row => row.Count);
        if (columnCount == 0)
        {
            return string.Empty;
        }

        var styleByColumnIndex = (columnStyles ?? Array.Empty<WorkbookColumnStyle>())
            .ToDictionary(style => GetColumnIndex(style.Column), style => style);

        var columns = Enumerable.Range(0, columnCount).Select(index =>
        {
            var maxLength = rows
                .Where(row => index < row.Count)
                .Select(row => row[index]?.Length ?? 0)
                .DefaultIfEmpty(0)
                .Max();
            var width = Math.Clamp(maxLength + 2, 12, 48);
            var styleAttribute = styleByColumnIndex.TryGetValue(index, out var style)
                ? $" style=\"{GetStyleId(style.Format)}\""
                : string.Empty;
            return $"<col min=\"{index + 1}\" max=\"{index + 1}\" width=\"{width}\" customWidth=\"1\"{styleAttribute}/>";
        });

        return $"<cols>{string.Join(string.Empty, columns)}</cols>";
    }

    private static string CreateDataValidationsXml(IReadOnlyList<WorkbookValidation>? validations)
    {
        if (validations is null || validations.Count == 0)
        {
            return string.Empty;
        }

        var nodes = validations.Select(validation =>
        {
            var formula = validation.QuoteFormula
                ? $"\"{EscapeText(validation.Formula)}\""
                : EscapeText(validation.Formula);
            return $"<dataValidation type=\"list\" allowBlank=\"1\" sqref=\"{validation.Sqref}\"><formula1>{formula}</formula1></dataValidation>";
        });

        return $"<dataValidations count=\"{validations.Count}\">{string.Join(string.Empty, nodes)}</dataValidations>";
    }

    private static string CreateRowXml(int rowNumber, IReadOnlyList<string> values, bool isHeader)
    {
        var cells = values.Select((value, columnIndex) =>
            $"<c r=\"{GetCellReference(columnIndex, rowNumber)}\" t=\"inlineStr\"{(isHeader ? " s=\"1\"" : string.Empty)}><is><t>{EscapeText(value)}</t></is></c>");

        return $"<row r=\"{rowNumber}\">{string.Join(string.Empty, cells)}</row>";
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

    private static int GetColumnIndex(string columnName)
    {
        var index = 0;
        foreach (var character in columnName.Trim().ToUpperInvariant())
        {
            index *= 26;
            index += character - 'A' + 1;
        }

        return index - 1;
    }

    private static int GetStyleId(WorkbookColumnFormat format) =>
        format switch
        {
            WorkbookColumnFormat.Date => 2,
            _ => 0,
        };

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
