# PHASE 1A-H — Hardening report

**Project:** `C:\Users\zero error\Desktop\EH_AROGYA_SUTRA_2`  
**Date:** 2026-07-29  
**Authorization:** Phase 1A-H only (Phase 1B not started)

## Old project protection

| Check | Result |
|-------|--------|
| Path | `C:\Users\zero error\Desktop\EH_Arogya_Sutra_App` |
| Treated as | Read-only / protected |
| Edits | **None** |
| Servers started/stopped | **None** |
| Git commits in old repo | **None** |
| Secrets / `.env` copied | **No** |
| Patient records copied | **No** |

### Old project baseline (before)

| Item | Value |
|------|--------|
| Branch | `main` |
| HEAD | `b9ec3f6986c402afee13241673b954fe3564f169` |
| Status | Dirty working tree (pre-existing local changes; untouched by this phase) |
| Primary DB | `eh-api\data\eh_arogya.db` |
| DB size | 267071488 bytes |
| DB SHA-256 | `C3FF59F862EAD2559E116CF6A4F629B7259BBD12D73385F299B780F25C4D1154` |

Post-phase re-verification must match the same HEAD and DB hash.

## Work performed

1. Forensic `npm audit` / `npm outdated` / `npm ls` (raw under `%TEMP%\ehas2_phase1a_hardening\`)
2. Safe npm `overrides` for `postcss@8.5.25`, `sharp@0.35.3`, `brace-expansion@5.0.8`
3. Direct `sharp@0.35.3` pin in `apps/web`
4. Clean lockfile regenerate (no `audit fix --force`)
5. API truthfulness: `/ready` → 503; analysis → 501 `NOT_IMPLEMENTED`; request IDs; typed errors; no CORS wildcard; no prod stack leak
6. Hardened `scripts/verify-boundary.mjs` (symlink, nested git, secrets heuristics, write scope, portable legacy path detection)
7. `format:check` script + Prettier ignore
8. CI skeleton: lockfile install, boundary, format, lint, typecheck, test, build, audit artifact
9. Documentation + risk register
10. Foundation tests for status codes / adapter honesty

## Validation commands (recorded — final)

| Command | Exit | Result |
|---------|------|--------|
| `npm run verify:boundary` | 0 | PASS |
| `npm run format:check` | 0 | PASS |
| `npm run lint` | 0 | PASS |
| `npm run typecheck` | 0 | PASS |
| `npm run test` | 0 | PASS (5 tests) |
| `npm run build` | 0 | PASS |
| `npm audit` | 0 | PASS (0 vulnerabilities) |
| Clean `npm ci` (TEMP copy) | 0 | PASS |
| Local commit | — | `3a3af292ab0834113cac34f3a407df6abe13aa61` |

## Explicit non-claims

- Not production-ready
- No clinical engine integrated
- No disease/medicine package installed
- No authentication active
- No patient database
- No payment active
- No production deployment

## Remaining risks

1. npm `allow-scripts` may block `esbuild` postinstall until approved in this npm major — monitor clean CI on Ubuntu
2. Next.js may reintroduce nested vulnerable transitive deps on upgrade — re-audit before Phase 1B
3. Boundary secret heuristics are pattern-based, not a full gitleaks deployment
4. Old project already had a dirty working tree before Phase 1A-H (unrelated); this phase must not add further diffs

## Phase 1B

**Not ready to start without owner approval** after acceptance of this report.
