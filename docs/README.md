# Lumina Setup

## Backend (API)
- Connection string key: `ConnectionStrings:Lumina`
- Local SQL Server database name: `Lumina`
- Run API:
  - `dotnet run --project src/Lumina.Api`

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
