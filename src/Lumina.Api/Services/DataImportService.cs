using System.Globalization;
using System.IO.Compression;
using System.Security;
using System.Xml.Linq;
using Lumina.Domain.Entities;
using Lumina.Domain.Enums;
using Lumina.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Lumina.Api.Services;

public interface IDataImportService
{
    Task<DataImportResult> ImportPracticeDataAsync(
        int practiceId,
        int providerId,
        Stream workbookStream,
        CancellationToken cancellationToken);
}

public sealed class DataImportService : IDataImportService
{
    private readonly LuminaDbContext db;

    public DataImportService(LuminaDbContext db)
    {
        this.db = db;
    }

    public async Task<DataImportResult> ImportPracticeDataAsync(
        int practiceId,
        int providerId,
        Stream workbookStream,
        CancellationToken cancellationToken)
    {
        var workbook = SimpleXlsxWorkbookReader.Read(workbookStream);
        var errors = new List<string>();

        var clientRows = workbook.GetRows("Clients");
        var sessionRows = workbook.GetRows("Sessions");
        var noteRows = workbook.GetRows("Notes");

        if (clientRows.Count == 0 && sessionRows.Count == 0 && noteRows.Count == 0)
        {
            errors.Add("The workbook does not include any rows to import.");
        }

        var existingClients = await db.Clients
            .Where(client => client.PracticeId == practiceId)
            .ToListAsync(cancellationToken);
        var clientsByName = existingClients
            .GroupBy(client => NormalizeKey(client.Name))
            .Where(group => !string.IsNullOrWhiteSpace(group.Key))
            .ToDictionary(group => group.Key, group => group.First());

        var clientNamesInTemplate = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        var clientsToCreate = new List<Client>();
        foreach (var row in clientRows)
        {
            var rowLabel = $"Clients row {row.RowNumber}";
            var name = row.Get("Client Name");
            if (string.IsNullOrWhiteSpace(name))
            {
                errors.Add($"{rowLabel}: Client Name is required.");
                continue;
            }

            var normalizedName = NormalizeKey(name);
            if (!clientNamesInTemplate.Add(normalizedName))
            {
                errors.Add($"{rowLabel}: Client Name '{name}' appears more than once in the Clients sheet.");
                continue;
            }

            if (clientsByName.ContainsKey(normalizedName))
            {
                continue;
            }

            if (!TryParseClientStatus(row.Get("Status"), out var status))
            {
                errors.Add($"{rowLabel}: Status must be Active or Inactive.");
                continue;
            }

            var client = new Client
            {
                PracticeId = practiceId,
                Name = name.Trim(),
                Email = row.Get("Email").Trim(),
                Phone = row.Get("Phone (optional)").Trim(),
                Program = string.Empty,
                StartDate = DateOnly.FromDateTime(DateTime.UtcNow),
                Status = status,
                BillingModel = BillingModel.PayPerSession,
                ExternalSource = "excel-import"
            };

            clientsToCreate.Add(client);
            clientsByName[normalizedName] = client;
        }

        var sessionsToCreate = new List<SessionImportItem>();
        foreach (var row in sessionRows)
        {
            var rowLabel = $"Sessions row {row.RowNumber}";
            var clientName = row.Get("Client Name");
            if (string.IsNullOrWhiteSpace(clientName))
            {
                errors.Add($"{rowLabel}: Client Name is required.");
                continue;
            }

            var client = GetOrCreateImportClient(
                practiceId,
                clientName,
                clientsByName,
                clientsToCreate);

            if (!TryParseDate(row.Get("Session Date"), out var sessionDate))
            {
                errors.Add($"{rowLabel}: Session Date must be a valid date.");
                continue;
            }

            if (!int.TryParse(row.Get("Duration (minutes)"), NumberStyles.Integer, CultureInfo.InvariantCulture, out var duration) || duration <= 0)
            {
                errors.Add($"{rowLabel}: Duration must be a positive number of minutes.");
                continue;
            }

            if (!TryParseSessionStatus(row.Get("Status"), out var status))
            {
                errors.Add($"{rowLabel}: Status must be Completed, Upcoming, or Cancelled.");
                continue;
            }

            decimal? amount = null;
            var amountValue = row.Get("Amount (optional)");
            if (!string.IsNullOrWhiteSpace(amountValue))
            {
                if (!decimal.TryParse(amountValue, NumberStyles.Number | NumberStyles.AllowCurrencySymbol, CultureInfo.InvariantCulture, out var parsedAmount) || parsedAmount < 0)
                {
                    errors.Add($"{rowLabel}: Amount must be a valid positive number.");
                    continue;
                }

                amount = decimal.Round(parsedAmount, 2, MidpointRounding.AwayFromZero);
            }

            sessionsToCreate.Add(new SessionImportItem(
                client,
                sessionDate,
                new Session
                {
                    PracticeId = practiceId,
                    ProviderId = providerId,
                    Client = client,
                    Date = ToDateTimeOffset(sessionDate),
                    Duration = duration,
                    Status = status,
                    Location = SessionLocation.Zoom,
                    SessionType = "Imported session",
                    Focus = string.Empty,
                    PaymentAmount = amount,
                    PaymentStatus = amount.HasValue ? PaymentStatus.Pending : PaymentStatus.Unpaid
                }));
        }

        var existingSessions = await db.Sessions
            .Where(session => session.PracticeId == practiceId)
            .ToListAsync(cancellationToken);

        var notesToCreate = new List<SessionNote>();
        foreach (var row in noteRows)
        {
            var rowLabel = $"Notes row {row.RowNumber}";
            var clientName = row.Get("Client Name");
            if (string.IsNullOrWhiteSpace(clientName))
            {
                errors.Add($"{rowLabel}: Client Name is required.");
                continue;
            }

            var client = GetOrCreateImportClient(
                practiceId,
                clientName,
                clientsByName,
                clientsToCreate);

            var noteText = row.Get("Note");
            if (string.IsNullOrWhiteSpace(noteText))
            {
                errors.Add($"{rowLabel}: Note is required.");
                continue;
            }

            Session? matchedSession = null;
            var dateValue = row.Get("Session Date");
            if (!string.IsNullOrWhiteSpace(dateValue))
            {
                if (!TryParseDate(dateValue, out var noteSessionDate))
                {
                    errors.Add($"{rowLabel}: Session Date must be a valid date.");
                    continue;
                }

                matchedSession = sessionsToCreate
                    .Where(item => ReferenceEquals(item.Client, client) && item.SessionDate == noteSessionDate)
                    .Select(item => item.Session)
                    .FirstOrDefault();

                matchedSession ??= existingSessions
                    .Where(session => session.ClientId == client.Id && DateOnly.FromDateTime(session.Date.Date) == noteSessionDate)
                    .OrderBy(session => session.Date)
                    .FirstOrDefault();

                if (matchedSession is null)
                {
                    errors.Add($"{rowLabel}: No matching session was found for '{clientName}' on {noteSessionDate:yyyy-MM-dd}.");
                    continue;
                }
            }

            var now = DateTimeOffset.UtcNow;
            notesToCreate.Add(new SessionNote
            {
                Client = client,
                Session = matchedSession,
                NoteType = "general",
                Source = "excel-import",
                Content = noteText.Trim(),
                CreatedAt = now,
                UpdatedAt = now
            });
        }

        if (errors.Count > 0)
        {
            return DataImportResult.Failed(errors);
        }

        await using var transaction = await db.Database.BeginTransactionAsync(cancellationToken);
        db.Clients.AddRange(clientsToCreate);
        db.Sessions.AddRange(sessionsToCreate.Select(item => item.Session));
        db.SessionNotes.AddRange(notesToCreate);
        await db.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);

