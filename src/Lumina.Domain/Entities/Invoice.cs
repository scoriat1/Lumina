using Lumina.Domain.Enums;

namespace Lumina.Domain.Entities;

public class Invoice
{
    public Guid Id { get; set; }
    public Guid PracticeId { get; set; }
    public Practice Practice { get; set; } = default!;
    public Guid ClientId { get; set; }
    public Client Client { get; set; } = default!;
    public string InvoiceNumber { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public DateOnly DueDate { get; set; }
    public InvoiceStatus Status { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
}
