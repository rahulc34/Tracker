# Supabase setup (Pulse Tracker)

Pulse Tracker uses **Supabase PostgreSQL** and **Supabase Auth** (Google + email/password). The Express API verifies JWTs and links each login to a `tracker_users` row.

---

## 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and create a project.
2. Wait until the database is ready.

---

## 2. Copy connection strings

In the Supabase dashboard: **Project Settings → Database → Connection string → URI**

You need **two** URLs:

| Variable | Supabase mode | Port | Used for |
|----------|---------------|------|----------|
| `DATABASE_URL` | **Transaction** pooler | `6543` | Running API (`prisma` queries) |
| `DIRECT_URL` | **Session** pooler or **Direct** | `5432` | `prisma migrate`, `prisma studio`, seed |

For `DATABASE_URL`, append `?pgbouncer=true` if it is not already in the string.

**Example** (replace placeholders):

```env
DATABASE_URL=postgresql://postgres.abcdefghijklmnop:[YOUR-PASSWORD]@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres.abcdefghijklmnop:[YOUR-PASSWORD]@aws-0-ap-south-1.pooler.supabase.com:5432/postgres
```

URL-encode special characters in the password (`@` → `%40`, `#` → `%23`).

---

## 3. Enable Auth providers

In Supabase: **Authentication → Providers**

If you see `Unsupported provider: provider is not enabled`, the provider below is still **off** in the dashboard.

1. **Email** — open **Email**, turn **Enable Email provider** **ON**, then **Save**.
   - For local dev you can disable **Confirm email** under Email settings so sign-up works without inbox verification.
   - The app uses **email + password** (`signInWithPassword` / `signUp`), not magic link.
2. **Google** — open **Google**, turn it **ON**, add OAuth client ID/secret from [Google Cloud Console](https://console.cloud.google.com/), then **Save**.

**Authentication → URL configuration** — add redirect URLs:

- `http://localhost:3001/auth/callback`
- Your production URL, e.g. `https://pulse.example.com/auth/callback`

**Site URL:** `http://localhost:3001` (or your production web URL).

---

## 4. Configure environment

**Backend** (`backend/.env`):

```bash
cp backend/.env.example backend/.env
```

- `DATABASE_URL` / `DIRECT_URL` — from step 2  
- `SUPABASE_URL` — Project Settings → API → Project URL  
- `SUPABASE_SERVICE_ROLE_KEY` — Project Settings → API → `service_role` (server only)

**Frontend** (`frontend/.env.local`):

```bash
cp frontend/.env.example frontend/.env.local
```

- `NEXT_PUBLIC_SUPABASE_URL` — same Project URL  
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Project Settings → API → `anon` public key  
- `NEXT_PUBLIC_TRACKER_API_URL` — `http://localhost:4001`

---

## 5. Run migrations and seed

From the **Tracker** root:

```bash
npm install
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed    # optional demo user
```

If migrate fails with pooler errors, confirm `DIRECT_URL` uses port **5432** (session/direct), not the transaction pooler.

---

## 6. Start the app

```bash
npm run dev:backend    # API :4001
npm run dev:frontend   # Web :3001
```

Open http://localhost:3001

---

## Production (API on Railway / Render + Supabase)

Set on the API host:

- `DATABASE_URL` — transaction pooler (`6543`, `?pgbouncer=true`)
- `DIRECT_URL` — session/direct (`5432`)
- `CORS_ORIGINS` — your frontend URL
- `NODE_ENV=production`

Build/start (same as before):

```bash
npx prisma migrate deploy
node dist/index.js
```

---

## Docker Compose + Supabase

Put Supabase URLs in `.env` (from `.env.production.example`), then start **only** API and web (no local Postgres):

```bash
cp .env.production.example .env
# edit DATABASE_URL, DIRECT_URL, CORS_ORIGINS, NEXT_PUBLIC_TRACKER_API_URL

docker compose --env-file .env up -d --build api web
```

For a **local** Postgres container instead, use the `local-db` profile:

```bash
docker compose --env-file .env --profile local-db up -d --build
```

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `prepared statement` / pooler errors | Use transaction URL for `DATABASE_URL` with `?pgbouncer=true`; use `DIRECT_URL` on port 5432 for migrations |
| `Can't reach database` | Check password encoding and that your IP is allowed (Supabase → Database → Network) |
| Migrations hang | Run migrate with `DIRECT_URL` set; do not use port 6543 for migrate |
| `P1001: Can't reach database server` | Project paused, wrong host, or port 5432 blocked — see below |

### Fix `P1001: Can't reach database server`

1. **Resume the project** — Supabase Dashboard → project → if it says **Paused**, click **Restore**.
2. **Copy fresh URLs** — **Project Settings → Database → Connect** (or **Connection string**):
   - **Transaction pooler** (`6543`) → `DATABASE_URL` (add `?pgbouncer=true`)
   - **Session pooler** (`5432` on `*.pooler.supabase.com`) → `DIRECT_URL` for migrations
3. **Use the pooler host**, not only `db.xxx.supabase.co`, if direct connections fail (common on company networks).
4. **Username** must be `postgres.YOUR_PROJECT_REF`, not just `postgres`, for pooler strings.
5. **Password** — URL-encode `@` → `%40`, `#` → `%23` in `backend/.env`.
6. From **Tracker** root: `npm run prisma:migrate` (ensure `backend/.env` has both URLs).

---

## Notes

- First sign-in creates your Tracker profile via `POST /api/auth/session`.
- Each user only sees their own years, skills, and bookmarks (API checks ownership).
- Do **not** commit `.env` files or expose `SUPABASE_SERVICE_ROLE_KEY` to the browser.
- **Local dev without login:** set `AUTH_DISABLED=true` in `backend/.env` and leave Supabase URL keys unset on the frontend (middleware skips redirect).
