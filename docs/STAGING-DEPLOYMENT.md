# Staging deployment — E.H. Arogya Sutra

Hybrid setup: **Frontend + API on cloud**, **Ollama on your PC**, **separate mock database**.

## Architecture

| Layer | Staging | Production |
|-------|---------|------------|
| URL | `staging.arogyasutra.com` | `app.arogyasutra.com` (your prod domain) |
| Frontend | Vercel — branch `staging` | Vercel — branch `main` |
| API | Railway — service `eh-api-staging` | Railway — service `eh-api-prod` |
| Database | Supabase/Railway **staging** Postgres | Production Postgres only |
| Ollama | **Your PC** (`ollama serve`) via tunnel | Same hybrid or cloud later |
| Expert Python | Optional local `:8001` or staging Railway | Production choice |

## 1. Git branches & approval workflow

```text
feature/*  →  staging  →  (your test on staging URL)  →  main  →  production
```

- Push formula / summary / clinical logic changes to **`staging`** first.
- Test on `https://staging.arogyasutra.com`.
- After approval, merge `staging` → `main` (production deploy).

**GitHub:** Settings → Branches → protect `main` (require PR, no direct push).

## 2. Vercel (frontend)

1. Import repo → Project → **Production Branch:** `main`
2. Add **Preview** or second project linked to branch **`staging`**
3. Domain: `staging.arogyasutra.com` → staging deployment
4. Environment variables (Staging):

```env
VITE_APP_ENV=staging
VITE_API_BASE=https://YOUR-RAILWAY-STAGING-API.up.railway.app
VITE_API_EXPERT_CLINICAL_TIMEOUT_MS=600000
VITE_API_PROXY_TIMEOUT_MS=780000
```

5. Enable **Automatic deployments** for branch `staging`.

## 3. Railway (backend API)

1. New service from repo, branch **`staging`**
2. Root: repo root, start: `npm start`
3. Variables — copy from `.env.staging.example`
4. **Separate** `DATABASE_URL` (staging Supabase project)

## 4. Mock database (staging only)

```bash
# On staging DB (never production URL)
APP_ENV=staging DATABASE_URL=postgresql://...staging... npm run db:schema
APP_ENV=staging DATABASE_URL=postgresql://...staging... npm run seed:postgres
APP_ENV=staging DATABASE_URL=postgresql://...staging... npm run seed:staging
```

Login: `9876543210` / `demo123` (or `STAGING_DOCTOR_*` in env).

## 5. Hybrid Ollama (PC → staging API)

On your **Windows PC** (same machine as `ollama serve`):

```powershell
ollama serve
# In another terminal — expose port 11434 (pick one):
ngrok http 11434
# OR Tailscale funnel / MagicDNS to this machine
```

Railway staging env:

```env
APP_ENV=staging
EH_STAGING_HYBRID_OLLAMA=1
OLLAMA_URL=https://YOUR-SUBDOMAIN.ngrok-free.app
EH_SUMMARY_LOCAL_ONLY=0
EH_SUMMARY_DENSE_MODE=1
EH_SUMMARY_TARGET_WORDS=400
OLLAMA_EXPERT_CLINICAL_TIMEOUT_MS=600000
```

**Security:** tunnel URL is secret; rotate ngrok URL when it changes. Only staging API should use it.

Local dev (no tunnel):

```env
OLLAMA_URL=http://127.0.0.1:11434
```

## 6. High-density summary (faster, fewer 502s)

Default **~400 words**, 7 sections:

```env
EH_SUMMARY_DENSE_MODE=1
EH_SUMMARY_TARGET_WORDS=400
OLLAMA_EXPERT_NUM_PREDICT=1400
EH_SUMMARY_BOOK_RAG_CHARS=6000
```

Disable dense mode: `EH_SUMMARY_DENSE_MODE=0` + `EH_SUMMARY_TARGET_WORDS=1000`.

## 7. CI — auto build on `staging` push

GitHub Actions (`.github/workflows/staging-ci.yml`) runs `npm run build` on every push to `staging`.

Link Vercel/Railway to the same branch for deploy after green CI.

## 8. Checklist before production merge

- [ ] Tested Smart Search + summary on staging URL
- [ ] Mock patients only (no prod data in staging DB)
- [ ] Ollama tunnel reachable from Railway (health: `GET /api/summary/stack-status`)
- [ ] Formula / summary format approved by doctor
