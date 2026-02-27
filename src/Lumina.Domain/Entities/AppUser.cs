using Microsoft.AspNetCore.Identity;

namespace Lumina.Domain.Entities;

public class AppUser : IdentityUser<Guid>
{
    public string DisplayName { get; set; } = string.Empty;
    public ICollection<Provider> Providers { get; set; } = new List<Provider>();
}
