namespace Lumina.Domain.Entities;

public class Template
{
    public Guid Id { get; set; }
    public Guid PracticeId { get; set; }
    public Practice Practice { get; set; } = default!;
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public Guid? SourcePresetId { get; set; }
    public TemplatePreset? SourcePreset { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public ICollection<TemplateField> Fields { get; set; } = new List<TemplateField>();
}
