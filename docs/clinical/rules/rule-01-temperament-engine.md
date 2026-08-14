# Rule 1 — Temperament Engine (Owner-Approved Specification)

**Status:** OWNER-APPROVED · **EHAS2 synthetic shadow:** **IMPLEMENTED** (`@ehas2/rule1` / `evaluateRule1Shadow`; PR #98; technical `READY_FOR_VALIDATION`; mappings **0**; catalog **NOT_CREATED**; orch **NOT_CONNECTED**; activation/influence/Rx **NONE**) · **Legacy:** LIVE_BUT_PARTIAL (forensic reference only)

**Current-facing evidence pointer (does not rewrite frozen body below):** [rule-01-temperament-engine-implementation-evidence.md](./rule-01-temperament-engine-implementation-evidence.md) · contract: [rule-01-temperament-engine-contract.md](./rule-01-temperament-engine-contract.md)

**Rule number:** 1
**Canonical name:** Temperament Engine
**Clinical authority:** OWNER_APPROVED_SPECIFICATION (Phase 5R-1F freeze)

Rule 1 infers **EH Temperament** (Mattei-style clinical temperament) from approved evidence. It supplies scored evidence to downstream engines. Rule 1 **must not** directly select disease, medicine, formula, potency, electricity, tablet, or external application.

---

## EH Temperament outputs (frozen enumeration)

| Output | Meaning |
|--------|---------|
| `LYMPHATIC` | Lymphatic temperament dominant |
| `SANGUINE` | Sanguine temperament dominant |
| `BILIOUS_HEPATIC` | Bilious / hepatic temperament dominant |
| `NERVOUS` | Nervous temperament dominant |
| `MIXED` | Resolved mixed temperament (see equal-tie and post–follow-up rules) |
| `UNKNOWN` | Insufficient evidence; no guess |

Legacy labels (`Lymphatic`, `Bilious`, etc.) are **LEGACY-PROVEN** naming only; EHAS2 contracts use the frozen uppercase tokens above unless a migration map is explicitly approved later.

---

## Rule result contract (target shape — IMPLEMENTATION-PENDING)

Future Rule 1 responses **must** eventually include these fields (documentation freeze; not required in runtime until implemented):

| Field | Role |
|-------|------|
| `primary_temperament` | Dominant EH temperament token |
| `secondary_temperament` | Subordinate temperament when defined |
| `mixed_components` | List of temperaments contributing to MIXED / tie state |
| `individual_scores` | Per-temperament evidence scores |
| `evidence_strength` | Aggregate strength classification |
| `supporting_evidence` | Structured supporting items |
| `conflicting_evidence` | Structured conflicting items |
| `confidence` | 0–1 or approved scale |
| `follow_up_questions` | Approved questions when unresolved |
| `resolution_status` | e.g. `OK`, `ADDITIONAL_INFORMATION_REQUIRED`, `FOLLOW_UP_REQUIRED` |
| `dosha_mapping` | Separate Tridosha view (see below) |
| `rule_version` | Semver of Rule 1 spec/engine |
| `deterministic_fingerprint` | Stable hash of inputs + rule version |

Align with product constitution versioning when wired.

---

## Temperament vs Tridosha (frozen separation)

- **EH Temperament** and **Tridosha mapping** are **separate typed fields**.
- Do **not** merge both into one ambiguous `prakriti` string.
- Ayurvedic dosha labels are **downstream presentation/mapping**, not substitutes for EH Temperament tokens.

### Frozen dosha mapping

| EH Temperament | `dosha_primary` | Notes |
|----------------|-----------------|-------|
| LYMPHATIC | KAPHA | — |
| SANGUINE | PITTA | — |
| NERVOUS | VATA | — |
| BILIOUS_HEPATIC | PITTA | `dosha_secondary` = evidence-based VATA, KAPHA, or UNRESOLVED |
| MIXED (two equal significant) | — | `dosha_classification` = **DWANDVAJA** |
| MIXED (three+ equal significant) | — | `dosha_classification` = **TRIDOSHAJA** |
| UNKNOWN | — | `dosha_mapping` = **UNKNOWN** |

**OWNER-CLARIFICATION-PENDING:** Evidence rules for Bilious secondary dosha (VATA vs KAPHA vs UNRESOLVED) are **not** defined in this phase.

---

## No-evidence rule (OWNER-APPROVED)

When sufficient clinical evidence is absent:

- `primary_temperament` = **UNKNOWN**
- `resolution_status` = **ADDITIONAL_INFORMATION_REQUIRED**

The engine **must not**:

- default to Lymphatic
- default to Mixed
- default to Balanced
- use dictionary / insertion order
- guess

It **must** request **owner-approved** additional clinical questions.

**OWNER-CLARIFICATION-PENDING:** Exact question bank requires later source audit and owner approval.

---

## Equal-tie rule (OWNER-APPROVED)

When two or more temperaments have **exactly equal score and equal evidence strength**:

- `primary_temperament` = **UNRESOLVED_TIE**
- `secondary_temperament` = **UNRESOLVED_TIE**
- `mixed_components` = all tied significant temperaments
- `resolution_status` = **FOLLOW_UP_REQUIRED**
- Two tied → `dosha_classification` = **DWANDVAJA**
- Three or more tied significant → `dosha_classification` = **TRIDOSHAJA**

The system asks **one approved direct follow-up question** to resolve the tie.

If no answer is supplied:

- `primary_temperament` = **MIXED**
- classification = **BALANCED_MIXED**

Dictionary, alphabetical, or insertion order **must never** select primary temperament.

**OWNER-CLARIFICATION-PENDING:** Follow-up question bank **NOT_DEFINED** until audited and owner-approved.

---

## BP supporting evidence (OWNER-APPROVED legacy weights)

| Condition | Effect |
|-----------|--------|
| Systolic BP ≥ 140 | SANGUINE supporting score **+3** |
| Systolic BP < 100 | LYMPHATIC supporting score **+2** |

BP is **supporting evidence only**. BP alone **must never** determine temperament.

At least **one separate, approved** symptom or clinical-observation evidence source is required before BP support can contribute to a **resolved** temperament.

No additional BP thresholds or medical conclusions are approved in this phase.

*(LEGACY-PROVEN source: `MultiDiseaseEngine.detect_prakriti` / `clinical_engines.detect_prakriti` BP branches — EHAS2 must implement owner rules above, not silent legacy tie-break.)*

---

## Photo rule (OWNER-APPROVED)

- Patient photo may provide **supporting observation only**.
- Photo alone **cannot** determine temperament.
- Do **not** use skin colour, general appearance, or ordinary face image as automatic temperament authority.

Future implementation requires (documentation only; **not activated** in 5R-1F):

- supported clinical image type
- consent
- image-quality validation
- bounded observation
- confidence
- source attribution
- doctor verification where required
- UNKNOWN / UNRESOLVED when unsupported

No image processing is activated in Phase 5R-1F.

---

## Clinical impact matrix (OWNER-APPROVED intended influence)

Rule 1 supplies **evidence** to downstream engines. Rule 1 alone **must not** directly select medicine, formula, potency, electricity, tablet, or external application.

| Downstream surface | Rule 1 intended influence |
|--------------------|---------------------------|
| Disease-based Formula 1 | **NO** direct Rule 1 selection effect |
| Formula 2 | **YES** — primary temperament evidence |
| Formula 3 | **YES** — secondary temperament / nervous-system evidence |
| Tablet Section A | **YES** — temperament as one scoring input |
| Tablet Section B | **YES** — temperament as one scoring input |
| External Application | **YES** — temperament as one complementary scoring input |
| Potency | **YES** — temperament as one scoring/modifier input |
| Electricity | **YES** — temperament as one scoring/modifier input |
| Summary | **YES** — display temperament, evidence, confidence, unresolved reason |

Exact downstream scoring weights are **IMPLEMENTATION-PENDING** until each consumer rule is forensically audited and owner-approved.

---

## No fixed medicine rule (OWNER-APPROVED)

Names such as L1, S1, A3, F1 discussed during clarification are **illustrative examples only**. They are **not** approved Formula 2 or Formula 3 medicines.

Future Formula 2 and Formula 3 selection **must** evaluate the complete canonical **38-medicine** pool (`ehas2-medicine-registry-v2`, CQ-001A).

No hardcoded temperament-to-medicine shortcut is approved.

---

## Separation from disease and final medicine selection

Rule 1 remains separate from:

- disease candidate ranking (Rule 3 / registry)
- final medicine selection (Rule 6 and confidence engines)

---

## References

- **Focused canonical contract (current identity/scope/schemas):** [rule-01-temperament-engine-contract.md](./rule-01-temperament-engine-contract.md) (`TEMPERAMENT_ENGINE`; `R1_ID01_TO_ID05_RECOMMENDED_DECISIONS_APPROVED`) — does **not** rewrite this frozen clinical body
- Owner decisions: [rule-01-owner-decisions.md](./rule-01-owner-decisions.md)
- Blood / Lymph governance addendum (R1-CP-Q2): [rule-01-blood-lymph-owner-decisions.md](./rule-01-blood-lymph-owner-decisions.md) — later owner-approved governance baseline only; **frozen temperament logic in this document is unchanged**; **no** runtime implementation or direct medicine-selection authority
- Evidence / workflow governance (R1-CP-Q3): [rule-01-q3-evidence-workflow-owner-decisions.md](./rule-01-q3-evidence-workflow-owner-decisions.md) — **Q3G-TIE** supersedes **future** interactive follow-up-question behavior on equal tie; frozen **historical body above remains preserved**; exact unresolved equal tie → **`UNRESOLVED_TIE`** (not MIXED/default); **no** code or runtime implementation authorized by the Q3 record
- Legacy conflicts rejected: [rule-01-legacy-conflicts.md](./rule-01-legacy-conflicts.md)
- Test requirements: [rule-01-test-requirements.md](./rule-01-test-requirements.md)
- Forensic audit artifacts: `%TEMP%\ehas2_rule1_forensic_audit\` (Phase 5R-1, read-only)
