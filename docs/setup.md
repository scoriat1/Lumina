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

## Google OAuth Local Setup
- Do not commit real Google OAuth credentials. Set them with user secrets, environment variables, or an uncommitted local config override.
- Required API settings:
  - `Authentication__Google__ClientId`
  - `Authentication__Google__ClientSecret`
  - `Authentication__ClientAppUrl=http://localhost:5175`
- The client and API must share the same browser origin for the Identity cookie during local Google auth. Run the client on `http://localhost:5175` and start Google from the UI so the Vite proxy handles `/api/*` and `/signin-google`.
- Register this Google OAuth redirect URI for the default local dev setup:
  - `http://localhost:5175/signin-google`
- If you instead run the whole app from an HTTPS API origin without the Vite dev server in front, the redirect URI format is usually:
  - `https://localhost:{API_PORT}/signin-google`

## Reset Database
```bash
bash scripts/reset-db.sh
```
This drops/recreates the DB using the initial SQL migration script.
