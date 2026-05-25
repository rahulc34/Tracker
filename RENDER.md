# Deploy to Render (GitHub → auto-deploy)

This repo includes a **[`render.yaml`](./render.yaml)** Blueprint: **one** Web Service (`tracker`) that runs Next.js on the public port and Express on an internal port (`4001`). The browser calls `/api/...` on the same hostname; Next proxies those requests to the API.

Node **22**, Supabase for DB + Auth.

---

## One-time setup

### 1. Push to GitHub

```bash
git add .
git commit -m "Add Render blueprint"
git push origin main
```

Use your default branch name in `render.yaml` (`branch: main`) or change it if needed.

### 2. Create the Blueprint on Render

1. [dashboard.render.com](https://dashboard.render.com) → **New +** → **Blueprint**
2. Connect your **GitHub** account and select the **Tracker** repository
3. Render reads `render.yaml` and creates **tracker** (single Web Service)
4. When prompted, set **secret** environment variables (from `tracker-secrets` group):

| Variable | Where to get it |
|----------|-----------------|
| `DATABASE_URL` | Supabase → Database → Connect → **Transaction** pooler (`6543`, `?pgbouncer=true`) |
| `DIRECT_URL` | Supabase → **Session** pooler (`5432`, `*.pooler.supabase.com`) |
| `SUPABASE_URL` | Project Settings → API → Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Project Settings → API → **service_role** (server only) |
| `NEXT_PUBLIC_SUPABASE_URL` | Same Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Project Settings → API → **anon** key |

5. Click **Apply** and wait for the service to deploy.

**Migrating from two services (`tracker-api` + `tracker-web`):** delete the old services in the Render dashboard (or create a fresh Blueprint in a new Render project), then apply the new blueprint so only **tracker** remains.

### 3. Supabase Auth redirect URLs

In Supabase → **Authentication → URL configuration**, use your **tracker** service URL (Render → **tracker** → **Settings** → URL), for example:

- **Site URL:** `https://tracker-xxxx.onrender.com`
- **Redirect URLs:** `https://tracker-xxxx.onrender.com/auth/callback`

### 4. Verify

| URL | Expected |
|-----|----------|
| `https://YOUR-SERVICE.onrender.com/health` | `{"ok":true,...}` |
| `https://YOUR-SERVICE.onrender.com` | Login page → sign in → app |

---

## Auto-deploy on push

After the Blueprint exists, every push to **`main`** redeploys **tracker**.

Build/start flow:

- [`scripts/render-build.sh`](./scripts/render-build.sh) — install, Prisma generate, build API + Next (with API proxy rewrites)
- [`scripts/render-start.sh`](./scripts/render-start.sh) — migrate DB, start API on `4001`, start Next on Render `PORT`

---

## Split deploy (Docker / two URLs)

For VPS or Docker Compose with separate ports, do **not** set `TRACKER_PROXY_API`. Set `NEXT_PUBLIC_TRACKER_API_URL` and `CORS_ORIGINS` instead. See **[DEPLOY.md](./DEPLOY.md)**.

---

## Custom domain (optional)

1. Render → **tracker** → **Settings** → **Custom Domains**
2. Update Supabase **Site URL** and **Redirect URLs** to your domain
3. Redeploy (no separate API URL to configure)

---

## Node.js version

- Root [`.node-version`](./.node-version) → **22.14.0**
- `package.json` `engines`: `>=22.0.0 <23.0.0`
- `render.yaml` sets `NODE_VERSION=22.14.0`

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| API crashes: `Cannot find module .../dist/generated/prisma/client.js` | Ensure latest `backend/package.json` build copies Prisma to `dist/`; redeploy |
| API build fails on Prisma | Check `DATABASE_URL` / `DIRECT_URL`; use pooler hosts from Supabase |
| Web build missing env | Set all `NEXT_PUBLIC_*` Supabase vars before deploy |
| Login works locally, not on Render | Add production redirect URL in Supabase (same hostname as **tracker**) |
| “Signed in, but API sync failed” | Open `/health` on the same hostname; check deploy logs for API start on port `4001` |
| Free tier sleeps | First request after idle may be slow (~30s) |

---

## Docker (optional)

Render uses **native Node** builds from `render.yaml`. Dockerfiles (`backend/Dockerfile`, `frontend/Dockerfile`) remain for VPS / `docker compose`.
