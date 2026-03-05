namespace Lumina.Domain.Entities;

public class SessionNote
{
    public int Id { get; set; }
    public int SessionId { get; set; }
    public Session Session { get; set; } = default!;
    public int? TemplateId { get; set; }
    public Template? Template { get; set; }
    public string Content { get; set; } = string.Empty;
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
}
