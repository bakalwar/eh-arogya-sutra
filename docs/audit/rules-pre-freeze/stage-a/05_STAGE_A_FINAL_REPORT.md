# Stage A — Final report (correction pass)

**Baseline:** `658f3fd97e1e00fcafef74ddd3788d2cfa3bf1d7`  
**Prior head:** `136ca9e78c4d6ec738df4097f95ff875c7ca5aa6`  
**Correction head:** `19dd5bedca43601abf2eee0356e48270e3d74a82`  
**Date:** 2026-08-06

## Executive summary (Hindi)

Stage A की report में अब **326** tracked sources की **पूरी row-level inventory** है। Rule 4 को हर जगह **FREEZE_STATUS_CONFLICT** / **NORMATIVE_CANDIDATE** लिखा गया — formally frozen **नहीं**। Rule 5 पर `main` **Dosage** है; Monitoring spec **`b1ccfb5` branch** पर **UNMERGED_CANDIDATE_EVIDENCE** है — owner decision अभी बाकी। Rule 8 नाम constitution में नहीं; **IDENTITY_CANDIDATE_ONLY**। Local validation **Node 24** पर incomplete; **GitHub CI run 15** on `19dd5be` **success** (PostgreSQL + clinical-engine + tests)।

## Inventory correction

| Metric | Value |
|--------|------:|
| Exact relevant-source count | **326** |
| Row-level complete | **Yes** (`01_…` manifest) |
| Bundled manifests | rule4 **104** paths listed in manifest rows |

## Validation environment

| Item | Value |
|------|--------|
| Node | **v24.16.0** — **NODE20_ENVIRONMENT_NOT_AVAILABLE** |
| npm | 11.17.0 |
| Complete local validation on Node 20 | **Not claimed** |

## Local validation (Node 24, post–`npm ci`)

| Command | Exit | Classification |
|---------|-----:|----------------|
| `npm ci` | 0 | PASS (EBADENGINE warn) |
| `verify:boundary` | 0 | PASS |
| `format:check` | 0 | PASS (after doc edits) |
| `lint` | 0 | PASS |
| `typecheck` | 0 | PASS |
| `test` | 1 | **1000 pass / 32 fail** — see below |
| `build` | 0 | PASS |
| `npm audit` | 1 | 5 high — see SAC-007 |

### Test failure breakdown (32)

| Class | Count | Detail |
|-------|------:|--------|
| PostgreSQL-related integration | **30** | phase3a/b/c, phase3d (partial), phase4a — `ENVIRONMENT_PREREQUISITE_MISSING` locally |
| better-sqlite3 extract | **2** | phase5b clinical-packages — missing native module locally |
| Other | **0** | |

**GitHub CI run 15** on `19dd5be`: **success** — includes PostgreSQL service, extract bootstrap, full test + clinical-engine steps → **LOCAL_ENVIRONMENT_FAILURE** · **CI_PASS_ON_PR_HEAD** (correction head).

### Clinical-engine tests

| Item | Value |
|------|--------|
| Script | `npm run test:clinical-engine` |
| Local | **CLINICAL_ENGINE_TESTS_NOT_PROVEN** on Node 24 host (venv path) |
| CI | **Pass** on run 15 step “Test clinical engine” |

## Dependency advisories (local Node 24)

| Item | Value |
|------|--------|
| High count | **5** (brace-expansion / eslint / minimatch chain) |
| Risk-register matched | Partial — register documents override at Node **20.20.2** with **0** |
| Gap | **DEPENDENCY_RISK_REGISTER_GAP** for local Node 24 audit snapshot |
| Introduced by PR #5 | **No** |

## GitHub CI

| Field | Correction head (`19dd5be`) |
|-------|------------------------------|
| Run | **15** / **31038083277** |
| Conclusion | **success** |
| PostgreSQL tests | **Ran** (service + DB steps success) |
| better-sqlite3 / extract | **Ran** (bootstrap + tests success) |
| Clinical-engine tests | **Ran** — step success |
| Dependency audit | **Ran** — production high gate **success** |

## Conflicts / owner decisions

**Total:** 6 · **Stage B blockers:** SAC-001, SAC-003 · **Owner decisions:** 2 (unchanged)

## Stage B

**Not authorized** until SAC-001 and SAC-003 resolved.

## Recommended next action

Owner reviews **corrected draft PR #5**; then explicit decisions on Rule 5 `main` identity and Rule 4 freeze status before Stage B.

## Final verdict (Stage A correction)

**EHAS2_STAGE_A_CORRECTED_READY_FOR_OWNER_REVIEW**

(Does **not** authorize Stage B or formal freeze.)
