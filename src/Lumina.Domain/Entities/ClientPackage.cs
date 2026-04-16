namespace Lumina.Domain.Entities;

public class ClientPackage
{
    public int Id { get; set; }
    public int PracticeId { get; set; }
    public Practice Practice { get; set; } = default!;
    public int ClientId { get; set; }
    public Client Client { get; set; } = default!;
    public int PackageId { get; set; }
    public Package Package { get; set; } = default!;
    public DateTimeOffset PurchasedAt { get; set; }
    public int RemainingSessions { get; set; }
    public ICollection<Session> Sessions { get; set; } = new List<Session>();
}
