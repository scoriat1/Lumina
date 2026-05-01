# Support Email Setup

Lumina sends marketing Contact and authenticated Help & Support form submissions through SMTP. For Gmail, use an App Password. Do not use your normal Gmail password.

## Gmail setup

1. In Gmail, create a label named `Lumina Support`.
2. Create a Gmail filter that matches subjects containing `[Lumina Support]`.
3. Configure the filter to apply the `Lumina Support` label.
4. Optional: choose "Skip the Inbox" if you want these messages archived into the label.
5. Enable 2-Step Verification on the Gmail account.
6. Create a Gmail App Password for Lumina.

## Local secrets

Store credentials with .NET user-secrets. Replace the placeholder values with your Gmail address and app password:

```powershell
dotnet user-secrets set "Smtp:Username" "<gmail-address>" --project src\Lumina.Api\Lumina.Api.csproj
dotnet user-secrets set "Smtp:Password" "<gmail-app-password>" --project src\Lumina.Api\Lumina.Api.csproj
dotnet user-secrets set "SupportEmail:ToAddress" "<support-gmail-address>" --project src\Lumina.Api\Lumina.Api.csproj
dotnet user-secrets set "SupportEmail:FromAddress" "<support-gmail-address>" --project src\Lumina.Api\Lumina.Api.csproj
```

The development defaults use:

```text
Smtp:Host=smtp.gmail.com
Smtp:Port=587
Smtp:UseSsl=true
SupportEmail:LabelName=Lumina Support
```

## Azure App Service

Set the same keys as App Service application settings:

```text
Smtp__Host
Smtp__Port
Smtp__Username
Smtp__Password
Smtp__UseSsl
SupportEmail__ToAddress
SupportEmail__FromAddress
SupportEmail__LabelName
```
