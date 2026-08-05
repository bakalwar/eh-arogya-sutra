# Stage A — Final report

**Audit:** EHAS2 Rules 1–9 pre-freeze — Stage A (baseline + inventory)  
**Date:** 2026-08-06  
**Owner:** Dr. Ghanshyam Bakalwar  
**Baseline:** `658f3fd97e1e00fcafef74ddd3788d2cfa3bf1d7` (`origin/main` after PR #4 merge)

## Executive summary (सरल हिंदी)

E.H. AROGYA SUTRA 2 का **GitHub `main`** अब **`658f3fd`** पर है — Phase 5D **fail-closed** policy (OD-014) documentation merge के बाद। Stage A ने साबित किया: **production clinical engine और prescription अभी जुड़े नहीं** हैं; Rules 1–3 के **owner-approved** specs मौजूद हैं पर **implement नहीं**; Rule 4 के **104** contract files और tests **`main`** पर हैं पर evaluator **production में active नहीं**; Rule 5 पर **`main`** पर अभी भी **Dosage** identity है — **Monitoring** spec इस baseline में **नहीं** मिला; Phase 5C **synthetic** validation अलग है production से। **Formal freeze नहीं** किया गया। Stage B तभी सुरक्षित शुरू हो सकता है जब owner **Rule 5 identity** और **Rule 4 freeze status** स्पष्ट करें।

## Exact baseline

| Item | Value |
|------|--------|
| Repository | `bakalwar/EH_AROGYA_SUTRA_2` |
| Branch | `audit/rules-1-9-stage-a-inventory` from `origin/main` |
| SHA | `658f3fd97e1e00fcafef74ddd3788d2cfa3bf1d7` |

## Files created (Stage A)

```text
docs/audit/rules-pre-freeze/stage-a/00_REPOSITORY_BASELINE.md
docs/audit/rules-pre-freeze/stage-a/01_AUTHORITY_AND_SOURCE_INVENTORY.md
docs/audit/rules-pre-freeze/stage-a/02_RULE_NUMBER_IDENTITY_MATRIX.md
docs/audit/rules-pre-freeze/stage-a/03_RUNTIME_AND_DATA_CONNECTIVITY.md
docs/audit/rules-pre-freeze/stage-a/04_STAGE_A_CONFLICT_REGISTER.md
docs/audit/rules-pre-freeze/stage-a/05_STAGE_A_FINAL_REPORT.md
```

## Rules 1–9 identity summary

| Rule | Stage A identity status |
|------|-------------------------|
| 1 | IDENTITY_OWNER_APPROVED |
| 2 | IDENTITY_OWNER_APPROVED |
| 3 | IDENTITY_OWNER_APPROVED |
| 4 | IDENTITY_CANDIDATE_ONLY |
| 5 | **IDENTITY_CONFLICT** |
| 6 | IDENTITY_CANDIDATE_ONLY |
| 7 | IDENTITY_CANDIDATE_ONLY |
| 8 | IDENTITY_OWNER_APPROVED (name); NOT_IMPLEMENTED |
| 9 | IDENTITY_CANDIDATE_ONLY |

## Runtime connectivity (verdict)

**Production API:** NOT_CONNECTED for clinical rules.  
**Synthetic orchestrator:** Phase 5C only.  
**Prescription engine:** NOT_CONNECTED.  
**Rule 4 shadow:** Available in contracts; default off.

## Data connectivity (verdict)

116k disease package: **NOT_INSTALLED** live (tooling/contracts).  
39-medicine registry: **present, not prescription-connected**.

## Conflicts

**Total:** 6 (SAC-001 … SAC-006) — see `04_STAGE_A_CONFLICT_REGISTER.md`.  
**Blocking Stage B:** SAC-001 (Rule 5), SAC-003 (Rule 4 freeze labeling).

## Owner decisions required

1. Canonical **Rule 5** identity on `main` (Dosage vs Monitoring track).  
2. Whether Rule 4 potency spec is **FORMALLY_FROZEN** despite DRAFT paths.

## Stage A limitations

- Single baseline checkout; unmerged branches not merged or checked out.  
- No live test re-run recorded in this file until Step 15 validation completes (see commit/PR).  
- No patient data or secrets collected.

## Can Stage B start safely?

**Not yet** — resolve **SAC-001** and **SAC-003** with owner decisions before formal freeze work.

## Recommended next action (exactly one)

**Owner review of this Stage A draft PR**, then explicit decision on **Rule 5 canonical identity on `main`** and **Rule 4 formal freeze status** before authorizing **Stage B**.

## Explicit non-claims

- No Rule was formally frozen.  
- No clinical implementation occurred in Stage A.  
- Phase 5D implementation **NOT_STARTED** (OD-014 is policy documentation only).  
- Production clinical engine remains **disconnected**.  
- No prescription generated or issued.  
- No deployment.  
- Legacy engine **not modified**.  
- Stage B **not started**.

## Validation results (isolated worktree, 2026-08-06)

| Command | Exit | Result | Notes |
|---------|-----:|--------|--------|
| `npm ci` | 0 | PASS | Node **v24.16.0** (project requests **20.x**) — **EBADENGINE** warning |
| `npm run verify:boundary` | 0 | PASS | Folder name TEMP warning only |
| `npm run format:check` | 0 | PASS | Includes new audit docs |
| `npm run lint` | 0 | PASS | |
| `npm run typecheck` | 0 | PASS | |
| `npm run test` | 1 | **FAIL (environment)** | **32 failed** — PostgreSQL integration (Phase 3A–4A) + **better-sqlite3** missing for Phase 5B extract (2 tests); **1000 passed** |
| `npm run build` | 0 | PASS | |
| `npm audit` | 1 | Advisory | 5 high (brace-expansion chain); **no `npm audit fix` run** |
| `git diff --check` | 0 | PASS | Docs only |
| `npm run test:clinical-engine` | — | **NOT_RUN** | Windows venv path not verified in this session |

**CI note:** Stage A documentation expects **GitHub EHAS2 CI** on push (same gate suite as `main`).

## Final verdict

**EHAS2_STAGE_A_COMPLETE_NOT_READY_FOR_STAGE_B** — inventory complete for owner review; **Stage B blocked** on SAC-001 / SAC-003 until owner decisions. Local `npm test` failures are **pre-existing environment limitations**, not caused by audit docs.

**Draft PR verdict for merge review:** **EHAS2_STAGE_A_COMPLETE_READY_FOR_OWNER_REVIEW** (documentation-only scope).