        return DataImportResult.Succeeded(clientsToCreate.Count, sessionsToCreate.Count, notesToCreate.Count);
    }

    private static bool TryParseClientStatus(string value, out ClientStatus status)
    {
        var normalized = NormalizeKey(value);
        if (normalized == "active")
        {
            status = ClientStatus.Active;
            return true;
        }

        if (normalized == "inactive")
        {
            status = ClientStatus.Completed;
            return true;
        }

        status = ClientStatus.Active;
        return false;
    }

    private static Client GetOrCreateImportClient(
        int practiceId,
        string clientName,
        IDictionary<string, Client> clientsByName,
        ICollection<Client> clientsToCreate)
    {
        var normalizedName = NormalizeKey(clientName);
        if (clientsByName.TryGetValue(normalizedName, out var client))
        {
            return client;
        }

        client = new Client
        {
            PracticeId = practiceId,
            Name = clientName.Trim(),
            Email = string.Empty,
            Phone = string.Empty,
            Program = string.Empty,
            StartDate = DateOnly.FromDateTime(DateTime.UtcNow),
            Status = ClientStatus.Active,
            BillingModel = BillingModel.PayPerSession,
            ExternalSource = "excel-import"
        };

        clientsToCreate.Add(client);
        clientsByName[normalizedName] = client;
        return client;
    }

    private static bool TryParseSessionStatus(string value, out SessionStatus status)
    {
        switch (NormalizeKey(value))
        {
            case "completed":
                status = SessionStatus.Completed;
                return true;
            case "upcoming":
                status = SessionStatus.Upcoming;
                return true;
            case "cancelled":
                status = SessionStatus.Cancelled;
                return true;
            default:
                status = SessionStatus.Upcoming;
                return false;
        }
    }

    private static bool TryParseDate(string value, out DateOnly date)
    {
        value = value.Trim();
        if (double.TryParse(value, NumberStyles.Number, CultureInfo.InvariantCulture, out var serialDate))
        {
            date = DateOnly.FromDateTime(DateTime.FromOADate(serialDate));
            return true;
        }

        if (DateOnly.TryParseExact(value, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out date))
        {
            return true;
        }

        if (DateOnly.TryParse(value, CultureInfo.InvariantCulture, DateTimeStyles.None, out date))
        {
            return true;
        }

        return false;
    }

    private static DateTimeOffset ToDateTimeOffset(DateOnly date) =>
        new DateTimeOffset(date.ToDateTime(TimeOnly.MinValue), TimeSpan.Zero);

    private static string NormalizeKey(string value) => value.Trim().ToLowerInvariant();

    private sealed class SessionImportItem
    {
        public SessionImportItem(Client client, DateOnly sessionDate, Session session)
        {
            Client = client;
            SessionDate = sessionDate;
            Session = session;
        }

        public Client Client { get; }

        public DateOnly SessionDate { get; }

        public Session Session { get; }
    }
}

