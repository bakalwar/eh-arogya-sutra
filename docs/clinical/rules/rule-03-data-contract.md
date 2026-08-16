# Rule 3 — Data Contract (Phase 5R-3F Freeze)

**Technical package:** synthetic shadow evaluator **IMPLEMENTED** (`@ehas2/rule3`; PR #104) — technical only
**Clinical/runtime integration:** **NOT_AUTHORIZED** / orchestration **NOT_CONNECTED** / activation **NONE**
**Authority:** OWNER-APPROVED field semantics (freeze body preserved)

**Current-facing package contract (schemas / outcomes / P-matrix):** [rule-03-organ-system-affinity-contract.md](./rule-03-organ-system-affinity-contract.md) (`ORGAN_SYSTEM_AFFINITY` · `R3_ID01_TO_ID05_RECOMMENDED_DECISIONS_APPROVED`). Post-merge technical evidence: [rule-03-organ-system-affinity-implementation-evidence.md](./rule-03-organ-system-affinity-implementation-evidence.md). This freeze document preserves **field-semantics examples** only; it is **not** by itself an orchestration/activation authority. Example scores / confidences are **non-normative**. Historical example organ-system labels are **not** a closed approved catalog (`R3-ID-05`).

Rule 3 technical package defines the shadow organ/system annotation envelope. **Clinical/runtime** consumption of Rule 3 as production Single Source of Truth remains **pending / not authorized**. Downstream engines must not treat this freeze as live SoT wiring. Rule 3 must not embed medicine IDs, potency, electricity, or dosage.

---

## Evidence item (required shape)

Each evidence row in `evidence_sources`:

```json
{
  "source": "CHIEF_COMPLAINT | REPORTED_SYMPTOM | AFFECTED_SITE | DOCTOR_DIAGNOSIS | VERIFIED_REPORT | VERIFIED_LOCAL_IMAGE | DISEASE_DATASET",
  "target_system": "RENAL",
  "target_organ_label": "Kidney / urinary tract",
  "verification_status": "VERIFIED | UNVERIFIED | LOW_CONFIDENCE_CANDIDATE",
  "confidence": 0.0,
  "provenance": {
    "finding_id": "optional-stable-id",
    "dataset_version": "optional",
    "detection_method": "anchor | keyword | hybrid | chief_complaint | co_involvement_candidate"
  },
  "matched_disease_ids": []
}
```

Report and photo findings **must not** appear only as concatenated free text in a global symptoms field.

---

## Resolved example (OWNER-APPROVED shape)

```json
{
  "rule_number": 3,
  "rule_name": "Organ-System Affinity Engine",
  "status": "RESOLVED",
  "active_systems": ["RESPIRATORY", "GASTRIC"],
  "candidate_systems": [],
  "primary_system": "RESPIRATORY",
  "secondary_systems": ["GASTRIC"],
  "systems": [
    {
      "system": "RESPIRATORY",
      "system_role": "PRIMARY",
      "score": 3.0,
      "confidence": 0.82,
      "detection_method": "chief_complaint",
      "verification_status": "VERIFIED",
      "doctor_review_required": false
    },
    {
      "system": "GASTRIC",
      "system_role": "SECONDARY",
      "score": 1.5,
      "confidence": 0.55,
      "detection_method": "keyword",
      "verification_status": "VERIFIED",
      "doctor_review_required": false
    }
  ],
  "evidence_sources": [],
  "unresolved_reason": null,
  "deterministic_fingerprint": "sha256:IMPLEMENTATION-PENDING",
  "prescription_issue_allowed": true,
  "doctor_review_required": false
}
```

---

## UNRESOLVED example (OWNER-APPROVED shape)

```json
{
  "rule_number": 3,
  "rule_name": "Organ-System Affinity Engine",
  "status": "UNRESOLVED",
  "active_systems": [],
  "candidate_systems": [
    {
      "system": "METABOLIC",
      "system_role": "CANDIDATE",
      "verification_status": "LOW_CONFIDENCE_CANDIDATE",
      "detection_method": "keyword",
      "doctor_review_required": true
    }
  ],
  "primary_system": null,
  "secondary_systems": [],
  "unresolved_reason": "INSUFFICIENT_ORGAN_SYSTEM_EVIDENCE",
  "deterministic_fingerprint": "sha256:IMPLEMENTATION-PENDING",
  "prescription_issue_allowed": false,
  "doctor_review_required": true
}
```

**Note:** `METABOLIC` may appear as **candidate** with low confidence — it must **not** auto-populate `active_systems`.

---

## Co-involvement candidate example

```json
{
  "system": "GASTRIC",
  "system_role": "CO_INVOLVEMENT_CANDIDATE",
  "verification_status": "LOW_CONFIDENCE_CANDIDATE",
  "detection_method": "co_involvement_candidate",
  "score": 1.0,
  "confidence": 0.35,
  "doctor_review_required": true,
  "evidence_sources": [
    {
      "source": "REPORTED_SYMPTOM",
      "target_system": "GASTRIC",
      "verification_status": "UNVERIFIED",
      "provenance": { "detection_method": "co_involvement_candidate" }
    }
  ]
}
```

Promotion to `active_systems` requires **independent** confirming evidence — **IMPLEMENTATION-PENDING** promotion rules.

---

## Prohibited fields in Rule 3 root payload

- `selected_medicines`
- `potency` / `dilution`
- `electricity` / `WE` / `RE` codes
- `dosage_drops`
- `mixture_plans`

---

## Cross-rule references

| Consumer | Uses Rule 3 fields |
|----------|-------------------|
| Rule 6 / disease planning | `primary_system`, `active_systems`, evidence |
| External engine | `active_systems` (when resolved) |
| Summary UI | Display-only; label **Rule 3 — Active Organ Systems** |

Rule 1 temperament fields **must not** be overwritten by Rule 3 and vice versa.
