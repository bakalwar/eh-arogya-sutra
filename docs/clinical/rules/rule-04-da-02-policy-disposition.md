# Rule 4 — DA-02 Fail-Closed Policy Disposition (Non-BP Critical Safety)

| Field | Value |
|-------|--------|
| **Classification** | **DOCUMENTATION_ONLY** — focused **DA-02 policy disposition** lock |
| **Rule number** | **4** (`POTENCY_ENGINE`) |
| **Data asset ID** | **DA-02** (`non_bp_critical_safety_catalog`) |
| **Authority token (this tranche)** | `R4_DA02_POLICY_DISPOSITION_ACCEPTED` |
| **Owner governance directive** | `ELECTROHOMEOPATHY_CLINICAL_RULES_REQUIRE_OWNER_APPROVAL_TECHNICAL_ENGINEERING_DELEGATED` |
| **Parent identity/status contract** | [rule-04-potency-engine-canonical-status-contract.md](./rule-04-potency-engine-canonical-status-contract.md) |
| **TH fail-closed dispositions** | [rule-04-th-01-to-th-04-fail-closed-dispositions.md](./rule-04-th-01-to-th-04-fail-closed-dispositions.md) (unchanged by this document) |
| **DA-06 disposition** | [rule-04-da-06-non-selector-quarantine-disposition.md](./rule-04-da-06-non-selector-quarantine-disposition.md) (unchanged by this document) |
| **SAC-003 Limited Freeze** | Unchanged — this document does **not** freeze or populate catalog rows / numeric thresholds |
| **Canonical `origin/main` base (this documentation tranche)** | `299074e5742f554b710a694a17024d0865786f98` |
| **Paid services** | `NO_PAID_API_SERVICE_DEPENDENCY_OR_CERTIFICATE` |

**Read-only authority sources (not amended here):**

- [rule-04-SAC-003-freeze-clarification.md](./rule-04-SAC-003-freeze-clarification.md) §5 DA-02 row
- [rule-04-owner-decisions-DRAFT.md](./rule-04-owner-decisions-DRAFT.md) deferred assets register · **Q16-H** / **Q16-CLOSE** · **Q06C** · **Q13-N** / DA-05
- [rule-04-potency-engine-DRAFT.md](./rule-04-potency-engine-DRAFT.md)
- [rule-04-unresolved-clinical-questions-DRAFT.md](./rule-04-unresolved-clinical-questions-DRAFT.md)
- [rule-04-th-01-to-th-04-fail-closed-dispositions.md](./rule-04-th-01-to-th-04-fail-closed-dispositions.md)

This document records the **owner-accepted fail-closed policy disposition for DA-02 only** (decisions **D1–D10**). It does **not** approve any lab/vital/imaging entry, numeric value, unit conversion, age/sex cutoff, reference range, or action-binding row; does **not** invent thresholds; does **not** amend Q1–Q18 or TH dispositions; does **not** authorize clinical selection, orchestration, activation, or production Rx.

---

## 1. Documentation-only classification

| This document is | This document is not |
|------------------|----------------------|
| Fail-closed **policy disposition** for DA-02 patient-wide non-BP critical safety | A populated / validated clinical catalog |
| Lock of purpose, authority order, phase-1 posture, actions, and fail-closed behavior | Approval of any class membership, analyte, finding, or numeric band |
| Acceptance of **future** minimum field-group requirements | An executable schema / field contract freeze |
| Separation of DA-02 safety from DA-05 severity and from Q06C BP crisis | Package / evaluator / test / metadata edits |

**Policy disposition ≠ catalog freeze. Field-group acceptance ≠ executable schema. Illustrative class examples ≠ approved membership.**

**Contract flag (unchanged by this tranche):** `non_bp_critical_safety_catalog_status = SEPARATE_SAFETY_DATA_FREEZE_PENDING`  
**Numeric / catalog runtime:** **NOT_EXECUTABLE** until a **separate** owner evidence freeze + authorization.

---

## 2. Authority precedence

