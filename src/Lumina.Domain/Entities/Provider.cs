using Lumina.Domain.Enums;

namespace Lumina.Domain.Entities;

public class Provider
{
    public int Id { get; set; }
    public int PracticeId { get; set; }
    public Practice Practice { get; set; } = default!;
    public string UserId { get; set; } = string.Empty;
    public AppUser User { get; set; } = default!;
    public string DisplayName { get; set; } = string.Empty;
    public ProviderRole Role { get; set; }
    public bool IsActive { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
}
