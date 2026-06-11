# E.H. Arogya Sutra App - Agent Instructions

This is a full-stack Clinical Decision Support System (CDSS) for Ayurvedic and Homeopathic practitioners, providing intelligent medicine recommendations, patient management, and advanced report analysis.

## Tech stack

### Mandated target stack (product / architecture)
These are **non‑negotiable** platform choices for production. Implementation may lag; track gaps vs. the **current repo** section below.

| Area | Stack |
|------|--------|
| **Frontend** | React.js + Vite + Tailwind CSS + **Vite PWA Plugin** |
| **Backend** | Node.js + Express.js |
| **Database** | **PostgreSQL + Sequelize ORM** |
| **Auth** | JWT (**15 min** expiry) + bcrypt + **Speakeasy 2FA** + **OTP Email** |
| **Search** | PostgreSQL FTS + **Fuse.js** (fuzzy) |
| **OCR** | **Tesseract.js** (Hindi + English) |
| **PDF read** | **pdf-parse** + **PDF.js** |
| **PDF make** | **Puppeteer** |
| **Photos** | **TensorFlow.js** + **Face-API.js** + **Color-Thief.js** |
| **Video** | **Video.js** + **Cloudflare R2** |
| **Translate** | **LibreTranslate** (self‑hosted only — **no paid translation API**) |
| **Payments** | **PhonePe** + **GPay** + **Paytm** Business **QR + webhooks** (auto-verify) + **NPCI UPI AutoPay** — **direct to clinic account**; **no Razorpay** |
| **Security** | **14‑layer** model — see [docs/REFERRAL-PAYMENTS-DESIGN-SECURITY.md](docs/REFERRAL-PAYMENTS-DESIGN-SECURITY.md) |
| **Hosting** | **Vercel** + **Railway** + **Supabase** |

**Three user panels**
1. **Admin** — full system control  
2. **Doctor** — clinical workflow (primary)  
3. **Patient** — view‑only access  

**Subscription plans**
| Plan | Terms |
|------|--------|
| **Free trial** | 14 days, **all** features unlocked |
| **Basic** | ₹699/month — max **100** patients, core features only |
| **Pro** | ₹1499/month — **unlimited** patients, all features |
| **Yearly** | Basic **₹6999** / Pro **₹14999** |
| **Pricing rule** | Admin can change list prices anytime; **existing doctors keep their grandfathered price** |

**Referral rewards** (verified doctor sign-ups)

| Referrals | Free extension |
|-----------|----------------|
| 10 | 1 month |
| 20 | 3 months |
| 30 | 6 months |
| 50 | 1 year |
| 100 | Lifetime |

- **Code format:** `DR-NAME-YEAR` (normalized, unique).  
- **Anti-fraud:** **one phone = one account**; **real payment** required before a referral counts as verified (see full spec doc).

**Design system (mandated)** — Colors `#080f09`, `#2d6a35`, `#4a9b54`, `#c9963a`, `#e8c46a`; fonts **Cinzel** (headings), **Cormorant Garamond** (taglines), **DM Sans** + **Noto Sans Devanagari** (body/Hindi); dark forest + gold; caduceus logo (gold staff, green snakes); PWA-ready. Details: [docs/REFERRAL-PAYMENTS-DESIGN-SECURITY.md](docs/REFERRAL-PAYMENTS-DESIGN-SECURITY.md).

### Current implementation (this repo)
Until migration is complete, the codebase may still reflect:
- **Backend**: Node.js + Express.js + **MongoDB (Mongoose)** — see `backend/`, `database/schema.sql` for PostgreSQL reference. **Optional:** `DATABASE_URL` → Sequelize with **connection pool** (`PG_POOL_MAX` / `PG_POOL_MIN`; use **PgBouncer** + replicas at very large scale) + `GET /health` (`databases.postgres.poolMax`). **Flags:** `USE_POSTGRES_FOR_*` (see `.env.example`). **Fuzzy symptom + medicine search:** `GET /api/symptom-checker/search?q=...` (Postgres + `pg_trgm`). **Branding:** `GET /api/branding`; env `CLINIC_NAME` / `CLINIC_PHONE` (defaults: E.H. AROGYA SUTRA, 9098791989).
- **Frontend**: React + Vite + Tailwind + i18next (EN/HI) + PWA (Vite PWA plugin in `frontend/`)
- **Security**: JWT (configure expiry), bcrypt, Helmet, CORS, rate limiting — **2FA / OTP email / 15‑min JWT** as per mandate when wired
- **Services (legacy / interim)**: Twilio (OTP), Stripe (payments), PDFKit (prescriptions) — replace with mandated stack incrementally

