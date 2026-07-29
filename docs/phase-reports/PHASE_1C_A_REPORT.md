# PHASE 1C-A REPORT — Public entry and doctor dashboard UX

**Date:** 2026-07-30  
**Starting HEAD:** `91a383238c92e00221253fd1588688fccc5da0f7`  
**Commit message (local):** `feat(ehas2): add public entry and doctor dashboard UX`

## Delivered

- Splash → login preview flow (`/` → `/login`)
- Doctor login + OTP verification UI (no real SMS/auth)
- Doctor dashboard with truthful zero/empty states (`/dashboard`)
- Problem-report dialog (NOT_CONNECTED, no transmit)
- Logo optimized for production; original retained for comparison
- Coming-soon routes for New Case / Patients / Reports / Prescriptions
- Loading / error / not-found UI foundations + page metadata

## Logo optimization

| Asset | Path | Size | SHA-256 |
|-------|------|------|---------|
| Original (retained) | `apps/web/public/brand/ehas2-logo.original.png` | 2,203,146 bytes | `7D32612C2378AA83DEA9C025D49F0279EB1F53BEFBA24CA537B68AF844F00646` |
| Optimized (production) | `apps/web/public/brand/ehas2-logo.png` | 364,313 bytes | `3827252438908FD65F49C5594EBA4DB0FB4B6D104AA1394B283D8FAABDA2C3E3` |

Visual comparison screenshot: `docs/phase-reports/qa-screenshots-1c-a/logo_original_vs_optimized.png` — **PASS** (no redesign; transparency retained; `next/image` with explicit 512×512).

## Explicit non-claims

- Authentication is **not** active  
- OTP is **not** delivered  
- Dashboard uses **zero/empty** states  
- Problem reporting is **not** transmitted  
- No clinical functionality  
- No Super Admin login  
- Payment / monitoring / disease / medicine packages **not** active  

## Future auth guard

`/dashboard` will require a real authentication guard in Phase 2+. Phase 1C-A has **no** route protection by design. Preview navigation uses an explicitly named UI-preview action that cannot be mistaken for production authentication.

## Gates (Node 20.20.2)

| Gate | Result |
|------|--------|
| `npm run verify:boundary` | PASS |
| `npm run format:check` | PASS |
| `npm run lint` | PASS |
| `npm run typecheck` | PASS |
| `npm run test` | PASS (36) |
| `npm run build` | PASS |
| `npm audit` | 0 vulnerabilities |
| Responsive Playwright QA | PASS (0 console / 0 page errors / no overflow) |
| Secret / patient-data (boundary) | PASS |

## Old project protection

- HEAD unchanged: `b9ec3f6986c402afee13241673b954fe3564f169`
- DB checksum unchanged: `C3FF59F862EAD2559E116CF6A4F629B7259BBD12D73385F299B780F25C4D1154`

## Known gaps

1. Real authentication / OTP delivery not implemented (by design).  
2. Patient / New Case / Report Upload UX deferred to Phase 1C-B/C.  
3. Full WCAG audit not claimed — smoke + manual checklist only.  
4. Auth route guards deferred to Phase 2+.  
5. Support report transmission deferred.