public sealed class DataImportResult
{
    private DataImportResult(bool success, int clientsImported, int sessionsImported, int notesImported, IReadOnlyList<string> errors)
    {
        Success = success;
        ClientsImported = clientsImported;
        SessionsImported = sessionsImported;
        NotesImported = notesImported;
        Errors = errors;
    }

    public bool Success { get; }

    public int ClientsImported { get; }

    public int SessionsImported { get; }

    public int NotesImported { get; }

    public IReadOnlyList<string> Errors { get; }

    public static DataImportResult Succeeded(int clientsImported, int sessionsImported, int notesImported) =>
        new DataImportResult(true, clientsImported, sessionsImported, notesImported, Array.Empty<string>());

    public static DataImportResult Failed(IReadOnlyList<string> errors) =>
        new DataImportResult(false, 0, 0, 0, errors);
}

internal sealed class SimpleXlsxWorkbookReader
{
    private static readonly XNamespace SpreadsheetNamespace = "http://schemas.openxmlformats.org/spreadsheetml/2006/main";
    private static readonly XNamespace RelationshipNamespace = "http://schemas.openxmlformats.org/officeDocument/2006/relationships";
    private static readonly XNamespace PackageRelationshipNamespace = "http://schemas.openxmlformats.org/package/2006/relationships";

