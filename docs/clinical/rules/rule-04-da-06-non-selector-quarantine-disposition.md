# Rule 4 — DA-06 Fail-Closed Disposition (Non-Selector Quarantine)

| Field | Value |
|-------|--------|
| **Classification** | **DOCUMENTATION_ONLY** — focused **DA-06 disposition** lock |
| **Rule number** | **4** (`POTENCY_ENGINE`) |
| **Data asset ID** | **DA-06** |
| **Authority token (this tranche)** | `R4_DA06_NON_SELECTOR_QUARANTINE_DISPOSITION_ACCEPTED` |
| **Owner governance directive** | `ELECTROHOMEOPATHY_CLINICAL_RULES_REQUIRE_OWNER_APPROVAL_TECHNICAL_ENGINEERING_DELEGATED` |
| **Parent identity/status contract** | [rule-04-potency-engine-canonical-status-contract.md](./rule-04-potency-engine-canonical-status-contract.md) |
| **TH fail-closed dispositions** | [rule-04-th-01-to-th-04-fail-closed-dispositions.md](./rule-04-th-01-to-th-04-fail-closed-dispositions.md) (unchanged by this document) |
| **SAC-003 Limited Freeze** | Unchanged — this document does **not** freeze or populate DA-01…DA-05 / DA-07 |
| **Canonical `origin/main` base (this documentation tranche)** | `5af30eac293fe3bdc44111c1729068b0207763f3` |
| **Paid services** | `NO_PAID_API_SERVICE_DEPENDENCY_OR_CERTIFICATE` |

**Read-only authority sources (not amended here):**

- [rule-04-SAC-003-freeze-clarification.md](./rule-04-SAC-003-freeze-clarification.md) §5 DA-06 row
- [rule-04-owner-decisions-DRAFT.md](./rule-04-owner-decisions-DRAFT.md) deferred assets register · `REGISTRY_*_AUDIT_PENDING` / `NOT_EXECUTABLE_AS_Q*_SELECTOR`
- [rule-04-potency-engine-DRAFT.md](./rule-04-potency-engine-DRAFT.md)
- [rule-04-unresolved-clinical-questions-DRAFT.md](./rule-04-unresolved-clinical-questions-DRAFT.md)
- [rule-04-th-01-to-th-04-fail-closed-dispositions.md](./rule-04-th-01-to-th-04-fail-closed-dispositions.md)

This document records the **owner-accepted fail-closed disposition for DA-06 only**. It does **not** delete, rewrite, or promote medicine-registry content; does **not** invent thresholds; does **not** amend Q1–Q18 or TH dispositions; does **not** authorize clinical selection, orchestration, activation, or production Rx.

---

## 1. Documentation-only classification

| This document is | This document is not |
|------------------|----------------------|
| Fail-closed **NON_SELECTOR_QUARANTINE** lock for DA-06 | Clinical validation |
| Permanent ban on legacy registry potency/selector authority | Deletion of registry files/fields |
| Separation of historical/forensic retention from Rule 4 SoT | Population of DA-01…DA-05 / DA-07 |
| Gate for any future Rule 4 selector asset | Reuse of existing `potency_logic` as that future asset |
| Disposition vocabulary for DA-06 | Package / evaluator / test / metadata edits |

**Disposition lock ≠ clinical-selection authority. Registry file presence ≠ approved Rule 4 selector asset.**

---

## 2. Authority precedence

1. Permanent directive: `ELECTROHOMEOPATHY_CLINICAL_RULES_REQUIRE_OWNER_APPROVAL_TECHNICAL_ENGINEERING_DELEGATED`
2. This tranche’s accepted disposition **R4-DA-06** (`R4_DA06_NON_SELECTOR_QUARANTINE_DISPOSITION_ACCEPTED`)
3. Prior TH fail-closed dispositions **R4-TH-01…R4-TH-04**
4. Prior identity/status lock **R4-ID-01…R4-ID-07**
5. SAC-003 Limited Freeze clarification (Q1–Q18 frozen; DA assets excluded from clinical-selection freeze until separately authorized)
6. Existing frozen Q1–Q18 clinical decision bodies (**byte-identical**; not rewritten here)
7. Existing Phase 1–10 shadow implementation / quarantine reason codes (technical evidence only)
8. Historical medicine-registry / legacy labels (non-authoritative for Rule 4 selection)

Lower-authority sources must **not** override this quarantine or promote legacy `potency_logic`.

---

## 3. Accepted fail-closed disposition (R4-DA-06)

| Item | Disposition |
|------|-------------|
| **Asset** | Existing **medicine-registry** `potency_logic` fields and related legacy potency/selector strings |
| **Status** | Permanent **`NON_SELECTOR_QUARANTINE`** |
| **Clinical-selection authority** | **None** |
| **Evidence / SoT authority** | **None** for Rule 4 |
| **Threshold / ladder / fallback authority** | **None** |
| **Activation / Rx authority** | **None** |
| **File/field retention** | **Retained** for historical / forensic / compatibility only — **not** deleted, rewritten, or promoted in this tranche |
| **Future Rule 4 selector asset** | Only via **separate** owner-approved schema, version, validated evidence, and **separate authorization** — **must not** reuse the existing `potency_logic` field |

