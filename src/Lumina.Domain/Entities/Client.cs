using Lumina.Domain.Enums;

namespace Lumina.Domain.Entities;

public class Client
{
    public int Id { get; set; }
    public int PracticeId { get; set; }
    public Practice Practice { get; set; } = default!;
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Program { get; set; } = string.Empty;
    public DateOnly StartDate { get; set; }
    public ClientStatus Status { get; set; } = ClientStatus.Active;
    public BillingModel BillingModel { get; set; } = BillingModel.PayPerSession;
    public string? Notes { get; set; }
    public string? ExternalSource { get; set; }
    public string? ExternalId { get; set; }
    public ICollection<Session> Sessions { get; set; } = new List<Session>();
    public ICollection<SessionNote> SessionNotes { get; set; } = new List<SessionNote>();
}
