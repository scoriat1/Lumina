# Navigation Audit (Basic Flow Wiring + Navigation QA)

Scope reviewed: `src/Lumina.Client/src/app/pages`, shared layout/navigation components, and high-visibility card/list action components used by routed pages.

## Route: `/` (Dashboard)

- [x] **Sidebar nav icons** (Dashboard/Clients/Calendar/Sessions/Billing/Resources/Notifications/Settings)
  - Expected: navigate to corresponding route.
  - Actual: `ListItemButton` uses `navigate(path)` for all nav items.
  - Status: **OK**.
  - Ref: `src/Lumina.Client/src/app/components/navigation/Sidebar.tsx` (main and bottom nav handlers).

- [x] **Top-bar notifications bell**
  - Expected: navigate to notifications page.
  - Actual: now wired with `onClick={() => navigate('/notifications')}`.
  - Status: **OK** (fixed).
  - Ref: `src/Lumina.Client/src/app/components/navigation/AppTopBar.tsx` (~L29-L33).

- [x] **Metric cards (Active Clients / Sessions This Month / Revenue / Calendar Filled)**
  - Expected: jump to relevant filtered page.
  - Actual: metric clicks navigate to `/clients`, `/sessions`, `/billing`, `/calendar` with query params.
  - Status: **OK**.
  - Ref: `src/Lumina.Client/src/app/pages/DashboardPage.tsx` (`metricLinks`).

- [x] **Upcoming Sessions card: `View All`, session rows**
  - Expected: open Sessions page or focused session.
  - Actual: `View All -> /sessions?range=upcoming`; row click -> `/sessions?focusSessionId=...`.
  - Status: **OK**.
  - Ref: `src/Lumina.Client/src/app/components/UpcomingSessions.tsx`.

- [x] **Upcoming Sessions row overflow icon**
  - Expected: open actions menu OR be explicitly TODO-disabled.
  - Actual: no-op previously; now disabled with inline TODO.
  - Status: **TODO** (fixed as explicitly disabled).
  - Ref: `src/Lumina.Client/src/app/components/UpcomingSessions.tsx` (~L175).

- [x] **Client Overview card: `View All`, client row click**
  - Expected: open clients list / client detail.
  - Actual: `View All -> /clients?status=active`; row click -> `/clients/:id`.
  - Status: **OK**.
  - Ref: `src/Lumina.Client/src/app/components/ClientOverview.tsx`.

- [x] **Client Overview row overflow icon**
  - Expected: open actions menu OR be explicitly TODO-disabled.
  - Actual: no-op previously; now disabled with inline TODO.
  - Status: **TODO** (fixed as explicitly disabled).
  - Ref: `src/Lumina.Client/src/app/components/ClientOverview.tsx` (~L131).

## Route: `/clients`

- [x] **Add Client**
  - Expected: open add-client modal.
  - Actual: opens `AddClientModal` via state.
  - Status: **OK**.
  - Ref: `src/Lumina.Client/src/app/pages/ClientsPage.tsx` (~Add Client button section).

- [x] **Clickable client rows**
  - Expected: navigate to client detail.
  - Actual: row click calls `navigate('/clients/:id')`.
  - Status: **OK**.
  - Ref: `src/Lumina.Client/src/app/pages/ClientsPage.tsx` (`handleRowClick`).

- [x] **Search clear / filter open / clear filters / drawer close / save actions**
  - Expected: update controls or close drawer.
  - Actual: all wired to local handlers.
  - Status: **OK**.
  - Ref: `src/Lumina.Client/src/app/pages/ClientsPage.tsx`.

## Route: `/clients/:id`

- [x] **Back to Clients**
  - Expected: return to `/clients`.
  - Actual: uses `navigate('/clients')`.
  - Status: **OK**.
  - Ref: `src/Lumina.Client/src/app/pages/ClientDetailPage.tsx` (~L172).

- [x] **New Session / Schedule Session / Open next step / engagement session rows**
  - Expected: open session modal or details drawer.
  - Actual: wired to modal state and drawer open handlers.
  - Status: **OK**.
  - Ref: `src/Lumina.Client/src/app/pages/ClientDetailPage.tsx` (~L189, L211-L214, L246).

- [x] **Contact Information edit icon**
  - Expected: edit contact flow OR explicit TODO-disabled.
  - Actual: previously no-op; now disabled with TODO comment.
  - Status: **TODO** (fixed as explicitly disabled).
  - Ref: `src/Lumina.Client/src/app/pages/ClientDetailPage.tsx` (~L268).

- [x] **Client Notes `Add Note`**
  - Expected: open note editor OR explicit TODO-disabled.
  - Actual: previously no-op; now disabled with TODO comment.
  - Status: **TODO** (fixed as explicitly disabled).
  - Ref: `src/Lumina.Client/src/app/pages/ClientDetailPage.tsx` (~L290).

## Route: `/calendar`

- [x] **Prev/Today/Next controls + calendar day/session/time-slot click targets + New Session**
  - Expected: navigate calendar ranges or open session-related flows.
  - Actual: wired to handlers (`handlePrevious`, `handleToday`, `handleNext`, `handleSessionClick`, etc.).
  - Status: **OK**.
  - Ref: `src/Lumina.Client/src/app/pages/CalendarPage.tsx` (calendar controls and click handlers).

## Route: `/sessions`

- [x] **New Session, filter menu/actions, session row click, empty-state CTA, Show All Upcoming**
  - Expected: open modal/drawer and update list states.
  - Actual: all visible CTAs are wired to handlers.
  - Status: **OK**.
  - Ref: `src/Lumina.Client/src/app/pages/SessionsPage.tsx`.