    private readonly Dictionary<string, IReadOnlyList<WorkbookImportRow>> rowsBySheet;

    private SimpleXlsxWorkbookReader(Dictionary<string, IReadOnlyList<WorkbookImportRow>> rowsBySheet)
    {
        this.rowsBySheet = rowsBySheet;
    }

    public static SimpleXlsxWorkbookReader Read(Stream stream)
    {
        using var archive = new ZipArchive(stream, ZipArchiveMode.Read, leaveOpen: true);
        var sharedStrings = ReadSharedStrings(archive);
        var sheets = ReadSheetTargets(archive);
        var rowsBySheet = new Dictionary<string, IReadOnlyList<WorkbookImportRow>>(StringComparer.OrdinalIgnoreCase);

        foreach (var sheet in sheets)
        {
            var entry = archive.GetEntry(sheet.Target);
            if (entry is null)
            {
                continue;
            }

            using var entryStream = entry.Open();
            var document = XDocument.Load(entryStream);
            var rowElements = document.Descendants(SpreadsheetNamespace + "row").ToList();
            if (rowElements.Count == 0)
            {
                rowsBySheet[sheet.Name] = Array.Empty<WorkbookImportRow>();
                continue;
            }

            var headers = ReadRow(rowElements[0], sharedStrings);
            var dataRows = new List<WorkbookImportRow>();
            foreach (var rowElement in rowElements.Skip(1))
            {
                var values = ReadRow(rowElement, sharedStrings);
                if (values.All(string.IsNullOrWhiteSpace))
                {
                    continue;
                }

                var rowNumber = (int?)rowElement.Attribute("r") ?? dataRows.Count + 2;
                dataRows.Add(new WorkbookImportRow(rowNumber, headers, values));
            }

            rowsBySheet[sheet.Name] = dataRows;
        }

        return new SimpleXlsxWorkbookReader(rowsBySheet);
    }

    public IReadOnlyList<WorkbookImportRow> GetRows(string sheetName) =>
        rowsBySheet.TryGetValue(sheetName, out var rows) ? rows : Array.Empty<WorkbookImportRow>();

    private static IReadOnlyList<string> ReadSharedStrings(ZipArchive archive)
    {
        var entry = archive.GetEntry("xl/sharedStrings.xml");
        if (entry is null)
        {
            return Array.Empty<string>();
        }

        using var stream = entry.Open();
        var document = XDocument.Load(stream);
        return document.Descendants(SpreadsheetNamespace + "si")
            .Select(item => string.Concat(item.Descendants(SpreadsheetNamespace + "t").Select(text => text.Value)))
            .ToList();
    }

    private static IReadOnlyList<WorkbookImportSheet> ReadSheetTargets(ZipArchive archive)
    {
        var workbookEntry = archive.GetEntry("xl/workbook.xml") ?? throw new InvalidOperationException("The workbook is missing xl/workbook.xml.");
        var relationshipsEntry = archive.GetEntry("xl/_rels/workbook.xml.rels") ?? throw new InvalidOperationException("The workbook is missing workbook relationships.");

        using var workbookStream = workbookEntry.Open();
        using var relationshipsStream = relationshipsEntry.Open();
        var workbookDocument = XDocument.Load(workbookStream);
        var relationshipsDocument = XDocument.Load(relationshipsStream);

        var targetById = relationshipsDocument
            .Descendants(PackageRelationshipNamespace + "Relationship")
            .Where(element => element.Attribute("Id") is not null && element.Attribute("Target") is not null)
            .ToDictionary(
                element => element.Attribute("Id")!.Value,
                element => NormalizeWorksheetTarget(element.Attribute("Target")!.Value));

        return workbookDocument
            .Descendants(SpreadsheetNamespace + "sheet")
            .Select(sheet =>
            {
                var relationshipId = sheet.Attribute(RelationshipNamespace + "id")?.Value ?? string.Empty;
                return new WorkbookImportSheet(
                    sheet.Attribute("name")?.Value ?? string.Empty,
                    targetById.TryGetValue(relationshipId, out var target) ? target : string.Empty);
            })
            .Where(sheet => !string.IsNullOrWhiteSpace(sheet.Name) && !string.IsNullOrWhiteSpace(sheet.Target))
            .ToList();
    }

