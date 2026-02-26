using Lumina.Domain.Enums;

namespace Lumina.Domain.Entities;

public class Client
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public User User { get; set; } = default!;
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Program { get; set; } = string.Empty;
    public string AvatarColor { get; set; } = "#9B8B9E";
    public DateOnly StartDate { get; set; }
    public ClientStatus Status { get; set; } = ClientStatus.Active;
    public string? Notes { get; set; }
    public ICollection<Session> Sessions { get; set; } = new List<Session>();
}
