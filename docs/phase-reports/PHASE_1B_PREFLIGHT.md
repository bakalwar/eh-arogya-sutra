# Phase 1B — Mandatory preflight report

**Date:** 2026-07-29  
**Approved starting HEAD:** `2d53ecad976dd2287570071cdb71997a0d34595d`  
**Ancestry:** `3a3af29` → `e8a7351` → `2d53eca`

## Results

| Gate | Result |
|------|--------|
| Approved HEAD | PASS |
| Working-tree allowScripts review | REVIEWED — retained `esbuild@0.28.1` after evidence |
| TEMP portable Node 20 | PASS — **v20.20.2** (official nodejs.org; SHA-256 verified) |
| Official checksum | PASS |
| Project Node policy (`engines` / `.nvmrc` / `.node-version` / CI) | PASS |
| Lifecycle policy doc | PASS |
| Super Admin foundation | PASS |
| npm audit | 0 vulnerabilities |
| Node 20: npm ci / audit / boundary / format / lint / typecheck / test / build | ALL PASS |
| gitleaks | NOT AVAILABLE — heuristic secret scan remains; not claimed production-grade |
| Old project HEAD / DB SHA-256 | UNCHANGED |

## Approved lifecycle package

- `esbuild@0.28.1` only (pinned). No wildcard. `sharp` not approved for install scripts.

## Node validation environment

- System Node **unchanged** (still available as v24 locally)
- Portable Node extracted only under `%TEMP%\ehas2_phase1b_preflight\` (not in Git)
