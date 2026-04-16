using Lumina.Domain.Enums;

namespace Lumina.Domain.Entities;

public class Invoice
{
    public int Id { get; set; }
    public int PracticeId { get; set; }
    public Practice Practice { get; set; } = default!;
    public int ClientId { get; set; }
    public Client Client { get; set; } = default!;
    public string InvoiceNumber { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public DateOnly DueDate { get; set; }
    public InvoiceStatus Status { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public ICollection<Session> Sessions { get; set; } = new List<Session>();
}
