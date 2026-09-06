# DeviceCare Backend

Tested end-to-end against a real PostgreSQL database: company creation,
machine registration, an agent submitting a report in the exact shape
DeviceCare.ps1 sends, and the dashboard-facing endpoint reading it back
correctly (including the `warning` status derived from a DISM error). Not a
mockup — this works today, running locally against Postgres.

**What's left before it's live on the internet is entirely account creation
on a hosting platform — something only you can do, since it needs your own
sign-up and billing details.** Everything on this repo's side is ready to
deploy in about 10 minutes once you have those accounts. Steps below.

## Deploy to Render (recommended — free tier, ~10 minutes)

1. Push this folder to a GitHub repo (Render deploys from a repo).
2. Go to [render.com](https://render.com) → sign up (no credit card needed
   for the free tier) → **New → Blueprint** → connect your repo.
3. Render reads `render.yaml` in this folder automatically. It will create:
   - A free Postgres database (`devicecare-db`)
   - A free web service (`devicecare-backend`) wired to that database's
     `DATABASE_URL` automatically, with a random `ADMIN_KEY` generated for
     you
4. Click **Apply**. In a few minutes you'll have a public HTTPS URL like
   `https://devicecare-backend.onrender.com`.
5. Find your generated `ADMIN_KEY` under the service's **Environment** tab
   in the Render dashboard — you'll need it for every admin API call.

**Free tier note:** Render's free web services spin down after 15 minutes
of inactivity and take ~30s to wake up on the next request. Fine for
testing; upgrade to a paid instance (~$7/mo) once real client machines
depend on it responding promptly.

## Alternative: Railway, Fly.io, or your own VPS

Any host that can run a Docker container and give you a `DATABASE_URL` env
var works — the `Dockerfile` here is standard, nothing Render-specific in
the app code itself. If you'd rather use a separate managed Postgres (e.g.
[neon.tech](https://neon.tech), also free, no card required), just point
`DATABASE_URL` at that instead of a platform's built-in database.

## Local development

```bash
cp .env.example .env.local
# edit .env.local with your local Postgres connection string
set -a; source .env.local; set +a
npm install
node server.js
```

`GET /health` should return `{"ok":true}`.

## API summary

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/api/v1/admin/companies` | `X-Admin-Key` | create a client company |
| GET | `/api/v1/admin/companies` | `X-Admin-Key` | list companies |
| POST | `/api/v1/admin/companies/:id/machines` | `X-Admin-Key` | register a machine, returns its API key |
| GET | `/api/v1/admin/companies/:id/machines` | `X-Admin-Key` | machines + latest report — what the dashboard binds to |
| GET | `/api/v1/admin/machines/:id/reports` | `X-Admin-Key` | full report history for one machine |
| POST | `/api/v1/reports` | `X-Api-Key` (per machine) | agent submits a report |

## Activating a machine once deployed

```powershell
.\Register-Machine.ps1 -ApiUrl "https://devicecare-backend.onrender.com" `
    -AdminKey "<your ADMIN_KEY from Render>" -CompanyId "<company id>" -ScriptFolder "F:\Company"
```

Writes `agent-config.json` next to DeviceCare.ps1. Every run from then on
POSTs its report to the live backend automatically.

## Still placeholder — real limitations, not yet solved

- **Admin auth is one shared static key**, not per-user login. Fine for you
  operating the console yourself; not fine for a self-service portal where
  clients log in to see their own data. Real auth (e.g. sessions + a users
  table) is the next thing to build once this hosting step is done.
- **No rate limiting.**
- **No automated backups configured** — Render's free Postgres has none;
  set up scheduled backups before this holds real customer data.