---

## 4. Quarantine boundary (what is covered)

Covered by this disposition (non-exhaustive of historical aliases, but authoritative for Rule 4 reading):

- `packages/medicine-registry` medicine entries’ **`potency_logic`** (and equivalent legacy potency/selector string fields)
- Related registry / historical formula shortcuts already tagged in Rule 4 docs as **`REGISTRY_*_AUDIT_PENDING`** / **`NOT_EXECUTABLE_AS_Q*_SELECTOR`**
- Any attempt to treat the above as Rule 4 cascade input, corroboration, confidence multiplier, or silent fallback

**Not covered / not changed by this document:**

- DA-01…DA-05 and DA-07 tracks (remain pending / not executable as previously recorded)
- Q1–Q18 clinical bodies
- TH-01…TH-04 fail-closed dispositions
- Medicine-registry **file contents** (no rewrite/delete/promote here)
- Rule 4 package/evaluator/tests, Rule 3 binding, orchestration, activation, Rx implementation

---

## 5. Retention vs authority (fail-closed reading)

| Surface | Allowed reading | Prohibited reading |
|---------|-----------------|--------------------|
| Existing registry files/fields | Historical / forensic / compatibility retention | Rule 4 evidence, SoT, threshold, ladder, fallback, clinical selector |
| Shadow quarantine reason codes | Technical fail-closed enforcement evidence | Proof that registry content is clinically validated |
| Future selector asset | New schema + version + validated evidence + separate owner authorization | Reuse or “promotion” of existing `potency_logic` |

**Presence of `medicines.v1.json` / `medicines.v2.json` (or similar) does not create Rule 4 clinical authority.**

---

## 6. Relationship to SAC-003 / TH-02

| Axis | Posture after this disposition |
|------|--------------------------------|
| SAC-003 DA-06 row | Remains the Limited Freeze register pointer; this document adds **fail-closed disposition vocabulary** without amending SAC-003 text |
| Q1–Q18 bodies | **Unchanged** (byte-identical) |
| TH-02 DA dependency list | DA-06 disposition **satisfies the fail-closed quarantine decision** for legacy registry selectors; it does **not** by itself close TH-02 (DA-01/03/04/05 + naming + Q7↔SAC-003 reconciliation remain) |
| DA-01…DA-05 / DA-07 | **Unchanged** — still not populated / not executable here |

---

## 7. Non-claims and continuing STOP

This document does **not** authorize:

- Deleting, rewriting, or promoting medicine-registry files or `potency_logic` fields
- Treating legacy registry strings as Rule 4 evidence, SoT, threshold, ladder, fallback, selector, activation, or Rx authority
- Reusing `potency_logic` as a future Rule 4 selector asset
- Inventing / approving numeric thresholds
- Creating/populating/validating DA-01…DA-05 or DA-07
- Q1–Q18 or TH disposition body changes
- `packages/rule4` / `@ehas2/rule4` creation
- evaluator / test / metadata / `nineRules.ts` edits
- Rule 3 live evaluator coupling
- orchestration / env-mode / `active` mode / activation
- medicine / formula / potency / Rx production authority
- C3E / protected access / paid APIs / legacy mutation / deployment

**STOP** before all of the above.

---

## 8. Future work requiring separate authorization

1. Optional docs hygiene / status-surface pointers to this DA-06 disposition (`PATH_EXPANSION_REQUIRED` if desired)
2. Any **new** Rule 4 selector data asset (new schema · version · validated evidence · owner freeze) — **must not** reuse `potency_logic`
3. DA-01 / DA-02 / DA-03 / DA-04 / DA-05 / DA-07 acquisition or freeze tracks
4. TH-02 reconciliation after remaining DA + naming gates
5. Metadata drift fix (`affectsClinicalSelection: true` → canonical `false`)
6. Orchestration / activation / production reviews

---

## Status tokens (current)

- `RULE4_DA06_NON_SELECTOR_QUARANTINE_DISPOSITION_DOCUMENTED`
- `RULE4_DA06_POTENCY_LOGIC_PERMANENT_NON_SELECTOR_QUARANTINE`
- `RULE4_DA06_REGISTRY_RETENTION_HISTORICAL_FORENSIC_ONLY`
- `RULE4_DA06_NO_POTENCY_LOGIC_REUSE_FOR_FUTURE_SELECTOR_ASSET`
- `RULE4_DA06_NO_CLINICAL_SELECTION_OR_RX_AUTHORITY`
- `RULE4_DA01_TO_DA05_AND_DA07_UNCHANGED_BY_THIS_TRANCHE`
- `NO_PAID_API_SERVICE_DEPENDENCY_OR_CERTIFICATE`