1. Permanent directive: `ELECTROHOMEOPATHY_CLINICAL_RULES_REQUIRE_OWNER_APPROVAL_TECHNICAL_ENGINEERING_DELEGATED`
2. This tranche’s accepted disposition **R4-DA-02** (`R4_DA02_POLICY_DISPOSITION_ACCEPTED`)
3. Prior DA-06 non-selector quarantine disposition (registry potency/selector — orthogonal)
4. Prior TH fail-closed dispositions **R4-TH-01…R4-TH-04**
5. Prior identity/status lock **R4-ID-01…R4-ID-07**
6. SAC-003 Limited Freeze clarification (Q1–Q18 frozen; DA assets excluded from clinical-selection freeze until separately authorized)
7. Existing frozen Q1–Q18 clinical decision bodies (**byte-identical**; not rewritten here) — especially **Q16-H**, **Q06C**, **Q13-N** / DA-05 pointers
8. Existing Phase 1–10 shadow implementation / quarantine reason codes (technical evidence only)

Lower-authority sources must **not** invent DA-02 numeric thresholds, promote inferred/OCR/keyword panic, or merge DA-02 into potency/severity selection.

---

## 3. Accepted fail-closed policy (R4-DA-02 · D1–D10)

### D1 — Limited purpose

| Item | Disposition |
|------|-------------|
| **Purpose** | Patient-wide **non-BP critical safety** only |
| **Allowed outcomes** | **ESCALATE** · **HOLD** · **DOCTOR_REVIEW** |
| **Prohibited** | Diagnosis · severity selection · potency / dilution · medicine · formula · Rx selection or issuance authority |

### D2 — Future eligibility principles (not membership approval)

| Item | Disposition |
|------|-------------|
| **In-principle future families** | Lab classes · **non-BP** vital classes · controlled imaging/report finding classes |
| **Status of examples** | Any examples used in prior proposals are **illustrative only** |
| **Approved now** | **None** — no class, analyte, finding, or catalog membership is approved by this document |

### D3 — Authority order

| Rank | Authority |
|------|-----------|
| **1 (highest among these)** | **Q06C** BP crisis (outside DA-02; see D7) |
| **2** | Verified **source-declared** critical / life-threatening / urgent structured flags |
| **3** | Existing **frozen red-flag enums** (e.g. Q3F / Q4F classes already recorded) |
| **4 (future only)** | Separately **owner-frozen** DA-02 **numeric** catalog rows |
| **Prohibited** | Inferred · OCR · keyword · “panic by substring” thresholds |

### D4 — Phase-1 posture

| Item | Disposition |
|------|-------------|
| **Phase-1** | **Flags-only** (source-declared critical flags + existing frozen red-flag enums + Q06C) |
| **All DA-02 numeric thresholds** | **Pending** until separate evidence freeze · **non-executable** now |

### D5 — Minimum field groups (future schema requirements only)

Accepted as **future** requirements for any later schema/catalog freeze (not frozen here):

- identity / versioning (`catalog_entry_id`, `version`, evidence-freeze identity)
- class family (lab \| vital_non_bp \| imaging_finding) — membership still empty
- `unit` (required if a future numeric row exists)
- age / sex / context applicability
- reference-range **policy pointer** (not an invented range in this tranche)
- source citation · licensing · PHI / de-identification handling
- `action_semantics` ∈ {ESCALATE, HOLD, DOCTOR_REVIEW}
- doctor-review fields · stale / expiry policy

**Not frozen here:** executable schema · field contract · populated catalog.

### D6 — Mandatory actions on qualifying safety signals

| Item | Disposition |
|------|-------------|
| **On qualifying critical / life-threatening / urgent safety signal** | Patient-wide **HOLD** **and** **DOCTOR_REVIEW** are **mandatory** |
| **ESCALATE** | Also required according to urgency (urgent pathway / notice) |
| **Prohibited** | Issuing or continuing potency / prescription issuance on escalation notice alone |

### D7 — Q06C separation

| Item | Disposition |
|------|-------------|
| **Q06C BP crisis** | **Separate** from DA-02 · **higher priority** · **independently enforceable** |
| **DA-02 must not** | Redefine, duplicate, soften, or absorb Q06C BP crisis bands |

### D8 — DA-05 separation and overlap

| Item | Disposition |
|------|-------------|
| **DA-02** | Patient-wide **safety** (hold / escalate / review) |
| **DA-05** | Separate freeze · lab/vital-to-**severity** mapping (potency path) — unchanged / still pending |
| **Overlap** | Separate mappings; a **safety hold suppresses** severity / potency processing |
| **Prohibited** | DA-05 clearing a DA-02 or Q06C hold |

### D9 — Fail-closed unresolved / absent paths

