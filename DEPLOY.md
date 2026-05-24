# Pulse Tracker — Deployment Guide

Pulse is a **Next.js frontend** + **Express/Prisma API** + **PostgreSQL** app.

---

## Prerequisites

- **Node.js 20+** and **npm 10+** (manual deploy)
- **Docker** + **Docker Compose** (recommended)
- A **PostgreSQL 16** database (included in Docker Compose)

---

## Option A — Docker Compose (recommended)

Best for a VPS, home server, or any machine with Docker.

### 1. Configure environment

```bash
cp .env.production.example .env
```

Edit `.env` — replace placeholders with your **public** URLs (what the browser uses):

```env
POSTGRES_PASSWORD=your-strong-password

# Example: VPS at 203.0.113.10
NEXT_PUBLIC_TRACKER_API_URL=http://203.0.113.10:4001
CORS_ORIGINS=http://203.0.113.10:3001

# Example: custom domain
# NEXT_PUBLIC_TRACKER_API_URL=https://api.pulse.example.com
# CORS_ORIGINS=https://pulse.example.com
```

> **Important:** `NEXT_PUBLIC_TRACKER_API_URL` is baked into the frontend at **build time**. If you change it, rebuild the `web` container.

### 2. Build and start

From the **Tracker** directory:

```bash
npm run docker:up
```

Or directly:

```bash
docker compose --env-file .env up -d --build
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

### 1. Database

Create a PostgreSQL database named `tracker` and note the connection string.

### 2. Backend

```bash
cd backend
cp .env.example .env
# Set DATABASE_URL, PORT=4001, CORS_ORIGINS=https://your-frontend-domain
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

## Option C — Split cloud deploy

| Service | Suggested host | Notes |
|---------|----------------|-------|
| Frontend | **Vercel**, Netlify, Railway | Set `NEXT_PUBLIC_TRACKER_API_URL` in project env |
| API | **Railway**, Render, Fly.io | Set `DATABASE_URL`, `CORS_ORIGINS`, `NODE_ENV=production` |
| Database | **Neon**, Supabase, Railway Postgres | Use connection string in API |

### Vercel (frontend)

1. Import repo; set **Root Directory** to `frontend`
2. Environment variables:
   - `NEXT_PUBLIC_TRACKER_API_URL` = `https://your-api.example.com`
   - `NEXT_PUBLIC_DEFAULT_USER_ID` = your user UUID
3. Deploy

### Railway / Render (API)

1. Root / working directory: `backend`
2. Build: `npm ci && npx prisma generate && npm run build`
3. Start: `npx prisma migrate deploy && node dist/index.js`
4. Environment:
   - `DATABASE_URL`
   - `CORS_ORIGINS` = your Vercel URL (e.g. `https://pulse.vercel.app`)
   - `NODE_ENV` = `production`
   - `PORT` = provided by platform

---

## Production checklist

- [ ] Set a strong `POSTGRES_PASSWORD` (Docker) or use managed Postgres
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
| DB connection errors | Verify `DATABASE_URL`; for Docker, wait for `db` healthcheck |
| Migrations failed | Run `npx prisma migrate deploy` manually inside the API container |

---

## Architecture

```
Browser  →  :3001  Next.js (frontend)
         →  :4001  Express API (backend)
                    ↓
                 PostgreSQL
```
