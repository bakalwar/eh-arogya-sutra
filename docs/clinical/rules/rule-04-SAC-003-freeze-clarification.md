# Rule 4 — SAC-003 documentation freeze clarification (owner-approved)

**Product:** E.H. AROGYA SUTRA 2  
**Owner:** Dr. Ghanshyam Bakalwar  
**Conflict:** SAC-003 (Rule 4 freeze-status)  
**Baseline:** `f28c7e5953e4216707f790b6fd6719a6f7966a55` (`main`, post–PR #5 Stage A)  
**Document type:** **Clarification only** — does **not** amend, replace, or reinterpret the clinical text in existing Rule 4 authority files.

---

## 1. Owner authorization (2026-08-06)

Dr. Ghanshyam Bakalwar authorizes **limited documentation clarification** to resolve SAC-003, subject to **all** of the following:

| Requirement | Status |
|-------------|--------|
| Q1–Q18 **clinical decision bodies** in existing Rule 4 documents | **Unchanged** |
| Existing contracts, TypeScript/Python shadow implementation, tests, fingerprints, safety gates | **Unchanged** |
| No new clinical rules | **Required** |
| No delete/replace/modify of clinical rules, contracts, code, tests, or safety gates | **Required** |
| Pending **exact clinical thresholds** | **Not frozen** without **separate** owner approval |
| Rule 4 runtime | **Shadow-only**, **`RULE4_ENGINE_MODE=off` default**, **production-disconnected** |
| Production activation, prescription issuance, Stage B, Phase 5D | **Not authorized** by this clarification |

This file **records** owner interpretation of existing markers. It **does not** edit [rule-04-owner-decisions-DRAFT.md](./rule-04-owner-decisions-DRAFT.md), [rule-04-potency-engine-DRAFT.md](./rule-04-potency-engine-DRAFT.md), or [rule-04-unresolved-clinical-questions-DRAFT.md](./rule-04-unresolved-clinical-questions-DRAFT.md).

---

## 2. What is formally frozen (clinical specification documentation)

Under owner Option A (SAC-003 decision audit, 2026-08-06), the **Rule 4 clinical specification documentation bundle** on `main` is **owner-confirmed formally frozen**, meaning:

- **Q7** — **FULLY_RESOLVED** · decision closures **14/14 CLOSED** (`Q07C-CLOSE-D07` … `Q07C-CLOSE-D14`).
- **Q8–Q18** — each **CLOSED** · **OWNER_DECISION_RECORDED** · clinical bodies in the existing files govern design authority.
- **Q1–Q6** — early owner policy **Q01F–Q06C** recorded; clinical/policy text in those sections was **not rewritten** in the documentation-freeze pass.
- **5R-DRG** and **5R-SDG** — platform doctor-approval / no-follow-up-during-analysis gates as already recorded.
- **Documentation-freeze anchor commit:** `4c35469` (`docs(ehas2): freeze Rule 4 potency specification`).
- **Authoritative freeze statements** already present in existing files (header/footer **DOCUMENTATION FROZEN**, [rule-by-rule-implementation-status.md](../rule-by-rule-implementation-status.md) Rule 4 row, EOF **“Rule 4 documentation formally frozen: YES”** in owner-decisions).

**Frozen scope is documentation/specification text and closed decision IDs above — not runtime production, not pending thresholds listed in §4, not pending data assets in §5.**

---

## 3. Chronology — `NOT_FROZEN` vs final freeze markers

Markers must **not** be counted in isolation. Classification for readers and auditors:

| Marker / location | Classification | Current effect |
|-------------------|----------------|----------------|
| Filename suffix `*-DRAFT.md` | **FILENAME_METADATA** | Does **not** override explicit **DOCUMENTATION FROZEN** / **OWNER_APPROVED** headers and EOF formal-freeze statement. |
| Header **DOCUMENTATION FROZEN** · **OWNER_APPROVED** · **FROZEN** (potency-engine, owner-decisions, unresolved index) | **CURRENT_FINAL_STATUS** (documentation) | Primary freeze label for the specification bundle. |
| EOF **Rule 4 documentation formally frozen: YES** (owner-decisions) | **EXPLICIT_OWNER_APPROVAL** | Final documentation-freeze record for the bundle. |
| Mid-file **“Rule 4 remains NOT_FROZEN”** after each Q8–Q18 recording step | **HISTORICAL_INTERMEDIATE_STATUS** | Written **at the time** each question was appended, **before** the integrated documentation-freeze record. **Superseded for documentation-freeze meaning** by §2 and EOF — **does not reopen** Q8–Q18 clinical bodies. |
| Q7 block **“Rule 4 remains NOT_FROZEN”** adjacent to **14/14 CLOSED** | **CONTRADICTORY_CURRENT_EVIDENCE** (literal text) | Owner clarification: read as **runtime / whole-product implementation not frozen**, not as reopening Q7 closure. Documentation freeze in same file § Rule 4 documentation freeze and EOF governs spec status. |
| Q1–Q6 table / row metadata **wiring NOT_FROZEN** / **IMPLEMENTATION_PENDING** | **RUNTIME_IMPLEMENTATION_STATUS** | **Non-executable selector wiring** only; **Q7–Q18 closed contracts** govern potency runtime design authority per existing Q1–Q6 tranche note. |
| Per-question **NOT_IMPLEMENTED** on Q8–Q18 | **RUNTIME_IMPLEMENTATION_STATUS** | Expected; **does not** mean clinical questions are still open. |
| **`NOT_FROZEN`** on implementation field names (e.g. `temperament_preference_applied`, `pediatric_overlay_applied`, D13-G-OUT schema labels) | **IMPLEMENTATION_REPORT** / schema naming | Engineering labels **not frozen**; **does not** reopen closed clinical decision text. |
| **`EXACT_THRESHOLDS_NOT_FROZEN`**, **`OWNER_DECISION_PENDING`** on numeric ladder/threshold language | **See §4** | **Not** part of documentation-freeze confirmation until **separate** owner approval. |
| **`SEPARATE_*_FREEZE_PENDING`** data assets | **See §5** | **Not** documentation-freeze blockers; **not executable** until separate data/engineering freeze. |
| Phase 5R-4 shadow implementation reports / cross-phase validation | **TEST_EVIDENCE** / **PHASE_CLOSEOUT** | Validates shadow contracts; **does not** activate production or alter frozen clinical text. |

**Order of reading for SAC-003:** (1) this clarification, (2) existing freeze headers + unresolved index summary + EOF formal-freeze, (3) individual Q bodies unchanged, (4) treat mid-file **NOT_FROZEN** per table above.

---

## 4. Pending exact clinical thresholds (not frozen)

The following remain **explicitly not frozen** until **separate owner approval**. They **must not** be treated as closed or production-ready merely because the Q1–Q18 documentation bundle is frozen.

| ID | Topic | Source pointer (existing text only) | Owner status |
|----|-------|-------------------------------------|--------------|
| TH-01 | Owner potency-nature scale — **EXACT_THRESHOLDS_NOT_FROZEN** | [rule-04-owner-decisions-DRAFT.md](./rule-04-owner-decisions-DRAFT.md) § Owner potency nature | **Pending separate approval** |
| TH-02 | **D5 / D10 / D30 / D60** group — exact selection thresholds **OWNER_DECISION_PENDING** | Same file (Q7 / ladder sections) | **Pending separate approval** |
| TH-03 | **EXACT_LADDER_NOT_FROZEN** (e.g. Q4 owner direction — candidate only) | Same file (Q04F / NEGATIVE direction notes) | **Pending separate approval** |
| TH-04 | Legacy POSITIVE-ladder **D100/D200** forensic references marked **NOT_FROZEN** in Q7 notes | Same file (quarantined legacy — not executable) | **Not applicable to EHAS2 scale**; not owner-approved selectors |

No item in this table authorizes changing existing Q7–Q18 **clinical decision paragraphs** without a future owner-approved documentation change.

---

## 5. Pending data assets and source validation (not frozen)

These are **deferred engineering/data tracks** already registered in existing Rule 4 freeze metadata. They are **not** documentation-freeze blockers and remain **NOT_EXECUTABLE** until separately frozen and implemented.

| ID | Asset / flag | Source pointer |
|----|--------------|----------------|
| DA-01 | **`TIER3_PATHOLOGY_MAPPING_DATA_ASSET = SEPARATE_DATA_FREEZE_PENDING`** · **D14-L NOT_EXECUTABLE** | Owner-decisions deferred assets register; **Q07C-CLOSE-D14** |
| DA-02 | **`non_bp_critical_safety_catalog_status = SEPARATE_SAFETY_DATA_FREEZE_PENDING`** (Q16-H) | Same register; Q16-CLOSE |
| DA-03 | **`PHASE_MULTILINGUAL_TIMELINE_LEXICON = SEPARATE_FREEZE_PENDING`** (Q12-T) | Same register; Q12-CLOSE |
| DA-04 | **`SEVERITY_MULTILINGUAL_LEXICON = SEPARATE_FREEZE_PENDING`** (Q13-T) | Same register; Q13-CLOSE |
| DA-05 | **`LAB_VITAL_TO_SEVERITY_MAPPING = SEPARATE_FREEZE_PENDING`** (Q13-T) | Same register; Q13-CLOSE |
| DA-06 | Registry potency/selector audits — **`REGISTRY_*_AUDIT_PENDING`** / **`NOT_EXECUTABLE_AS_Q*_SELECTOR`** | Same register |
| DA-07 | **D13-G** administration dose — **`SOURCE_VALIDATION_PENDING`** (posology source validation; separate from **D13-C** potency overlay) | Owner-decisions **D13-G**; unresolved index **D13-G** row |

---

## 6. Four statuses (unchanged separation)

| Axis | Rule 4 status after this clarification |
|------|----------------------------------------|
| **A. Identity** | **Potency Engine** (Rule 4) — name consistent in frozen Rule 4 docs; constitution §D does not yet mirror Rules 1–3 spec links (product identity alignment remains a **separate** documentation task if desired). |
| **B. Clinical specification (documentation)** | **FORMALLY_FROZEN** (bundle per §2), with §4–§5 exclusions explicit. |
| **C. Implementation** | **VALIDATED_SHADOW** (Phases 1–10 shadow on `main` per phase reports); **not** production clinical evaluator. |
| **D. Production** | **NOT_CONNECTED** — default **`RULE4_ENGINE_MODE=off`**; no prescription issuance. |

---

## 7. SAC-003 resolution statement

**SAC-003** is **owner-resolved** by this clarification document for **documentation-freeze status**, without modifying underlying Rule 4 source files.

| Item | Resolution |
|------|------------|
| Stage A label **FREEZE_STATUS_CONFLICT** | Superseded for **owner governance** by §2–§3; Stage A audit files on `main` remain historical evidence. |
| Stage B | **Still not authorized** by this document alone (other Stage A blockers, e.g. SAC-001, and explicit Stage B approval remain). |
| Filename hygiene (`*-DRAFT.md`) | May be addressed in a **future documentation-only** PR **without** changing clinical rule meaning. |

---

## 8. Non-claims

This clarification does **not**:

- Activate Rule 4 in production or change `RULE4_ENGINE_MODE` behavior.
- Issue prescriptions or connect the public analyze API to live Rule 4 output.
- Freeze items in §4 (thresholds) or §5 (data assets).
- Approve Stage B, Phase 5D, or Rule 5 canonical identity (SAC-001).
- Modify legacy repository or desktop dirty checkouts.

---

## 9. Related pointers (unchanged files)

- [rule-04-potency-engine-DRAFT.md](./rule-04-potency-engine-DRAFT.md)  
- [rule-04-owner-decisions-DRAFT.md](./rule-04-owner-decisions-DRAFT.md)  
- [rule-04-unresolved-clinical-questions-DRAFT.md](./rule-04-unresolved-clinical-questions-DRAFT.md)  
- [rule-by-rule-implementation-status.md](../rule-by-rule-implementation-status.md)  
- [../phase-reports/PHASE_5R_4_RULE4_PHASES_1_TO_10_CROSS_PHASE_VALIDATION_REPORT.md](../../phase-reports/PHASE_5R_4_RULE4_PHASES_1_TO_10_CROSS_PHASE_VALIDATION_REPORT.md)

**END — SAC-003 clarification only**