## Build & Run Commands
- `npm run dev` - Start backend dev server (nodemon)
- `npm run dev:web` - Start frontend dev server (Vite, port 5173)
- `npm run dev:live` - Backend + Vite + static `serve` on port 5555 (optional full preview)
- `npm run open:eh-hub` - Open **http://localhost:5000/eh-arogya/** in browser (run `npm run dev` first)
- `npm run agent:now` - Post “abhi” line to hub: `npm run agent:now -- "message"` (requires `npm run dev`)
- `npm run preview:docs` - Serve project root on **http://localhost:5555** (e.g. `/docs/project-dekho.html`)
- `npm run build:web` - Build frontend for production
- `npm start` - Production backend
- `npm run seed` - Initialize database with demo data (MongoDB)
- `npm run seed:postgres` - Seed PostgreSQL (requires `DATABASE_URL` + `database/schema.sql`)

## Architecture Overview
- **Backend Structure**: `server.js` (main app), `models/` (Mongoose schemas today), `routes/` (REST endpoints), `services/` (domain logic, many stubs), `middleware/` (auth, error handling). **Target:** Sequelize models + PostgreSQL.
- **Frontend Structure**: `src/pages/` (route components), `src/components/` (reusable UI), `src/api/client.js` (Axios with JWT interceptor)
- **Database**: **Current** MongoDB primary; **mandated** PostgreSQL + Sequelize. Reference SQL in `database/schema.sql`.
- **Authentication**: **Current** mobile/JWT in localStorage; **mandated** JWT 15m + bcrypt + Speakeasy 2FA + OTP email.

## Key Conventions
- **Backend**: Use `asyncHandler` for route functions, return `{success, message, data}` format, error codes: 400 (validation), 409 (duplicate), 500 (server)
- **Frontend**: PascalCase for components, `t('key')` for i18n, protected routes with auth checks
- **Models**: `toJSON()` transforms `_id` to `id`, removes `__v`
- **File Naming**: camelCase for backend files, PascalCase for React components

## Common Pitfalls
- Ensure MongoDB is running before starting backend (503 error if not)
- Backend runs on port 3000 (default), frontend on 5173
- Use `npm run seed` (Mongo) or `npm run seed:postgres` (Postgres + `DATABASE_URL`) to populate default medicines and demo doctor
- JWT tokens expire; handle 401 responses with auto-logout
- Many services in `backend/services/` are stubs; implement as needed
- Environment variables: Create `.env` file for secrets (MongoDB URI, JWT secret, Twilio/Stripe keys)

## Configuration Files
- `vite.config.js` - Frontend build configuration
- `tailwind.config.js` - Styling theme and plugins
- `eslint.config.js` - Linting rules
- `postcss.config.js` - CSS processing

For detailed setup and features, see [README.md](README.md). For design specs, see [docs/design.html](docs/design.html). **Roadmap:** [docs/ROADMAP-NEXT-STEPS.md](docs/ROADMAP-NEXT-STEPS.md). **Staging (hybrid Ollama + mock DB):** [docs/STAGING-DEPLOYMENT.md](docs/STAGING-DEPLOYMENT.md). **Referral / payments / design / 14 layers:** [docs/REFERRAL-PAYMENTS-DESIGN-SECURITY.md](docs/REFERRAL-PAYMENTS-DESIGN-SECURITY.md).

## Local live hub (E.H. Arogya naam se — Chrome)
- Jab **`npm run dev`** (backend) chal raha ho (default **PORT=5000**):
  - **Hub:** [http://localhost:5000/eh-arogya/](http://localhost:5000/eh-arogya/) — links + diary + **bina refresh** live (SSE `GET /eh-arogya/api/stream`, merged JSON `GET /eh-arogya/api/log`).
  - **“Abhi” line:** `local-site/eh-arogya/data/agent-now.txt` (ek line) **ya** `npm run agent:now -- "status"` — turant hub par.
  - **Auto `work-log.json`:** `frontend/src` + `backend` par save → live file list; ~**45s** debounce par `autoLog[]` snapshot (max 50). Watcher off: `EH_HUB_WATCH=0`.
  - **Manual milestones:** `entries[]` + `updatedAt` — hub `log_refresh` se turant.
  - **Agent workflow:** feature complete → `entries` + `updatedAt`; beech mein **`npm run agent:now -- "…"`** taaki user real-time “abhi” dekhe.
  - **Docs HTML:** [http://localhost:5000/eh-arogya-docs/project-dekho.html](http://localhost:5000/eh-arogya-docs/project-dekho.html)
- Quick open: `npm run open:eh-hub`

## User preview hub (chat / work start here)
- **Primary index (user):** `project-preview.html` (in project root) — static screen mocks in that folder, plus links into this repo (`docs/project-dekho.html`, `DEKHO.bat`, source files) and **http://localhost:5173/** when dev servers are running.
- When the user says “jo link diya / project preview”, use that hub page and the paths it lists as the default entry for navigation and checks.