| Condition | Required behavior |
|-----------|-------------------|
| Missing / unknown unit (numeric path) | **No** threshold inference · **no** unit imputation · **no** false safety-clear |
| Conflicting sources (safety-relevant) | **HOLD** + **DOCTOR_REVIEW** · append-only audit · **no** auto “worse/better” pick |
| Stale safety data | **Not** crisis-comparable by default · no silent reuse as clear |
| Absent catalog / freeze-pending | **No** inferred panic · flags + Q06C + frozen red-flag enums only |

### D10 — Provenance and owner approval for future rows

Every **future** catalog row requires: evidence provenance · licensing clearance · PHI / de-identification policy · versioned evidence freeze · **explicit owner approval**. No paid API dependency for threshold harvest or translation.

---

## 4. What this tranche does not approve

This document does **not** approve:

- Any actual lab, non-BP vital, or imaging/report **entry**
- Any **numeric** panic / crisis / threshold **value**
- Any unit conversion table · age/sex cutoff · reference range · action-binding **row**
- Closing `SEPARATE_SAFETY_DATA_FREEZE_PENDING` with data
- Executable DA-02 catalog runtime

---

## 5. Relationship to Q16-H / Q06C / DA-05 / SAC-003

| Axis | Posture after this disposition |
|------|--------------------------------|
| **Q16-H** | Policy disposition **aligns** with recorded “until frozen → flags + Q06C + frozen red flags only”; does **not** rewrite Q16-CLOSE body |
| **Q06C** | Remains separate, higher-priority BP crisis authority (D7) |
| **DA-05 / Q13-N** | Remains separate severity-mapping freeze (D8) |
| **SAC-003 DA-02 row** | Remains Limited Freeze register pointer; this document adds **fail-closed policy vocabulary** without amending SAC-003 text |
| **Q1–Q18 bodies** | **Unchanged** (byte-identical) |
| **Other DAs** | **Unchanged** — not populated / not executable here |

---

## 6. Non-claims and continuing STOP

This document does **not** authorize:

- Creating, populating, or validating a DA-02 catalog or numeric threshold set
- Treating illustrative class examples as approved membership
- Freezing an executable schema / field contract from D5 field groups alone
- Inferred / OCR / keyword panic thresholds
- Diagnosis, severity, potency, medicine, formula, or Rx authority from DA-02
- Absorbing or softening **Q06C** BP crisis into DA-02
- Letting **DA-05** clear DA-02 / Q06C holds
- Amending Q1–Q18 or TH disposition bodies
- `packages/rule4` / `@ehas2/rule4` creation
- evaluator / test / metadata / `nineRules.ts` edits
- Rule 3 live evaluator coupling
- orchestration / env-mode / `active` mode / activation
- medicine / formula / potency / Rx production authority
- C3E / protected access / paid APIs / legacy mutation / deployment

**STOP** before all of the above.

---

## 7. Future work requiring separate authorization

1. Optional docs hygiene / status-surface pointers to this DA-02 disposition (`PATH_EXPANSION_REQUIRED` if desired)
2. Evidence pack + owner freeze for any **first** DA-02 numeric / membership rows (provenance · license · PHI · version)
3. Executable schema / field-contract freeze implementing D5 groups
4. DA-05 (and other DA) tracks — separate authorizations
5. Orchestration / activation / production reviews

---

## Status tokens (current)

- `RULE4_DA02_POLICY_DISPOSITION_DOCUMENTED`
- `RULE4_DA02_PATIENT_WIDE_NON_BP_CRITICAL_SAFETY_ONLY`
- `RULE4_DA02_FLAGS_ONLY_PHASE1_NUMERICS_PENDING`
- `RULE4_DA02_NO_CATALOG_MEMBERSHIP_OR_NUMERIC_APPROVED`
- `RULE4_DA02_HOLD_AND_DOCTOR_REVIEW_MANDATORY_ON_QUALIFYING_SIGNAL`
- `RULE4_DA02_Q06C_SEPARATE_HIGHER_PRIORITY`
- `RULE4_DA02_DA05_SEPARATE_SAFETY_SUPPRESSES_SEVERITY`
- `RULE4_DA02_FAIL_CLOSED_NO_THRESHOLD_INFERENCE`
- `RULE4_DA02_NO_CLINICAL_SELECTION_OR_RX_AUTHORITY`
- `NO_PAID_API_SERVICE_DEPENDENCY_OR_CERTIFICATE`
