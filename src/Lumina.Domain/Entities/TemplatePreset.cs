namespace Lumina.Domain.Entities;

public class TemplatePreset
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public ICollection<TemplatePresetField> Fields { get; set; } = new List<TemplatePresetField>();
}