    private static IReadOnlyList<string> ReadRow(XElement rowElement, IReadOnlyList<string> sharedStrings)
    {
        var valuesByIndex = new Dictionary<int, string>();
        foreach (var cellElement in rowElement.Elements(SpreadsheetNamespace + "c"))
        {
            var reference = cellElement.Attribute("r")?.Value ?? string.Empty;
            var columnIndex = GetColumnIndex(reference);
            if (columnIndex < 0)
            {
                continue;
            }

            valuesByIndex[columnIndex] = ReadCellValue(cellElement, sharedStrings);
        }

        var columnCount = valuesByIndex.Count == 0 ? 0 : valuesByIndex.Keys.Max() + 1;
        var values = new string[columnCount];
        for (var index = 0; index < values.Length; index++)
        {
            values[index] = valuesByIndex.TryGetValue(index, out var value) ? value : string.Empty;
        }

        return values;
    }

    private static string ReadCellValue(XElement cellElement, IReadOnlyList<string> sharedStrings)
    {
        var type = cellElement.Attribute("t")?.Value;
        if (type == "inlineStr")
        {
            return string.Concat(cellElement.Descendants(SpreadsheetNamespace + "t").Select(text => text.Value)).Trim();
        }

        var rawValue = cellElement.Element(SpreadsheetNamespace + "v")?.Value ?? string.Empty;
        if (type == "s" && int.TryParse(rawValue, NumberStyles.Integer, CultureInfo.InvariantCulture, out var sharedStringIndex))
        {
            return sharedStringIndex >= 0 && sharedStringIndex < sharedStrings.Count
                ? sharedStrings[sharedStringIndex].Trim()
                : string.Empty;
        }

        return rawValue.Trim();
    }

    private static int GetColumnIndex(string cellReference)
    {
        var index = 0;
        var hasColumn = false;
        foreach (var character in cellReference)
        {
            if (!char.IsLetter(character))
            {
                break;
            }

            hasColumn = true;
            index *= 26;
            index += char.ToUpperInvariant(character) - 'A' + 1;
        }

        return hasColumn ? index - 1 : -1;
    }

    private static string NormalizeWorksheetTarget(string target) =>
        target.StartsWith("xl/", StringComparison.OrdinalIgnoreCase)
            ? target
            : $"xl/{target.TrimStart('/')}";
}

internal sealed class WorkbookImportSheet
{
    public WorkbookImportSheet(string name, string target)
    {
        Name = name;
        Target = target;
    }

    public string Name { get; }

    public string Target { get; }
}

internal sealed class WorkbookImportRow
{
    private readonly Dictionary<string, string> valuesByHeader;

    public WorkbookImportRow(int rowNumber, IReadOnlyList<string> headers, IReadOnlyList<string> values)
    {
        RowNumber = rowNumber;
        valuesByHeader = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
        for (var index = 0; index < headers.Count; index++)
        {
            var header = headers[index];
            if (string.IsNullOrWhiteSpace(header))
            {
                continue;
            }

            valuesByHeader[header.Trim()] = index < values.Count ? values[index] : string.Empty;
        }
    }

    public int RowNumber { get; }

    public string Get(string header) =>
        valuesByHeader.TryGetValue(header, out var value) ? value : string.Empty;
}
