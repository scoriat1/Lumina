# Navigation & CTA Map

## Primary routes
- `/` Dashboard
- `/clients` Clients list
- `/clients/:id` Client detail
- `/calendar` Calendar
- `/sessions` Sessions
- `/billing` Billing
- `/resources` Resources
- `/notifications` Notifications
- `/settings` Settings

## Primary clickable CTAs covered by smoke tests
- Sidebar icon rail: each icon navigates to the route above.
- Dashboard metric cards:
  - Active Clients -> `/clients?status=active`
  - Sessions This Month -> `/sessions?range=thisMonth`
  - Revenue (MTD) -> `/billing?range=thisMonth`
  - Calendar Filled -> `/calendar?range=thisMonth`
- Dashboard “View All” links:
  - Upcoming Sessions -> `/sessions?range=upcoming`
  - Active Clients -> `/clients?status=active`
- Clients list row -> `/clients/:id`
- Client detail:
  - New Session -> opens `NewSessionModal`
  - Session row -> opens `SessionDetailsDrawer`
- Billing invoice row -> opens invoice detail drawer.

## Intentional TODO/disabled CTAs
These remain intentionally disabled and include `TODO(nav)` comments in code until their flows exist:
- Settings: Upload Logo, Invite Provider, Create Package, Add time slot, role edit action.
- Additional TODO-disabled actions also exist in Billing and Client Detail and are explicitly marked in source.
