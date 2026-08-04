# Phase 5R-4 Rule 4 Phase 9 — pediatric final potency overlay (planning closeout)

**Worktree:** `C:\Users\zero error\AppData\Local\Temp\ehas2_rule4_planning_phase9_wt`
**Branch:** `phase-5r/rule4-implementation-phase9`
**Baseline commit:** `0a0d28251825a57a835203fbe18dc246bf204088`
**Mode:** Planning / owner decisions only — **no implementation in this pass**

## Exact file modified (this pass)

| Action | Path |
|--------|------|
| **Created** | `docs/phase-reports/PHASE_5R_4_RULE4_PHASE9_PLANNING_CLOSEOUT.md` |

**Not modified:** `docs/clinical/rules/*` (frozen Rule 4 clinical bodies unchanged)
**Not created:** application code, fixtures, tests, registry JSON, commits, pushes, merges, deploys
**Phase 10 / Q18 issuance:** not started

---

## Former planning blockers — resolved by owner decisions

| # | Former blocker | Owner resolution |
|---|----------------|------------------|
| 1 | D1/D2 absent from **D13-C** table | **Dual matrix approved:** POSITIVE **D13-C + D13-D**; NEGATIVE **Q8-H + Q8-C/Q8-D**. Do not duplicate D1/D2 into D13-C. |
| 2 | **D13-D** incomplete for **P13-C · D2 RESTRICT** | **Gate-ledger rule:** where no separate D13-D row exists, full PASS of the authoritative gate set (for P13-C · D2 → complete **Q8-D** ledger) satisfies RESTRICT justification. No invented clinical justification. |
| 3 | Audit / overlay field names **NOT_FROZEN** in D13-E prose | **Structured Phase 9 contract fields approved** (typed list below). No raw-text age or pediatric inference. |
| 4 | **D13-B “364 days”** vs calendar &lt;1y | **Harmonization approved:** executable semantics = Phase 2 calendar (first birthday boundary); “364 days” = non-leap prose only, not executable max. Planning note only — **no rewrite** of frozen clinical bodies. |

---

## Owner decision register (Phase 9)

### 1. Dual pediatric matrix authority

```
PEDIATRIC_OVERLAY_AUTHORITY =
  D13_C_POSITIVE_MATRIX   /* D3, D5, D10, D30, D60 + D13-D where applicable */
+ Q8_H_NEGATIVE_MATRIX    /* D1, D2 + Q8-C / Q8-D gates */
```

Phase 9 contract must compose both matrices explicitly (`pediatric_matrix_authority` per slot).

### 2. Exact D1/D2 behavior (NEGATIVE pathway)

| Band | D1 | D2 | Retained draft conditions |
|------|----|----|---------------------------|
| **P13-C** (1–5y) | **PROHIBIT** | **RESTRICT** | D2 only if full **Q8-D** eligibility + evidence gates **PASS**; missing/contradictory/incomplete Q8-D → final draft null. **No extra invented D13-D.** `final_doctor_approval_required = true`. |
| **P13-D** (6–12y) | **RESTRICT** | **ALLOW** | D1 requires full **Q8-C/D** eligibility evidence. D2 **pass-through** only from authenticated Phase 8 D2 draft. Age alone must not select D1 or D2. `final_doctor_approval_required = true`. |

### 3. D13-D / RESTRICT semantics

- **RESTRICT** re-authenticates existing frozen family-specific gates.
- Where a **D13-D** row exists in frozen docs, that justification is also required when applicable.
- Where **no** separate D13-D row exists, **full PASS of the original authoritative gate set** is the justification (e.g. **P13-C · D2 → Q8-D** ledger).
- No new clinical justification invented. Parent assertion, age alone, or caller boolean insufficient.

### 4. Age boundary harmonization (executable)

| Band | Executable rule |
|------|-------------------|
| **P13-A** | Birth through completed **day 28** |
| **P13-B** | **Day 29** through instant **before first calendar birthday** |
| **P13-C** | Begins on **first calendar birthday** |
| Leap DOB | Deterministic calendar rules (Phase 2 `dateCalendar.ts` remains authoritative) |

No fixed 365-day shortcut. Frozen **D13-B** clinical text not rewritten; this report is the harmonization note.

