using System.Net;
using System.Net.Mail;
using System.Text;
using Microsoft.Extensions.Options;

namespace Lumina.Api.Services;

public interface ISupportEmailService
{
    Task SendSupportMessageAsync(SupportEmailMessage message, CancellationToken cancellationToken);
}

public sealed class SupportEmailService : ISupportEmailService
{
    private const string DefaultLabelName = "Lumina Support";
    private readonly SupportEmailOptions supportOptions;
    private readonly SmtpOptions smtpOptions;

    public SupportEmailService(
        IOptions<SupportEmailOptions> supportOptions,
        IOptions<SmtpOptions> smtpOptions)
    {
        this.supportOptions = supportOptions.Value;
        this.smtpOptions = smtpOptions.Value;
    }

    public async Task SendSupportMessageAsync(SupportEmailMessage message, CancellationToken cancellationToken)
    {
        ValidateConfiguration();

        using var mailMessage = new MailMessage
        {
            From = new MailAddress(supportOptions.FromAddress),
            Subject = BuildSubject(message.Subject),
            Body = BuildBody(message),
            IsBodyHtml = false,
        };

        mailMessage.To.Add(new MailAddress(supportOptions.ToAddress));
        mailMessage.ReplyToList.Add(new MailAddress(message.SubmittedEmail, message.SubmittedName));

        using var client = new SmtpClient(smtpOptions.Host, smtpOptions.Port)
        {
            EnableSsl = smtpOptions.UseSsl,
            Credentials = new NetworkCredential(smtpOptions.Username, smtpOptions.Password),
        };

        // Gmail SMTP requires 2-Step Verification plus an App Password. Do not use a normal Gmail password.
        cancellationToken.ThrowIfCancellationRequested();
        await client.SendMailAsync(mailMessage);
    }

    private void ValidateConfiguration()
    {
        var missingKeys = new List<string>();
        if (string.IsNullOrWhiteSpace(supportOptions.ToAddress)) missingKeys.Add("SupportEmail:ToAddress");
        if (string.IsNullOrWhiteSpace(supportOptions.FromAddress)) missingKeys.Add("SupportEmail:FromAddress");
        if (string.IsNullOrWhiteSpace(smtpOptions.Host)) missingKeys.Add("Smtp:Host");
        if (smtpOptions.Port <= 0) missingKeys.Add("Smtp:Port");
        if (string.IsNullOrWhiteSpace(smtpOptions.Username)) missingKeys.Add("Smtp:Username");
        if (string.IsNullOrWhiteSpace(smtpOptions.Password)) missingKeys.Add("Smtp:Password");

        if (missingKeys.Count > 0)
        {
            throw new InvalidOperationException(
                $"Support email is not configured. Missing: {string.Join(", ", missingKeys)}.");
        }
    }

    private string BuildSubject(string subject)
    {
        var labelName = string.IsNullOrWhiteSpace(supportOptions.LabelName)
            ? DefaultLabelName
            : supportOptions.LabelName.Trim();
        var normalizedLabel = labelName.StartsWith("[", StringComparison.Ordinal)
            ? labelName
            : $"[{labelName}]";

        return $"{normalizedLabel} {subject.Trim()}";
    }

    private static string BuildBody(SupportEmailMessage message)
    {
        var builder = new StringBuilder();
        builder.AppendLine("Lumina support message");
        builder.AppendLine();
        builder.AppendLine($"Submitted name: {message.SubmittedName}");
        builder.AppendLine($"Submitted email: {message.SubmittedEmail}");
        builder.AppendLine($"Logged-in user email: {message.AuthenticatedUserEmail ?? "Unknown"}");
        builder.AppendLine($"Logged-in user id: {message.AuthenticatedUserId ?? "Unknown"}");
        builder.AppendLine($"Subject: {message.Subject}");
        builder.AppendLine($"Submitted timestamp: {message.SubmittedAt:O}");
        builder.AppendLine();
        builder.AppendLine("Message:");
        builder.AppendLine(message.Message);

        return builder.ToString();
    }
}

public sealed class SupportEmailOptions
{
    public string ToAddress { get; set; } = string.Empty;
    public string FromAddress { get; set; } = string.Empty;
    public string LabelName { get; set; } = "Lumina Support";
}

public sealed class SmtpOptions
{
    public string Host { get; set; } = string.Empty;
    public int Port { get; set; } = 587;
    public string Username { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public bool UseSsl { get; set; } = true;
}

public sealed record SupportEmailMessage(
    string SubmittedName,
    string SubmittedEmail,
    string Subject,
    string Message,
    string? AuthenticatedUserId,
    string? AuthenticatedUserEmail,
    DateTimeOffset SubmittedAt);