- [x] **Session card overflow icon (shared card component)**
  - Expected: open menu OR explicit TODO-disabled.
  - Actual: now disabled with TODO comment.
  - Status: **TODO** (fixed as explicitly disabled).
  - Ref: `src/Lumina.Client/src/app/components/sessions/SessionCard.tsx` (~L76).

## Route: `/billing`

- [x] **Invoice list rows**
  - Expected: open invoice details drawer.
  - Actual: row click opens drawer with selected invoice.
  - Status: **OK**.
  - Ref: `src/Lumina.Client/src/app/pages/BillingPage.tsx` (`handleInvoiceClick`).

- [x] **Create Invoice button**
  - Expected: open invoice creation flow OR explicit TODO-disabled.
  - Actual: previously no-op; now disabled with TODO comment.
  - Status: **TODO** (fixed as explicitly disabled).
  - Ref: `src/Lumina.Client/src/app/pages/BillingPage.tsx` (~L216-L220).

- [x] **Drawer Download and Mark as Paid**
  - Expected: trigger download/payment action OR explicit TODO-disabled.
  - Actual: previously no-op; now disabled with TODO comments.
  - Status: **TODO** (fixed as explicitly disabled).
  - Ref: `src/Lumina.Client/src/app/pages/BillingPage.tsx` (~L539-L566).

## Route: `/settings`

- [x] **Save/Cancel controls and toggles in editable sections**
  - Expected: mutate local form state and save/cancel.
  - Actual: wired through existing state handlers.
  - Status: **OK**.
  - Ref: `src/Lumina.Client/src/app/pages/SettingsPage.tsx` (dirty-state action bars).

- [x] **Upload Logo**
  - Expected: open uploader OR explicit TODO-disabled.
  - Actual: previously no-op; now disabled with TODO comment.
  - Status: **TODO** (fixed as explicitly disabled).
  - Ref: `src/Lumina.Client/src/app/pages/SettingsPage.tsx` (~L390-L394).

- [x] **Invite Provider**
  - Expected: open invite flow OR explicit TODO-disabled.
  - Actual: previously no-op; now disabled with TODO comment.
  - Status: **TODO** (fixed as explicitly disabled).
  - Ref: `src/Lumina.Client/src/app/pages/SettingsPage.tsx` (~L623-L627).

- [x] **Provider overflow icon**
  - Expected: actions menu OR explicit TODO-disabled.
  - Actual: previously no-op; now disabled with TODO comment.
  - Status: **TODO** (fixed as explicitly disabled).
  - Ref: `src/Lumina.Client/src/app/pages/SettingsPage.tsx` (~L723-L725).

- [x] **Create Package / package edit icon**
  - Expected: open package flows OR explicit TODO-disabled.
  - Actual: previously no-op; now disabled with TODO comments.
  - Status: **TODO** (fixed as explicitly disabled).
  - Ref: `src/Lumina.Client/src/app/pages/SettingsPage.tsx` (~L757-L761, ~L862-L866).

- [x] **Availability Remove / Add time slot**
  - Expected: mutate working-hours rows OR explicit TODO-disabled.
  - Actual: previously no-op; now disabled with TODO comments.
  - Status: **TODO** (fixed as explicitly disabled).
  - Ref: `src/Lumina.Client/src/app/pages/SettingsPage.tsx` (~L1138-L1142, ~L1157-L1161).

- [x] **Role edit icon**
  - Expected: open role editor OR explicit TODO-disabled.
  - Actual: previously no-op; now disabled with TODO comment.
  - Status: **TODO** (fixed as explicitly disabled).
  - Ref: `src/Lumina.Client/src/app/pages/SettingsPage.tsx` (~L1343-L1347).

## Route: `/notifications` and `/resources`

- [x] No visible CTA actions on these placeholder pages besides global navigation.
  - Expected: top-level navigation remains functional.
  - Actual: navigation is available through sidebar/top bar.
  - Status: **OK**.
  - Ref: `src/Lumina.Client/src/app/pages/NotificationsPage.tsx`, `src/Lumina.Client/src/app/pages/ResourcesPage.tsx`.

---

## Smoke Test (10–20 quick manual steps)

1. Open app at `/` and click each sidebar icon once; verify route changes and active state.
2. On Dashboard, click each metric card; confirm routes/filters update.
3. On Dashboard, click Upcoming Sessions `View All`; verify `/sessions?range=upcoming`.
4. On Dashboard, click an Upcoming Session row; verify session is focused in Sessions page.
5. On Dashboard, click Active Clients `View All`; verify `/clients?status=active`.
6. On Dashboard, click an Active Client row; verify `/clients/:id`.
7. On Client Detail, click `Back to Clients`.
8. On Client Detail, click `New Session`; modal opens; close modal.
9. On Client Detail, click engagement session row; details drawer opens; close drawer.
10. On Billing, click an invoice row; drawer opens; close drawer.
11. On Billing, verify `Create Invoice`, `Download`, and `Mark as Paid` are visibly disabled.
12. On Settings, verify `Upload Logo` and `Invite Provider` are disabled.
13. On Settings, verify provider overflow icons are disabled.
14. On Settings, verify `Create Package` and package edit icons are disabled.
15. On Settings (Availability section), verify `Remove` and `Add time slot` are disabled.
16. On Settings (Roles section), verify role edit icons are disabled.
17. From any page, click top-bar notifications bell; verify route goes to `/notifications`.
18. Open avatar menu in top bar and click `Logout`; verify redirect to `/login`.
