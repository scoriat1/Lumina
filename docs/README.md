# Lumina Setup

## Backend (API)
- Connection string key: `ConnectionStrings:Lumina`
- Local SQL Express target: `.\SQLEXPRESS`
- Local SQL Server database name: `Lumina`
- Run API:
  - `dotnet run --project src/Lumina.Api`
- Visual Studio:
  - Open `Lumina.sln`
  - Start `Lumina.Api` or the shared `Lumina Full Stack` launch profile
  - Starting the API also launches `npm run dev` from `src/Lumina.Client` through ASP.NET Core SPA proxy

## EF Core Migrations
- Create migration:
  - `dotnet ef migrations add InitialCreate -p src/Lumina.Infrastructure -s src/Lumina.Api`
- Apply migration:
  - `dotnet ef database update -p src/Lumina.Infrastructure -s src/Lumina.Api`

## Development Seeding
- Seed only runs in Development when `Seed:Enabled=true`.
- Dev credentials:
  - Email: `dev@lumina.local`
  - Password: `Dev!23456`

## Frontend (Client)
- Install dependencies:
  - `cd src/Lumina.Client && npm install`
- Run client:
  - `cd src/Lumina.Client && npm run dev`
- `Lumina.Client` is included in the solution as a lightweight wrapper project so Visual Studio can load it reliably without the JavaScript `.esproj` dependency.

## Validation
- Default developer mode uses the normal local database.
- Use the validation approach that fits the change instead of a required browser automation workflow.
