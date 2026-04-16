namespace Lumina.Domain.Entities;

public class Practice
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public int BillingDefaultDueDays { get; set; } = 30;
    public decimal BillingDefaultSessionAmount { get; set; } = 125m;
    public string NotesTemplateMode { get; set; } = "default";
    public string? NotesSelectedTemplateKind { get; set; }
    public int? NotesSelectedTemplateId { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public ICollection<Provider> Providers { get; set; } = new List<Provider>();
    public ICollection<Template> Templates { get; set; } = new List<Template>();
}
