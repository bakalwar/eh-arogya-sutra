# PHASE 1A FINAL MANIFEST — E.H. AROGYA SUTRA 2

**Phase:** 1A + 1A-H (engineering foundation + dependency hardening)  
**Date:** 2026-07-29

## What exists

| Area | Contents |
|------|----------|
| Monorepo | npm workspaces: `apps/*`, `packages/*` |
| Apps | `api` (Express shell), `web` (Next shell), `worker` (no jobs) |
| Packages | shared, security, observability, config, design-system, database, clinical-contracts, engine-adapter |
| Scripts | `verify-boundary`, `build-all`, `typecheck-all` |
| CI | `.github/workflows/ci.yml` quality skeleton |
| Docs | architecture, ADR, security, phase reports |
| Fixtures | `fixtures/synthetic/` only (labelled) |

## What does **not** exist

- Clinical engine integration
- Disease / medicine data packages
- Authentication / 2FA / OTP
- Patient database
- OCR / report analysis
- Prescription generation
- Payments
- Production deployment / cloud credentials
- Jupiter 21-screen UI (Phase 1B)

## Ownership

All `@ehas2/*` and `eh-arogya-sutra-2-*` packages are private and owned by E.H. AROGYA SUTRA 2.

## Dependency posture

- Lockfile present
- `private: true` on all workspace packages
- Overrides documented in `docs/security/dependency-risk-register.md`
- `npm audit`: 0 vulnerabilities after Phase 1A-H

## API shell contract

| Endpoint | Behavior |
|----------|----------|
| `GET /health` | Process health only |
| `GET /ready` | 503, `ready: false` |
| `GET /api/eh-as-2/v1/system/data-version` | 503 `DATA_PACKAGE_NOT_INSTALLED` |
| `/api/eh-as-2/v1/analysis` | 501 `NOT_IMPLEMENTED` |

## Acceptance

Phase 1A foundation + 1A-H hardening is accepted only when the final response gate table is all PASS and the local checkpoint commit exists (or blockers are listed).

**Not production-ready.**