### 5. Overlay semantics (no transform)

| Cell outcome | Effect on final draft |
|--------------|------------------------|
| **ALLOW** | Retain authenticated Phase 8 dilution (and cascade in `final_draft_*` when permitted) |
| **RESTRICT** | Same dilution retained **only** if required gates (+ D13-D when frozen row exists) **PASS** |
| **PROHIBIT** | `final_draft_cascade = null`, `final_draft_dilution = null` |
| **UNRESOLVED / MISSING / CONTRADICTORY** | `final_draft_cascade` and `final_draft_dilution` null |
| **P13-E** | `pediatric_overlay_status = NOT_APPLICABLE`; Phase 8 cascade/dilution unchanged internally |

**Always preserve** `base_selected_cascade` / `base_selected_dilution` for audit.
**No** automatic demotion, promotion, or Phase 9-invented fallback.
**D60** on P13-C/D = **PROHIBIT** — Phase 9 must **not** convert D60 → D10; D10 only if Phase 8 independently authenticated D10 or D60→D10 fallback draft.

### 6. Internal result authority (shadow only)

| Invariant | Value |
|-----------|--------|
| `execution_status` | `NOT_IMPLEMENTED` |
| `automatic_pediatric_overlay_runtime` | `false` |
| `automatic_prescription_issuance_runtime` | `false` |
| `prescription_issue_allowed` | `false` |
| `final_doctor_approval_required` | `true` |
| Public `Rule4Result` | Unchanged (null public selected cascade/dilution) |
| PRODUCTION overlay path | `NOT_EVALUATED` |
| DB / API / UI | No activation |

Phase 9 may emit an **internal shadow pediatric-adjusted draft** — not an issued prescription.

### 7. D13-HS (patient-wide absolute stop)

**P13-A / P13-B:** all slots blocked; final cascade/dilution null; no medicine/formula/potency/dose/frequency; `clinical_prescription_summary = NOT_GENERATED`; Phase 8 draft must not leak; crisis/red-flag escalation preserved separately; no partial prescription.

### 8. Approved structured contract fields (per slot)

- `verified_age_band`
- `age_verification_status`
- `age_provenance_digest`
- `phase8_selection_fingerprint`
- `base_selected_cascade`
- `base_selected_dilution`
- `pediatric_matrix_authority` (`D13_C_POSITIVE` | `Q8_H_NEGATIVE` | `NOT_APPLICABLE`)
- `pediatric_overlay_status`
- `overlay_gate_results`
- `d13_d_justification_status`
- `final_draft_cascade`
- `final_draft_dilution`
- `reason_codes`
- `limitation_codes`
- `final_doctor_approval_required`
- `prescription_issue_allowed`
- `deterministic_pediatric_overlay_fingerprint`

---

## Final executable matrix — P13-C and P13-D (D1–D60)

**Under P13-A / P13-B:** **D13-HS** — overlay not evaluated; all final drafts null; no Phase 8 leak.

**Legend:** Gate = family-specific frozen gates + RESTRICT rules in §3. **Final draft** = non-issuable internal shadow only.

### P13-C (1–5 years)

| Phase 8 base dilution | Matrix | Cell | Final draft if Phase 8 authenticated |
|----------------------|--------|------|--------------------------------------|
| D1 | Q8-H | PROHIBIT | null / null |
| D2 | Q8-H | RESTRICT | D2 only if full Q8-D PASS |
| D3 | D13-C | RESTRICT | D3 if cascade + D13-D P13-C·D3 PASS |
| D5 | D13-C | ALLOW | D5 if Phase 8 resolved |
| D10 | D13-C | RESTRICT | D10 if cascade + D13-D P13-C·D10 + D10F PASS |
| D30 | D13-C | PROHIBIT | null / null |
| D60 | D13-C | PROHIBIT | null / null (no Phase 9 D60→D10) |

### P13-D (6–12 years)

