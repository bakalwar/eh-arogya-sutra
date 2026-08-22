# Rule 1 — Bilious Batch 1 Owner Approval Freeze

| Field | Value |
|-------|--------|
| **Authority** | Dr. Ghanshyam Bakalwar — APPROVED_OWNER_FREEZE |
| **Document class** | Append-only owner decision record |
| **Canonical base** | `0737de14f77685430fb88aa713f0f2fc45d01945` |
| **Runtime activation** | **NONE** — documentation/review only |
| **Machine docket** | [rule-01-keyword-row-clinical-review-docket.csv](./rule-01-keyword-row-clinical-review-docket.csv) |

This document records owner-approved **Bilious Batch 1** row dispositions and the common **0/1/2/3** weight scale. It does **not** activate Rule 1 runtime, set `clinically_used=true`, or grant medicine-selection influence.

---

## Common weight scale

**Approval token:** `OWNER-FREEZE-R1-TEMPERAMENT-WEIGHT-SCALE-v1`

```text
RULE1_TEMPERAMENT_FEATURE_WEIGHT_SCALE_V1

0 = ZERO_NO_DIRECT_SCORE
1 = LOW_CONTEXTUAL
2 = MODERATE_ACCEPTED_FEATURE
3 = HIGH_OBJECTIVE_SIGN
```

### Frozen scale rules

1. Weight **0**: disease name alone · organ name alone · bare color term · ambiguous term · negated feature · unaccepted/unverified context
2. Weight **1**: accepted contextual feature · clinically relevant but weak/indirect Bilious evidence
3. Weight **2**: clear accepted patient-specific symptom · adequately normalized and context-bound
4. Weight **3**: accepted objective clinical sign · explicitly normalized and anatomically bound
5. One normalized concept contributes at most once
6. Hindi/English synonyms do not double-score
7. Repeated mentions do not multiply the score
8. Negation contributes zero
9. Disease and organ labels do not directly score
10. Contradictory evidence remains doctor-visible
11. Percentages generated only from sufficient, non-contradictory accepted evidence
12. Rule 1 does not diagnose or select medicine
13. Owner-approved Electrohomeopathy / **Count Mattei** doctrinal decision-support scale — not claimed as universally conventionally scientifically validated

**Legacy vs owner:** `verified_legacy_weight=2` in the CSV remains **forensic legacy evidence only** (`detect_prakriti` @ `b9ec3f6`). `owner_approved_weight` is the owner-frozen EHAS2 value.

---

## Icterus deduplication rule (owner-approved)

Normalized concept:

```text
SCLERAL_OR_CUTANEOUS_ICTERUS_SIGN
OWNER_APPROVED_WEIGHT = 3
```

Applies when clinician accepts objective scleral or cutaneous icterus with explicit anatomical target.

**Raw keywords score zero:**

- `jaundice` (disease label)
- `yellow` (bare color)
- `pila` (raw colloquial)

**Deduplication:** one icterus concept contributes **once** maximum per case evaluation regardless of which surface form triggered normalization.

**Medical evaluation:** jaundice/accepted icterus may also require separate medical-evaluation/safety pathway; temperament scoring is **not** a substitute for diagnosis or referral.

---

## Bilious Batch 1 freeze

**Batch token:** `OWNER-FREEZE-R1-BILIOUS-BATCH1-v1`

```text
RULE1_BILIOUS_BATCH1_STATUS = OWNER_APPROVED

ROWS_REVIEWED = 8
APPROVED_AFTER_NORMALIZATION = 2
CONTEXT_ONLY = 2
MOVED_TO_R3 = 1
SPLIT = 2
QUARANTINED = 1
DIRECT_RAW_KEYWORD_APPROVAL_WITHOUT_CONTEXT = 0
```

| Row ID | Keyword | Owner decision | Owner weight | Token |
|--------|---------|----------------|--------------|-------|
| R1-KW-0001 | acidity | APPROVE_AFTER_NORMALIZATION | 2 | `OWNER-APPROVE-R1-KW-0001-v1` |
| R1-KW-0002 | bile | CONTEXT_ONLY | 1 | `OWNER-APPROVE-R1-KW-0002-v1` |
| R1-KW-0003 | jaundice | CONTEXT_ONLY | 0 (icterus sign **3** separate) | `OWNER-APPROVE-R1-KW-0003-v1` |
| R1-KW-0004 | liver | MOVE_TO_R3 | 0 | `OWNER-APPROVE-R1-KW-0004-v1` |
| R1-KW-0005 | liver dard | APPROVE_AFTER_NORMALIZATION | 2 | `OWNER-APPROVE-R1-KW-0005-v1` |
| R1-KW-0006 | pila | SPLIT | 0 | `OWNER-APPROVE-R1-KW-0006-v1` |
| R1-KW-0007 | pitta | QUARANTINE | 0 | `OWNER-APPROVE-R1-KW-0007-v1` |
| R1-KW-0008 | yellow | SPLIT | 0 (icterus sign **3** separate) | `OWNER-APPROVE-R1-KW-0008-v1` |

---

## Pending child concepts (not approved in this batch)

Raw `pila` and bare `yellow` require future owner-approved controlled concepts, e.g.:

- scleral icteric appearance
- cutaneous icteric appearance
- urine color
- stool color
- tongue coating
- discharge color

**No child-concept rows were added in this tranche.**

---

## Coverage and batch posture

- Bilious coverage gaps (appetite, nausea, stool, chronicity, severity, etc.) remain **open**
- Sanguine / Lymphatic / Nervous batches remain **pending** (29 rows unapproved)
- 116,284-row disease DB remains **unauthorized** as temperament authority
- No universal diagnostic accuracy claim

---

## Status tokens

- `RULE1_BILIOUS_BATCH1_OWNER_APPROVED_DOCUMENTATION_ONLY`
- `RULE1_WEIGHT_SCALE_V1_OWNER_FROZEN`
- `RULE1_CLINICAL_ACTIVATION_NONE`
- `RULE1_MEDICINE_SELECTION_INFLUENCE_NONE`
- `RULE1_RUNTIME_NOT_CONNECTED`
