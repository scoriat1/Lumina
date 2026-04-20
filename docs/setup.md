# Setup

## Prerequisites
- .NET 8 SDK
- Node.js 18+

## Run API
```bash
cd src/Lumina.Api
dotnet restore
dotnet run
```
API runs on `http://localhost:5000` and auto-applies migrations + dev seed on startup.
In Visual Studio, open `Lumina.sln` and start `Lumina.Api` or the `Lumina Full Stack` launch profile.
The API project launches the frontend dev server from `src/Lumina.Client` through ASP.NET Core SPA proxy.
The default development database is SQLite at `.dotnet/lumina.db`.

## Run Client
```bash
cd src/Lumina.Client
npm install
npm run dev
```
If needed, set `VITE_API_BASE_URL=http://localhost:5000`.
The solution includes `Lumina.Client` through a lightweight wrapper project instead of the failing Visual Studio JavaScript project type.

## Reset Database
```bash
bash scripts/reset-db.sh
```
This drops/recreates the DB using the initial SQL migration script.
