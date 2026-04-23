namespace Lumina.Domain.Entities;

public class SavedReport
{
    public int Id { get; set; }
    public int PracticeId { get; set; }
    public Practice Practice { get; set; } = default!;
    public int ProviderId { get; set; }
    public Provider Provider { get; set; } = default!;
    public string Name { get; set; } = string.Empty;
    public string ReportType { get; set; } = string.Empty;
    public int? TemplateId { get; set; }
    public Template? Template { get; set; }
    public int? TemplateFieldId { get; set; }
    public string? FieldKey { get; set; }
    public string? AnalysisType { get; set; }
    public string FiltersJson { get; set; } = "{}";
    public string DisplayOptionsJson { get; set; } = "{}";
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
}
