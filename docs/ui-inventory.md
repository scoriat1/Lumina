# UI Inventory

## Core Pages
- Dashboard: metrics, upcoming sessions, active clients preview.
- Clients: searchable/filterable client list and detail navigation.
- Client Detail: engagement timeline, session notes, contact info editor.
- Sessions: list/detail/edit of sessions.
- Calendar: monthly/weekly/day session scheduling surface.
- Billing/Settings/Resources/Notifications: currently present in UI and partially static.

## Inferred Data Needs
- Authenticated coach user profile.
- Clients with status/program/contact/progress.
- Sessions linked to client with status/location/payment metadata.
- Dashboard aggregates from clients and sessions.

## Uncertainty / TODO
- TODO: Billing and settings include richer domain structures (invoices/packages/providers) that are currently still static and need product confirmation before strict API shape is finalized.
- TODO: Client detail page currently uses complex engagement groupings; existing backend provides flattened session/client records and should be expanded once engagement rules are confirmed.
