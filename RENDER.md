# Deploy to Render (GitHub → auto-deploy)

This repo includes a **[`render.yaml`](./render.yaml)** Blueprint: two Web Services from one monorepo (API + Next.js), Node **22**, Supabase for DB + Auth.

---

## One-time setup

### 1. Push to GitHub

```bash
git add .
git commit -m "Add Render blueprint"
git push origin main
```

Use your default branch name in `render.yaml` (`branch: main`) or change it to `master` if needed.

### 2. Create the Blueprint on Render

1. [dashboard.render.com](https://dashboard.render.com) → **New +** → **Blueprint**
2. Connect your **GitHub** account and select the **Tracker** repository
3. Render reads `render.yaml` and creates:
   - **tracker-api** — Express + Prisma
   - **tracker-web** — Next.js
4. When prompted, set **secret** environment variables (from `tracker-secrets` group):

| Variable | Where to get it |
|----------|-----------------|
| `DATABASE_URL` | Supabase → Database → Connect → **Transaction** pooler (`6543`, `?pgbouncer=true`) |
| `DIRECT_URL` | Supabase → **Session** pooler (`5432`, `*.pooler.supabase.com`) |
| `SUPABASE_URL` | Project Settings → API → Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Project Settings → API → **service_role** (server only) |
| `NEXT_PUBLIC_SUPABASE_URL` | Same Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Project Settings → API → **anon** key |

5. Click **Apply** and wait for both services to deploy.

### 3. Supabase Auth redirect URLs

In Supabase → **Authentication → URL configuration**, add:

- **Site URL:** `https://tracker-web.onrender.com`
- **Redirect URLs:** `https://tracker-web.onrender.com/auth/callback`

(If you renamed services in `render.yaml`, use `https://YOUR-WEB-SERVICE-NAME.onrender.com` instead.)

### 4. Verify

| URL | Expected |
|-----|----------|
| `https://tracker-api.onrender.com/health` | `{"ok":true,...}` |
| `https://tracker-web.onrender.com` | Login page → sign in → app |

---

## Auto-deploy on push

After the Blueprint exists, every push to **`main`** (or your configured branch) triggers:

- **tracker-api** — if `backend/`, root `package.json`, or lockfile changed
- **tracker-web** — if `frontend/`, root `package.json`, or lockfile changed

(`buildFilter` in `render.yaml` limits unnecessary rebuilds.)

---

## Service URLs (default names)

| Service | URL |
|---------|-----|
| API | `https://tracker-api.onrender.com` |
| Web | `https://tracker-web.onrender.com` |

These are wired in `render.yaml` for `CORS_ORIGINS` and `NEXT_PUBLIC_TRACKER_API_URL`. If you **rename** services, update those two values in `render.yaml` and redeploy.

---

## Custom domain (optional)

1. Render → **tracker-web** → **Settings** → **Custom Domains**
2. Update `CORS_ORIGINS` on **tracker-api** to your domain
3. Update `NEXT_PUBLIC_TRACKER_API_URL` if the API also has a custom domain
4. **Redeploy tracker-web** (build-time env change)

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
| Web build missing env | Set all `NEXT_PUBLIC_*` vars before deploy; redeploy after changes |
| Login works locally, not on Render | Add production redirect URL in Supabase |
| CORS errors | `CORS_ORIGINS` must exactly match `https://tracker-web.onrender.com` |
| Free tier sleeps | First request after idle may be slow (~30s) |

---

## Docker (optional)

Render uses **native Node** builds from `render.yaml`. Dockerfiles (`backend/Dockerfile`, `frontend/Dockerfile`) remain for VPS / `docker compose`.
