# Data Model

## Entities

### User
- Id (Guid)
- Name (string)
- Email (string)
- Relationships: one-to-many Clients.

### Client
- Id (Guid)
- UserId (Guid)
- Name, Email, Phone
- Program
- AvatarColor
- StartDate (DateOnly)
- Status (Active|Paused|Completed)
- Notes
- Relationships: one-to-many Sessions.

### Session
- Id (Guid)
- ClientId (Guid)
- Date (DateTimeOffset)
- Duration (minutes)
- Location (Zoom|Phone|Office)
- Status (Upcoming|Completed|Cancelled)
- SessionType
- Focus
- Payment, PaymentStatus, BillingSource, PackageRemaining
- Notes

## Notes
- Designed directly from UI mock usage in dashboard/clients/calendar/sessions pages.
- One dev user is seeded with one client + one upcoming session.
- TODO: add Billing/Invoice entities after UX contract for Billing page is finalized.
