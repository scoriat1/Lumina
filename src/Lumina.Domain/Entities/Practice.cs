namespace Lumina.Domain.Entities;

public class Practice
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public DateTimeOffset CreatedAt { get; set; }
    public ICollection<Provider> Providers { get; set; } = new List<Provider>();
}
