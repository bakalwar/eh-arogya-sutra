# Rule 2 — Data Contract (Phase 5R-2F Freeze)

**Runtime:** IMPLEMENTATION-PENDING
**Authority:** OWNER-APPROVED field semantics

Rule 2 output is **per formula** (array element). Do **not** include `selected_potency`, `selected_electricity`, or `medicine_id` in Rule 2 payloads.

---

## Required separation

| Field | Meaning |
|-------|---------|
| `disease_polarity` | Observed / inferred disease polarity state for the slot |
| `required_therapeutic_polarity` | Law-of-opposites therapeutic direction for downstream engines |

These **must not** be collapsed into a single ambiguous `polarity` string.

---

## Resolved example (OWNER-APPROVED shape)

```json
{
  "formula_index": 0,
  "target_pathology": "DIGESTIVE_HYPER",
  "disease_state": "ACUTE_HYPER",
  "disease_polarity": "POSITIVE",
  "required_therapeutic_polarity": "NEGATIVE",
  "status": "RESOLVED",
  "evidence_sources": [],
  "confidence": null,
  "uncertainty_flags": [],
  "fallback_policy": null,
  "doctor_review_required": false,
  "mutates_mixtures": false
}
```

`confidence` may be non-null when implementation defines scoring — **IMPLEMENTATION-PENDING**.

---

## Unresolved example (OWNER-APPROVED shape)

```json
{
  "formula_index": 1,
  "target_pathology": "UNCERTAIN_TARGET",
  "disease_state": "UNRESOLVED",
  "disease_polarity": "UNRESOLVED",
  "required_therapeutic_polarity": "NEUTRAL",
  "status": "NEUTRAL_FALLBACK_PENDING_REVIEW",
  "evidence_sources": [],
  "confidence": null,
  "uncertainty_flags": ["INSUFFICIENT_SLOT_EVIDENCE"],
  "fallback_policy": "OWNER_APPROVED_NEUTRAL_FALLBACK",
  "doctor_review_required": true,
  "electricity_selection_status": "PENDING_ELECTRICITY_ENGINE",
  "potency_selection_status": "PENDING_POTENCY_ENGINE",
  "mutates_mixtures": false
}
```

`electricity_selection_status` / `potency_selection_status` are **cross-engine placeholders** — not Rule 2 selections.

---

## SUPPORT_ONLY example

```json
{
  "formula_index": 4,
  "target_pathology": "TEMPERAMENT_CONSTITUTION_SUPPORT",
  "disease_state": "SUPPORT",
  "disease_polarity": "SUPPORT_ONLY",
  "required_therapeutic_polarity": "NEUTRAL",
  "status": "RESOLVED_SUPPORT_ROLE",
  "doctor_review_required": false,
  "mutates_mixtures": false
}
```

---

## Case-level display (non-authoritative)

```json
{
  "case_polarity_summary": {
    "display_only": true,
    "headline": "Mixed formula-level polarities",
    "formula_count_unresolved": 1,
    "must_not_drive_selection": true
  },
  "formula_polarities": []
}
```

`formula_polarities` is the authoritative list for downstream **annotation consumers**; each consumer engine applies its own audited selection logic.

---

## Versioning (IMPLEMENTATION-PENDING)

Future payloads should include `rule_version` and `deterministic_fingerprint` aligned with product constitution §D.

---

## Legacy mapping notes (LEGACY-PROVEN — not EHAS2 contract)

| Legacy field | Note |
|--------------|------|
| `mixtures[].polarity` | Single string; mixed raw vs scoring coerce |
| `polarity_resolution` | Rich dict from policy engine — input to migration mapping only |

Mapping legacy → EHAS2 contract is **IMPLEMENTATION-PENDING** at integration time.
