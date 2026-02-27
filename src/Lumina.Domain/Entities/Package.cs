namespace Lumina.Domain.Entities;

public class Package
{
    public Guid Id { get; set; }
    public Guid PracticeId { get; set; }
    public Practice Practice { get; set; } = default!;
    public string Name { get; set; } = string.Empty;
    public int SessionCount { get; set; }
    public decimal? Price { get; set; }
    public bool IsActive { get; set; }
}
