namespace Lumina.Domain.Entities;

public class TemplatePresetField
{
    public int Id { get; set; }
    public int TemplatePresetId { get; set; }
    public TemplatePreset TemplatePreset { get; set; } = default!;
    public string Label { get; set; } = string.Empty;
    public int SortOrder { get; set; }
    public string? FieldType { get; set; }
}
