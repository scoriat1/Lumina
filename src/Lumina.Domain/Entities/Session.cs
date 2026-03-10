using Lumina.Domain.Enums;

namespace Lumina.Domain.Entities;

public class Session
{
    public int Id { get; set; }
    public int PracticeId { get; set; }
    public Practice Practice { get; set; } = default!;
    public int ProviderId { get; set; }
    public Provider Provider { get; set; } = default!;
    public int ClientId { get; set; }
    public Client Client { get; set; } = default!;
    public DateTimeOffset Date { get; set; }
    public int Duration { get; set; }
    public SessionLocation Location { get; set; }
    public SessionStatus Status { get; set; }
    public string SessionType { get; set; } = string.Empty;
    public string Focus { get; set; } = string.Empty;
    public string? Notes { get; set; }
    public ICollection<SessionNote> SessionNotes { get; set; } = new List<SessionNote>();
}
