namespace Lumina.Domain.Entities;

public class TemplateField
{
    public Guid Id { get; set; }
    public Guid TemplateId { get; set; }
    public Template Template { get; set; } = default!;
    public string Label { get; set; } = string.Empty;
    public int SortOrder { get; set; }
    public string? FieldType { get; set; }
}
