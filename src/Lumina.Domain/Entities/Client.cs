using Lumina.Domain.Enums;

namespace Lumina.Domain.Entities;

public class Client
{
    public Guid Id { get; set; }
    public Guid PracticeId { get; set; }
    public Practice Practice { get; set; } = default!;
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Program { get; set; } = string.Empty;
    public string AvatarColor { get; set; } = "#9B8B9E";
    public DateOnly StartDate { get; set; }
    public ClientStatus Status { get; set; } = ClientStatus.Active;
    public string? Notes { get; set; }
    public string? ExternalSource { get; set; }
    public string? ExternalId { get; set; }
    public ICollection<Session> Sessions { get; set; } = new List<Session>();
}
