# Playwright Validation Workflow

Use this workflow for Lumina feature work when the request should be implemented and browser-validated end to end.

## Modes

### 1. Normal Local Dev
- Default mode for day-to-day development.
- Uses the app's normal local database from `src/Lumina.Api/appsettings.Development.json`.
- Current default local DB:
  - `Data Source=../../.dotnet/lumina.db`
- Recommended for manual development and debugging.

### 2. Isolated Playwright Validation
- Explicit opt-in mode for automated browser validation.
- Uses a separate temporary database so Playwright runs do not mutate your normal local data.
- Recommended for repeatable validation runs.
- Name this mode explicitly when using it: `isolated Playwright validation`.

## Recommendation
- Keep normal development on the normal local database.
- Use isolated Playwright validation when running automated browser flows.
- Do not silently switch the app into the isolated DB during normal development.

## Default Pattern
- Make the requested code change.
- Use normal local dev mode unless the task is specifically running Playwright validation.
- For Playwright validation, prefer isolated Playwright validation.
- Run the relevant Playwright flow.
- If the flow fails, inspect the browser result or server error, fix the issue, and rerun.
- Repeat until the flow passes.
- Report:
  - files changed
  - commands run
  - Playwright pass/fail status
  - assumptions made

## Validation Targets
- Client base URL should point at the running local frontend.
- Seeded dev login:
  - Email: `dev@lumina.local`
  - Password: `Dev!23456`

## Current Reusable Flow
- Specs:
  - `tests/lumina-login.spec.ts`
  - `tests/lumina-client.spec.ts`
  - `tests/lumina-package.spec.ts`
  - `tests/lumina-session.spec.ts`
- Covers:
  - log in
  - create and edit a client
  - create a package
  - schedule 4 sessions from a package
  - edit the second session time
  - verify the updated time in the UI

## Suggested Prompt
`Implement the change, use normal local dev mode by default, run isolated Playwright validation when browser testing is needed, fix any issues you find, rerun until it passes, and then report: changed files, commands run, pass/fail status, and assumptions.`
