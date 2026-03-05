namespace Lumina.Domain.Entities;

public class Template
{
    public int Id { get; set; }
    public int PracticeId { get; set; }
    public Practice Practice { get; set; } = default!;
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int? SourcePresetId { get; set; }
    public TemplatePreset? SourcePreset { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public ICollection<TemplateField> Fields { get; set; } = new List<TemplateField>();
}
