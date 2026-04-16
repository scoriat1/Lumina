namespace Lumina.Domain.Entities;

public class Package
{
    public int Id { get; set; }
    public int PracticeId { get; set; }
    public Practice Practice { get; set; } = default!;
    public string Name { get; set; } = string.Empty;
    public string BillingType { get; set; } = "oneTime";
    public int SessionCount { get; set; }
    public decimal? Price { get; set; }
    public bool IsActive { get; set; }
}