| Phase 8 base dilution | Matrix | Cell | Final draft if Phase 8 authenticated |
|----------------------|--------|------|--------------------------------------|
| D1 | Q8-H | RESTRICT | D1 if full Q8-C/D PASS |
| D2 | Q8-H | ALLOW | D2 pass-through from Phase 8 |
| D3 | D13-C | RESTRICT | D3 if cascade + D13-D P13-D·D3 PASS |
| D5 | D13-C | ALLOW | D5 if Phase 8 resolved |
| D10 | D13-C | RESTRICT | D10 if cascade + D13-D P13-D·D10 + D10F PASS |
| D30 | D13-C | RESTRICT | D30 if full Q07C-D30F + D13-D P13-D·D30 PASS |
| D60 | D13-C | PROHIBIT | null / null |

### P13-E (13+ years)

All dilutions: **NOT_APPLICABLE** — internal Phase 8 cascade/dilution unchanged; overlay gates not applied.

---

## Safety and D13-HS precedence (implementation order)

1. Validate age provenance (Phase 2 calendar band; contradiction fail-closed)
2. Patient-wide **Q06C** crisis / red-flag hold (preserve escalation flags)
3. **D13-HS** if P13-A or P13-B — stop all slots
4. Missing / invalid / contradictory age — UNRESOLVED; **no** D13-HS inference without verified &lt;1y
5. Authenticate Phase 8 (`selectionResolution`, fingerprint, slot/target binding, `RESOLVED_DRAFT_CANDIDATE` where required)
6. Per slot: apply **D13-C** (POSITIVE) or **Q8-H** (NEGATIVE) per `pediatric_matrix_authority`
7. Apply RESTRICT gate + D13-D rules (§3)
8. Emit overlay fingerprint + internal draft; public result unchanged

Crisis coexisting with D13-HS: escalation/hold preserved; clinical summary still **NOT_GENERATED**; no potency leak.

---

## Proposed contract and registry (implementation phase — not created yet)

| Artifact | Name |
|----------|------|
| Contract version | `ehas2-rule4-contract-v1-phase9-pediatric-overlay` |
| Registry slice | `PHASE9_PEDIATRIC_OVERLAY_SUBSET` |
| Registry metadata | `complete: false`, `unknownCodePolicy: REJECT_UNKNOWN_CODE`, `clinicalRegistryStatus: SHADOW_PEDIATRIC_DRAFT_NOT_PRODUCTION_ACTIVE` |
| Golden fixture (future) | `fixtures/rule4/pediatric-overlay-scenarios.v1.json` (synthetic, read-only tests, pinned SHA) |

---

## Scenario matrix (planning count)

**56** numbered planning scenarios retained from read-only audit (calendar boundaries, D13-HS, dual matrix D1–D60, Phase 8 auth failures, multi-slot, acute/chronic isolation, safety hold, P13-E pass-through, fingerprint collision cases, public/shadow equivalence, PRODUCTION fail-closed). Implementation pass will materialize golden rows from this matrix.

---

## Frozen clinical authority (unchanged)

Implementation and tests must continue to treat as authority:

- `docs/clinical/rules/rule-04-owner-decisions-DRAFT.md` (**Q07C-CLOSE-D13**, **Q08-CLOSE** **Q8-H**, **D13-HS**, **D13-D** rows)
- `docs/clinical/rules/rule-04-potency-engine-DRAFT.md`
- Phase 2 calendar age in `packages/clinical-contracts/src/rule4/safety/dateCalendar.ts` (executable banding)

Legacy `potency_engine.py` remains forensic only.

---

## Git hygiene (this pass)

```
git rev-parse HEAD
0a0d28251825a57a835203fbe18dc246bf204088

git status --short
?? docs/phase-reports/PHASE_5R_4_RULE4_PHASE9_PLANNING_CLOSEOUT.md

git diff --check
(exit 0, no conflicts)

git diff --name-only docs/clinical/rules/
(empty — frozen clinical bodies unchanged)
```

---

## Final verdict

**PHASE_9_PLANNING_READY_FOR_IMPLEMENTATION**

No remaining frozen clinical conflict identified after owner decisions **1–8**. Implementation still requires a **separate owner approval** before coding, fixtures, tests, or isolated commit (same discipline as Phase 8).

**STOP — RULE 4 PHASE 9 OWNER DECISIONS RECORDED · WAIT FOR IMPLEMENTATION APPROVAL**
