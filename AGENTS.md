# AGENTS.md

For changes affecting login, clients, packages, scheduling, session editing, or related UI/API behavior, done means implementation plus Playwright validation.

Modes:
- Normal local dev: use the normal local database and startup path by default.
- Isolated Playwright validation: use a separate test database only when explicitly running browser validation.

Do not silently switch normal development to a Playwright-only database.

Run the relevant Playwright test(s) based on the area of change.

If unsure, run the full suite:
npx.cmd playwright test --project=chromium

If any test fails, fix the issue and rerun until passing.

Final report must include:
- files changed
- commands run
- pass/fail status
- assumptions or blockers
