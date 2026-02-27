namespace Lumina.Domain.Entities;

public class SessionNote
{
    public Guid Id { get; set; }
    public Guid SessionId { get; set; }
    public Session Session { get; set; } = default!;
    public Guid? TemplateId { get; set; }
    public Template? Template { get; set; }
    public string Content { get; set; } = string.Empty;
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
}
