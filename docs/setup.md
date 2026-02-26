# Setup

## Prerequisites
- .NET 8 SDK
- SQL Server Express running locally as `.\\SQLEXPRESS`
- Node.js 18+

## Run API
```bash
cd src/Lumina.Api
dotnet restore
dotnet run
```
API runs on `http://localhost:5000` and auto-applies migrations + dev seed on startup.

## Run Client
```bash
cd src/Lumina.Client
npm install
npm run dev
```
If needed, set `VITE_API_BASE_URL=http://localhost:5000`.

## Reset Database
```bash
bash scripts/reset-db.sh
```
This drops/recreates the DB using the initial SQL migration script.
