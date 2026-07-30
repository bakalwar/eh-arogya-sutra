# Dependency risk register — E.H. AROGYA SUTRA 2 (Phase 1A-H)

**Date:** 2026-07-29 (updated Phase 1B preflight)  
**Node policy:** `20.x` (validated on **v20.20.2** via TEMP portable official build)  
**npm:** >=10 (validated with npm 10.8.2 under Node 20.20.2)  
**Raw audits (not in Git):** `%TEMP%\ehas2_phase1a_hardening\`, `%TEMP%\ehas2_phase1b_preflight\`

## Summary

| Moment | critical | high | moderate | low | total |
|--------|----------|------|----------|-----|-------|
| Before hardening | 0 | 8 | 0 | 0 | 8 |
| After safe overrides + clean lockfile | 0 | 0 | 0 | 0 | 0 |

`npm audit fix --force` was **not** used.

## Advisories identified (before)

### 1. brace-expansion / minimatch (via eslint)

| Field | Value |
|-------|--------|
| Advisory | GHSA-mh99-v99m-4gvg |
| Package | `brace-expansion` (via `minimatch` → `eslint`) |
| Installed (before) | `brace-expansion@1.1.17` under eslint’s `minimatch@3` |
| Vulnerable range | `<=5.0.7` |
| Severity | high |
| Direct / transitive | Transitive (eslint is direct **devDependency**) |
| Workspace | root |
| Prod / dev | **Development** (lint tooling only) |
| Runtime reachability | **No** — not loaded by API/web production runtime |
| Vulnerable feature | Glob brace expansion DoS during lint |
| Safe patched version | `brace-expansion@5.0.8` |
| Breaking-change risk | Low–medium (API of brace-expansion 5 vs 1); verified lint still passes |
| Recommended action | **Applied** root `overrides.brace-expansion = 5.0.8` |
| Blocks Phase 1B? | No (dev-only; fixed) |

### 2–4. postcss (via next)

| Field | Value |
|-------|--------|
| Advisories | GHSA-qx2v-qp2m-jg93 (moderate XSS stringify), GHSA-6g55-p6wh-862q (high arbitrary file read), GHSA-r28c-9q8g-f849 (high path traversal via sourceMappingURL) |
| Package | `postcss` nested under `next@15.5.22` |
| Installed (before) | `8.4.31` |
| Vulnerable range | `<=8.5.17` (high path issues); XSS `<8.5.10` |
| Severity | high (2) + moderate (1) — counted in npm meta as part of next/postcss tree |
| Direct / transitive | Transitive (`next` is direct in `apps/web`) |
| Workspace | `eh-arogya-sutra-2-web` |
| Prod / dev | **Build / image pipeline** — Next CSS processing; not a live clinical request handler in Phase 1A |
| Runtime reachability | **Limited** — build-time CSS pipeline; Phase 1A does not process untrusted user CSS |
| Safe patched version | `postcss@>=8.5.18` (used `8.5.25`) |
| Breaking-change risk | Low (patch within 8.5) |
| Recommended action | **Applied** `overrides.postcss` + `overrides.next.postcss` |
| Blocks Phase 1B? | Would have required fix or approval if left unpatched; **fixed** |

### 5. sharp (via next)

| Field | Value |
|-------|--------|
| Advisory | GHSA-f88m-g3jw-g9cj (libvips CVEs) |
| Package | `sharp` |
| Installed (before) | `0.34.5` |
| Vulnerable range | `<0.35.0` |
| Severity | high |
| Direct / transitive | Transitive via Next; then pinned direct in `apps/web` |
| Workspace | `eh-arogya-sutra-2-web` |
| Prod / dev | Optional **runtime** image optimization if `next/image` used |
| Runtime reachability | **Potential** if Image Optimization enabled; Phase 1A page does not use `next/image` |
| Safe patched version | `sharp@>=0.35.0` (used `0.35.3`) |
| Breaking-change risk | Medium (minor bump); Next build verified after pin |
| Recommended action | **Applied** override + direct dependency `sharp@0.35.3` |
| Blocks Phase 1B? | **Fixed** — no longer blocks |

### 6. eslint toolchain (rollup of #1)

| Field | Value |
|-------|--------|
| Package | `eslint@9.39.5` |
| Severity | high (via minimatch/brace-expansion) |
| Prod / dev | Development |
| npm suggested fix | `eslint@10.8.0` (**major** — not applied blindly) |
| Action | Mitigated via `brace-expansion` override instead of major eslint upgrade |
| Blocks Phase 1B? | No |

## npm audit suggested “fix” rejected

`npm audit` suggested downgrading `next` to `9.3.3` (major downgrade, incorrect). **Rejected.** Compatible overrides used instead.

## After hardening — unresolved

**None** in `npm audit` (0 vulnerabilities).

## Unused dependencies removed

None removed in Phase 1A-H (all workspace packages retain a documented purpose). `sharp` was **added** as a direct pin to force the patched version under Next.

## Lifecycle scripts (Phase 1B preflight)

See `docs/security/npm-lifecycle-script-policy.md`.

| Package | Version | Allowed | Notes |
|---------|---------|---------|-------|
| esbuild | 0.28.1 | YES (pinned) | Official npm registry + lockfile integrity; required for Vite/Vitest/tsx |
| sharp | 0.35.3 | NO (not in allowScripts) | Separate audit required before any install-script approval |

## Review date

Re-audit after any Next.js / esbuild / sharp upgrade and before production monitoring activation.

## Phase 4C-V addition — Playwright

| Package | Version | Prod / dev | Notes |
|---------|---------|------------|-------|
| `@playwright/test` | 1.62.0 (exact) | **Development** | Node 20 compatible; browser binaries via `npx playwright install chromium` (not committed) |
| Lifecycle scripts | install browsers separately | N/A | No `npm audit fix --force`; no `--legacy-peer-deps` |
| Audit after add | 0 vulnerabilities | — | Recorded in `%TEMP%\ehas2_phase4c_v_audit\` |
