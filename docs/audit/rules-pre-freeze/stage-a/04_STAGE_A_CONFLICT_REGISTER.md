# Stage A — Conflict register

**Baseline:** `658f3fd97e1e00fcafef74ddd3788d2cfa3bf1d7`  
Stage A records conflicts; **does not resolve** them clinically.

---

## SAC-001 — Rule 5 identity (Dosage vs Monitoring)

| Field | Value |
|-------|--------|
| **Rule(s)** | 5 |
| **Topic** | Canonical name and responsibility |
| **Source A** | `packages/clinical-contracts/src/nineRules.ts` L59–63 — **Dosage**, `READY_FOR_VALIDATION`, `affectsClinicalSelection: true` |
| **Source B** | `docs/clinical/rule-by-rule-implementation-status.md` L13 — **Dosage**; **no** `rule-05-monitoring-*` file on `main` |
| **Authority A** | **IMPLEMENTATION_CURRENT** (baseline contracts) |
| **Authority B** | **SUPPORTING** status doc |
| **Contradiction** | Owner-approved **Monitoring** Rule 5 specification is **not** in the baseline tree; only **Dosage** EH_9 identity is present. (Monitoring work may exist on unmerged branch — **not** verified in Stage A checkout.) |
| **Runtime impact** | 5C orchestration uses Dosage stub semantics on `main`. |
| **Patient-safety impact** | Mis-labeling post-release surveillance as dosage affects future wiring. |
| **Stage B impact** | **Blocking** — identity must be owner-resolved before freeze. |
| **Owner decision required** | **Yes** |
| **Next investigation** | Compare `main` vs `phase-5r/rule5-phase1-contract-foundation` in Stage B (read-only). |

---

## SAC-002 — Rules 1–3 owner spec vs Phase 5C synthetic

| Field | Value |
|-------|--------|
| **Rule(s)** | 1, 2, 3 |
| **Topic** | Implementation status vs synthetic orchestrator |
| **Source A** | Owner specs + constitution — **NOT_IMPLEMENTED** production |
| **Source B** | `rule-by-rule-implementation-status.md` L11; 5C orchestrator **EXECUTED/UNRESOLVED** for organ/triad steps |
| **Authority A** | **OWNER_APPROVED** |
| **Authority B** | **SYNTHETIC_VALIDATION_ONLY** |
| **Contradiction** | Same rule numbers appear “executed” in 5C tests but **NOT_IMPLEMENTED** per owner spec. |
| **Runtime impact** | Tests pass synthetic path; production remains disconnected. |
| **Patient-safety impact** | Risk if synthetic results mistaken for owner-spec behavior. |
| **Stage B impact** | Non-blocking for inventory; **blocking** for freeze parity tests. |
| **Owner decision required** | No (documented); Stage B must separate labels. |
| **Next investigation** | Map 5C steps to spec gaps per rule. |

---

## SAC-003 — Rule 4 frozen vs DRAFT / NOT_FROZEN markers

| Field | Value |
|-------|--------|
| **Rule(s)** | 4 |
| **Topic** | Specification freeze status |
| **Source A** | `rule-by-rule-implementation-status.md` L12 — **DOCUMENTATION FROZEN** (5R-4D) |
| **Source B** | `rule-04-potency-engine-DRAFT.md` filename; owner-decisions DRAFT contains **NOT_FROZEN** language |
| **Authority A** | **SUPPORTING** status table |
| **Authority B** | **NORMATIVE_CANDIDATE** spec artifacts |
| **Contradiction** | “Frozen” vs “DRAFT” filename and internal NOT_FROZEN flags. |
| **Runtime impact** | Contracts exist; evaluator NOT_IMPLEMENTED. |
| **Patient-safety impact** | Governance ambiguity for potency issuance. |
| **Stage B impact** | **Blocking** for formal freeze sign-off. |
| **Owner decision required** | **Yes** |
| **Next investigation** | Owner ruling on DRAFT → FORMALLY_FROZEN rename vs content gaps. |

---

## SAC-004 — Nine-rule matrix legacy column vs EHAS2 constitution

| Field | Value |
|-------|--------|
| **Rule(s)** | 1–9 |
| **Topic** | Legacy MDE behavior documented as matrix “Source” |
| **Source A** | `CLINICAL_PRODUCT_CONSTITUTION.md` — EHAS2 owner rules |
| **Source B** | `nine-rule-engine-matrix.md` — `calc_dosage`, MDE interleaved order |
| **Authority A** | **OWNER_APPROVED** |
| **Authority B** | **LEGACY_REFERENCE_ONLY** |
| **Contradiction** | Matrix mixes canonical EH_9 names with **legacy live** module mapping without always labeling non-authoritative columns. |
| **Runtime impact** | None on production (disconnected). |
| **Patient-safety impact** | Implementers may follow legacy column. |
| **Stage B impact** | Non-blocking; doc hygiene recommended. |
| **Owner decision required** | No |
| **Next investigation** | Stage B authority tagging for matrix columns. |

---

## SAC-005 — OD-013 tail vs OD-014 approval

| Field | Value |
|-------|--------|
| **Rule(s)** | — (mixture policy) |
| **Topic** | Fail-closed policy approval state |
| **Source A** | OD-013 bullet — fail-closed “remains subject to … Phase 5D sign-off; **does not approve** that policy” |
| **Source B** | OD-014 — **OWNER-APPROVED** fail-closed policy (PR #4 merged in baseline) |
| **Authority A** | **OWNER_APPROVED** OD-013 (historical sentence) |
| **Authority B** | **OWNER_APPROVED** OD-014 |
| **Contradiction** | OD-013 paragraph written before OD-014 still reads as if fail-closed were unapproved; OD-014 supersedes policy status. |
| **Runtime impact** | Documentation only. |
| **Patient-safety impact** | Low if readers use OD-014; confusion if only OD-013 tail read. |
| **Stage B impact** | Non-blocking |
| **Owner decision required** | Optional doc tidy |
| **Next investigation** | Cross-link OD-013 tail → OD-014 in future doc PR (not Stage A). |

---

## SAC-006 — Rule 8 clinical effect claims (legacy vs EHAS2)

| Field | Value |
|-------|--------|
| **Rule(s)** | 8 |
| **Topic** | Live clinical effect |
| **Source A** | `nine-rule-engine-matrix.md` L45 — “Docs claim clinical; live MDE does not call” |
| **Source B** | `nineRules.ts` L78–82 — **NOT_IMPLEMENTED** |
| **Authority A** | **LEGACY_REFERENCE_ONLY** |
| **Authority B** | **IMPLEMENTATION_CURRENT** |
| **Contradiction** | Historical documentation overstates live Rule 8 execution. |
| **Runtime impact** | EHAS2 NOT_IMPLEMENTED. |
| **Patient-safety impact** | Low at current disconnect. |
| **Stage B impact** | Non-blocking |
| **Owner decision required** | Already partially addressed in rule-8-readiness-decision |
| **Next investigation** | — |

---

## Conflict count

| Metric | Count |
|--------|------:|
| **Total SAC entries** | 6 |
| **Blocking Stage B (identity/governance)** | 2 (SAC-001, SAC-003) |
| **Owner decision required** | 2 (SAC-001, SAC-003) |
