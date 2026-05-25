# Pulse Tracker — Deployment Guide

Pulse is a **Next.js frontend** + **Express/Prisma API** + **PostgreSQL** app.

**Database:** [Supabase](https://supabase.com) is the recommended host. See **[SUPABASE.md](./SUPABASE.md)** for connection strings and migrations.

---

## Prerequisites

- **Node.js 20+** and **npm 10+** (manual deploy)
- **Docker** + **Docker Compose** (optional, for self-hosting API + web)
- A **PostgreSQL** database — **Supabase** (recommended) or local/Docker Postgres

---

## Option A — Docker Compose (recommended)

Best for a VPS, home server, or any machine with Docker.

### 1. Configure environment

```bash
cp .env.production.example .env
```

Edit `.env`:

1. **Supabase** — set `DATABASE_URL` (transaction pooler, port `6543`) and `DIRECT_URL` (session/direct, port `5432`). See [SUPABASE.md](./SUPABASE.md).
2. **Public URLs** — what the browser uses:

```env
# Example: VPS at 203.0.113.10
NEXT_PUBLIC_TRACKER_API_URL=http://203.0.113.10:4001
CORS_ORIGINS=http://203.0.113.10:3001

# Example: custom domain
# NEXT_PUBLIC_TRACKER_API_URL=https://api.pulse.example.com
# CORS_ORIGINS=https://pulse.example.com
```

> **Important:** `NEXT_PUBLIC_TRACKER_API_URL` is baked into the frontend at **build time**. If you change it, rebuild the `web` container.

### 2. Build and start

From the **Tracker** directory (Supabase — no local Postgres container):

```bash
docker compose --env-file .env up -d --build api web
```

With **local** Postgres instead:

```bash
docker compose --env-file .env --profile local-db up -d --build
```

### 3. Open the app

- **Web UI:** `http://YOUR_SERVER:3001`
- **API health:** `http://YOUR_SERVER:4001/health`

### 4. Seed demo data (optional)

```bash
docker compose --env-file .env exec api npx prisma db seed
```

### 5. Useful commands

```bash
npm run docker:logs    # follow logs
npm run docker:down    # stop stack

# Run migrations manually after pulling new code
docker compose --env-file .env exec api npx prisma migrate deploy
```

---

## Option B — Manual deploy (VPS without Docker)

### 1. Database (Supabase)

1. Create a project at [supabase.com](https://supabase.com).
2. Copy **transaction** and **session/direct** connection strings into `backend/.env` as `DATABASE_URL` and `DIRECT_URL` ([SUPABASE.md](./SUPABASE.md)).

### 2. Backend

```bash
cd backend
cp .env.example .env
# Set DATABASE_URL, DIRECT_URL, PORT=4001, CORS_ORIGINS=https://your-frontend-domain
npm ci
npx prisma migrate deploy
npm run build
npm run start:prod
```

Use **pm2** or **systemd** to keep the API running:

```bash
pm2 start dist/index.js --name pulse-api
```

### 3. Frontend

```bash
cd frontend
cp .env.example .env.local
# NEXT_PUBLIC_TRACKER_API_URL=https://api.your-domain.com
npm ci
npm run build
npm run start   # listens on :3001
```

Use pm2:

```bash
pm2 start npm --name pulse-web -- start
```

---

## Option C — Render (recommended for GitHub auto-deploy)

**Full guide:** **[RENDER.md](./RENDER.md)**

1. Push repo to GitHub (`main` branch).
2. Render Dashboard → **New** → **Blueprint** → connect repo.
3. Set secret env vars when prompted (Supabase URLs + keys).
4. Every push to `main` redeploys **tracker-api** and **tracker-web**.

Default URLs:

- API: `https://tracker-api.onrender.com`
- Web: `https://tracker-web.onrender.com`

Configured in [`render.yaml`](./render.yaml) (Node 22, monorepo workspaces).

---

## Option D — Other split cloud deploy

| Service | Suggested host | Notes |
|---------|----------------|-------|
| Frontend | **Vercel**, Netlify | Set `NEXT_PUBLIC_*` + Supabase keys |
| API | **Railway**, Fly.io | `DATABASE_URL`, `DIRECT_URL`, `SUPABASE_*`, `CORS_ORIGINS` |
| Database | **Supabase** | Pooler URLs on API |

---

## Production checklist

- [ ] Configure Supabase `DATABASE_URL` + `DIRECT_URL` (or strong `POSTGRES_PASSWORD` for local Docker)
- [ ] Set `CORS_ORIGINS` to your **exact** frontend URL(s), comma-separated
- [ ] Set `NEXT_PUBLIC_TRACKER_API_URL` to your **public** API URL
- [ ] Use **HTTPS** in production (Caddy, Nginx, or Cloudflare in front)
- [ ] Do **not** commit `.env` files with secrets
- [ ] Run `prisma migrate deploy` on every release before starting the API
- [ ] Optional: run `prisma db seed` once for initial demo user

---

## HTTPS with a reverse proxy (example)

Point Nginx/Caddy at:

- `pulse.example.com` → `localhost:3001` (web)
- `api.pulse.example.com` → `localhost:4001` (api)

Then set:

```env
NEXT_PUBLIC_TRACKER_API_URL=https://api.pulse.example.com
CORS_ORIGINS=https://pulse.example.com
```

Rebuild/redeploy the frontend after changing `NEXT_PUBLIC_*` variables.

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| “Could not load data” on phone/LAN | `CORS_ORIGINS` must include the exact frontend origin; API must be reachable on the public URL |
| Frontend loads but API fails | Check `NEXT_PUBLIC_TRACKER_API_URL` matches where the browser can reach the API |
| DB connection errors | Verify Supabase `DATABASE_URL` / `DIRECT_URL`; URL-encode password; check Supabase network allowlist |
| Migrations failed | Run `npx prisma migrate deploy` manually inside the API container |

---

## Architecture

```
Browser  →  :3001  Next.js (frontend)
         →  :4001  Express API (backend)
                    ↓
              Supabase PostgreSQL
```
