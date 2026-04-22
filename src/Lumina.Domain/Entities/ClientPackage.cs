using Lumina.Domain.Enums;

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
    public decimal? PaymentAmount { get; set; }
    public PaymentStatus PaymentStatus { get; set; } = PaymentStatus.Pending;
    public DateTimeOffset? PaymentDate { get; set; }
    public string? PaymentMethod { get; set; }
    public ICollection<Session> Sessions { get; set; } = new List<Session>();
}
