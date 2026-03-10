# Lumina Wiring Audit (frontend + backend)

## Scope audited
- Frontend pages/routes/components tied to: Dashboard, Clients list/detail, Sessions, Session create/edit, notes/templates, Billing, Settings.
- Frontend API layer and context wiring.
- Backend API endpoints (minimal API), EF entities/configuration/migrations, seed data.

## Current wiring snapshot

| Feature/Page | UI status | API status | Database status | What still needs wiring | Risk level |
|---|---|---|---|---|---|
| Dashboard | **Mostly wired** | **Wired** (`GET /api/dashboard`) | **Wired** (reads Clients/Sessions/Invoices) | Trend values and calendar fill are static placeholders (`+0%`, fixed `calendarFilledPercent` from API); no loading/error UI state. | Low |
| Clients list (`/clients`) | **Mostly wired** | **Wired** (`GET /api/clients`, `POST /api/clients`) | **Wired** (Client model + migration) | Add-client flow currently sends empty `program`; drawer tabs still include placeholder content (“Session details coming soon”, notes textarea not persisted). | Medium |
| Client detail (`/clients/:id`) | **Mostly wired** | **Wired** (`GET /api/clients/{id}`, `GET /api/clients/{id}/sessions`) | **Wired** (Client + Session) | Contact edit and add-note actions are explicitly TODO/disabled; engagement grouping relies on optional package fields not currently returned by API. | Medium |
| Sessions page (`/sessions`) | **Mostly wired** | **Wired** (`GET /api/sessions`, `PUT /api/sessions/{id}`) | **Wired** (Session model) | Filters/UI include payment/package concepts that are placeholder values from API; optimistic updates have no surfaced failure state. | Medium |
| Session creation flow (`NewSessionModal`) | **Partially wired** | **Wired** (`POST /api/sessions`) | **Wired** (Session insert) | Location/method, billing source, recurrence, and package/billing-plan logic are UI-only (not persisted by endpoint payload). | Medium |
| Session edit/notes flow (`SessionDetailsDrawer`) | **Partially wired** | **Partially wired** (`GET /api/sessions/{id}`, `PUT /api/sessions/{id}` notes/date/type/focus only) | **Partially wired** (writes notes to `Session.Notes`; `SessionNote` table unused) | Template mode selection does not enforce/render structured fields in note editor; no create/read path for `SessionNote` entity. | Medium |
| Notes/template settings (`Settings -> Notes`) | **Mostly wired** | **Partially wired** (`GET /api/templates/presets`, `GET /api/templates/custom`, `POST /api/templates/from-preset`, `PUT /api/templates/{id}`) | **Wired** (`Template*` tables + seed presets) | “Delete custom template” is UI-only (local state removal, no API delete endpoint). | Medium |
| Billing page (`/billing`) | **Mostly wired** | **Wired read-only** (`GET /api/billing/summary`, `GET /api/billing/invoices`) | **Wired** (Invoice model + seeded rows) | Create invoice action is disabled/TODO; no mutation endpoints. | Low |
| Settings page (non-notes tabs) | **Partially wired** | **Partially wired** (`GET /api/settings/providers` only) | **Partially wired** (Provider model exists; practice/package config models only partly represented) | Practice/billing/availability/notifications save/cancel are shell handlers (console only); packages and roles are mock constants. | Medium |

## What is already real vs mock

### Already wired to real API + DB
- Auth/session context: login/logout/me endpoints used from `AuthContext`.
- Dashboard, clients, sessions, billing reads are all fetched via `apiClient` and corresponding backend endpoints.
- Client create and session create/update operations submit to backend endpoints.
- Template preset/custom retrieval + duplicate-from-preset + template update are connected end-to-end.
- EF Core data model + initial migration include core entities used above, with development seed data for user/provider/clients/sessions/invoices/template presets.

### Still mock / placeholder / UI-shell
- Settings tabs (except providers + notes templates) are mostly local state only.
- Settings packages and roles use hardcoded mock arrays.
- Notes template delete is local-only (no backend delete endpoint).
- Session note "template mode" UX is not functionally applied to persisted note structure.
- Several billing/payment/package fields in session DTOs are hardcoded placeholder values from backend responses.

## Backend inventory

### API surface currently implemented (minimal API in `Program.cs`)
- Auth: `/api/auth/login`, `/api/auth/logout`, Google login/callback, `/api/auth/me`
- Clients: list/get/create/update + client sessions
- Sessions: list/get/create/update
- Billing: summary + invoices (read-only)
- Settings: providers (read-only)
- Templates: presets, custom, duplicate from preset, update
- Dashboard: aggregate metrics + previews

### Service/controller structure
- No separate MVC controllers/services yet; endpoint + query logic is currently centralized in `Program.cs` minimal API handlers.

### EF/data layer
- `LuminaDbContext` includes Practice/Provider/Client/Session/Invoice/Template/SessionNote/Package/ClientPackage sets.
- Initial migration exists and maps these models.
- Dev seeding creates one user/provider/practice and starter clients/sessions/invoices/template presets.

## Duplicate/dead/parallel code paths observed
- Parallel dashboard implementation exists at `src/app/pages/Dashboard/DashboardPage.tsx` with mock data, while routes point to `src/app/pages/DashboardPage.tsx`.
- Legacy/parallel component files exist alongside navigation/layout-specific versions (e.g., duplicate `AppTopBar`, `Sidebar`, `PageHeader`, `MetricCard` paths), indicating partially consolidated architecture.
- Unused standalone mock data files exist under `src/app/data/` while active pages fetch from API.

## Safest next feature batch (minimal refactor, highest completion value)

1. **Template/session note completion batch**
   - Add backend delete endpoint for custom templates and wire Notes settings delete action.
   - Wire template-mode note entry so selected template fields map to saved session note structure (can still serialize to `Session.Notes` initially to avoid broad schema change).
   - Add lightweight UX error handling for note/template mutations.

2. **Settings persistence batch (target only existing models/endpoints)**
   - Keep current UI; add focused endpoints + client calls for the already-rendered settings fields that map cleanly to existing models (practice profile + basic billing toggles).
   - Preserve current nav/layout/components and avoid new architecture.

3. **Session payload normalization batch**
   - Replace hardcoded API placeholders (`payment`, `paymentStatus`, `billingSource`) with real backend fields once model support is finalized.
   - Keep existing page composition/filters; only backfill data fidelity.

These batches avoid redesign and prioritize finishing existing flows that are already close to complete.
