namespace Lumina.Domain.Entities;

public class ClientPackage
{
    public Guid Id { get; set; }
    public Guid PracticeId { get; set; }
    public Practice Practice { get; set; } = default!;
    public Guid ClientId { get; set; }
    public Client Client { get; set; } = default!;
    public Guid PackageId { get; set; }
    public Package Package { get; set; } = default!;
    public DateTimeOffset PurchasedAt { get; set; }
    public int RemainingSessions { get; set; }
}
