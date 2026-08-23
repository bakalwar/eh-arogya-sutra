# Rule 1 — Lymphatic Batch 3 Owner Approval Freeze

| Field | Value |
|-------|--------|
| **Authority** | Dr. Ghanshyam Bakalwar — APPROVED_OWNER_FREEZE |
| **Document class** | Append-only owner decision record |
| **Canonical base** | `01cc71c64dcceb8726873d1f3229c04557ff7e46` |
| **Runtime activation** | **NONE** — documentation/review only |
| **Machine docket** | [rule-01-keyword-row-clinical-review-docket.csv](./rule-01-keyword-row-clinical-review-docket.csv) |
| **Weight scale** | Reuses frozen `OWNER-FREEZE-R1-TEMPERAMENT-WEIGHT-SCALE-v1` (do **not** create a second scale token) |

This document records owner-approved **Lymphatic Batch 3** row dispositions. It does **not** activate Rule 1 runtime, set `clinically_used=true`, grant diagnosis authority, or grant medicine-selection influence.

---

## Batch-wide raw-keyword policy

```text
RULE1_LYMPHATIC_BATCH3_RAW_KEYWORD_POLICY =
ALL_RAW_LEGACY_KEYWORDS_WEIGHT_ZERO
```

1. Raw substring keywords do not score.
2. Only normalized, context-bound concepts may score.
3. One normalized concept contributes once.
4. Repeated words/synonyms do not multiply score.
5. R2/R3 routing does not automatically add Rule 1 score.
6. Structured measurements take precedence over raw text.
7. Negation/history-only/unaccepted evidence scores zero.
8. Red-flag pathways operate independently.
9. Temperament score does not replace diagnosis, referral, or treatment.
10. Rule 1 does not select medicine.

**Legacy vs owner:** CSV `verified_legacy_weight=2` remains **forensic evidence only**. All eleven raw Lymphatic rows have `owner_approved_weight=0`.

---

## Deduplication freezes

### Thermal (cold)

```text
cold + thanda
→ one TARGET_BOUND_COLD_THERMAL_FEATURE contribution
```

### Bowel

```text
constipation + kabz
→ one ACCEPTED_CURRENT_CONSTIPATION_SYMPTOM contribution
```

### Body habitus

```text
motapa + obesity
→ at most one ACCEPTED_BODY_HABITUS_OBSERVATION contribution
(disease/body label alone = 0; no BMI threshold invented here)
```

### Edema / swelling

```text
sujan + swelling
→ one SITE_AND_CONTEXT_BOUND_EDEMA_OR_SWELLING contribution
```

### Low BP

```text
raw low-bp text + structured systolic BP + R2 + R3
→ at most one Rule 1 structured low-BP contribution
(and only when an independent accepted non-BP Lymphatic feature is also present)
```

Distinct accepted clinical concepts may contribute separately, but the **same underlying evidence must never be counted twice**.

---

## Structured low-BP support rule (owner-approved)

```text
VALIDATED_STRUCTURED_SYSTOLIC_BP < 100
RULE1_LYMPHATIC_WEIGHT = 2
MAX_CONTRIBUTIONS_PER_CASE = 1
REQUIRES_INDEPENDENT_ACCEPTED_NON_BP_LYMPHATIC_FEATURE = true
```

Requirements:

- Valid structured numeric systolic in mmHg
- Current measurement context
- Malformed/missing fails closed
- Structured value overrides raw “low bp” / historical hypotension label (raw text alone = 0)
- Historical “low BP” label alone = 0
- Repeated measurements do not multiply contribution
- No R2/R3 duplicate Rule 1 score
- Diastolic Rule 1 weight **not** frozen
- **Gate:** structured low BP contributes **only if** at least one independent accepted non-BP Lymphatic feature is already present for the case
- Hypotension with syncope, shock, bleeding, dehydration, pregnancy, sepsis, or medication effect remains on a **separate** safety/clinical pathway

This is owner-approved Electrohomeopathy doctrinal temperament support — **not** a standalone hypotension diagnostic rule.

---

## Approved normalized concepts (documentation rules — not CSV child rows)

| Normalized concept | Weight | Notes |
|--------------------|-------:|-------|
| Accepted subjective cold tendency | 1 | Shared cold+thanda; not weather/food/URI “cold” |
| Accepted cold intolerance or observed cold skin | 2 | Shared cold+thanda; fever/infection not auto |
| Validated measured hypothermia / low body temperature | 3 | Measurement-gated; extreme values → safety |
| Accepted current constipation symptom | 2 | Shared constipation+kabz |
| Contextual chronic/recurrent constipation | 1 | Optional; obstruction signs → safety |
| Accepted clinician-documented body-habitus observation | 1 | Shared motapa+obesity path; **not** obesity Dx alone; **no BMI threshold invented** |
| Accepted site-bound edema or swelling | 2 | Shared sujan+swelling; character/site required |
| Accepted site-bound pathological discharge | 2 | Not color-only; physiological discharge = 0; GYNE/R3 ownership separate |
| Validated structured systolic BP &lt; 100 mmHg | 2 | Max one; requires ≥1 independent accepted non-BP Lymphatic feature |

**Explicitly not approved as raw or automatic scorers:** bare `lymph` · disease/body label `obesity` alone · vague `sluggish` · “common cold” disease label · weather/food cold exposure · generic khoon-style blood words (out of batch) · any child concept added as a new CSV row.

**No child-concept rows were added to the 37-row legacy CSV.**

---

## Lymphatic Batch 3 freeze

**Batch token:** `OWNER-FREEZE-R1-LYMPHATIC-BATCH3-v1`

```text
RULE1_LYMPHATIC_BATCH3_STATUS = OWNER_APPROVED

ROWS_REVIEWED = 11
SPLIT = 8
MOVE_TO_R3 = 1
REJECT_RAW_KEYWORD = 1
QUARANTINE = 1
DIRECT_RAW_KEYWORD_APPROVAL = 0
RAW_OWNER_WEIGHT_ZERO = 11
```

| Row ID | Keyword | Owner decision | Raw owner weight | Token |
|--------|---------|----------------|-----------------:|-------|
| R1-KW-0009 | cold | SPLIT | 0 | `OWNER-APPROVE-R1-KW-0009-v1` |
| R1-KW-0010 | constipation | SPLIT | 0 | `OWNER-APPROVE-R1-KW-0010-v1` |
| R1-KW-0011 | kabz | SPLIT | 0 | `OWNER-APPROVE-R1-KW-0011-v1` |
| R1-KW-0012 | lymph | MOVE_TO_R3 | 0 | `OWNER-APPROVE-R1-KW-0012-v1` |
| R1-KW-0013 | motapa | SPLIT | 0 | `OWNER-APPROVE-R1-KW-0013-v1` |
| R1-KW-0014 | obesity | REJECT_RAW_KEYWORD | 0 | `OWNER-APPROVE-R1-KW-0014-v1` |
| R1-KW-0015 | sluggish | QUARANTINE | 0 | `OWNER-APPROVE-R1-KW-0015-v1` |
| R1-KW-0016 | sujan | SPLIT | 0 | `OWNER-APPROVE-R1-KW-0016-v1` |
| R1-KW-0017 | swelling | SPLIT | 0 | `OWNER-APPROVE-R1-KW-0017-v1` |
| R1-KW-0018 | thanda | SPLIT | 0 | `OWNER-APPROVE-R1-KW-0018-v1` |
| R1-KW-0019 | white discharge | SPLIT | 0 | `OWNER-APPROVE-R1-KW-0019-v1` |

---

## Safety separation

Severe hypothermia/shock chill, bowel-obstruction warning signs, hard/fixed/rapidly enlarging lymphadenopathy with systemic symptoms, airway/facial allergic swelling, unilateral painful limb swelling, generalized edema with breathing difficulty, cardiac/renal/hepatic warning signs, abnormal discharge with fever/bleeding/pregnancy/STI-risk context, and symptomatic hypotension (syncope/shock/bleeding/dehydration/sepsis/medication effect) operate on **independent red-flag/medical-evaluation pathways**. Temperament scoring does **not** replace emergency assessment, diagnosis, referral, or treatment.

---

## Coverage and batch posture

- Nervous Batch 4 remains **pending** (8 rows unapproved)
- Bilious Batch 1 and Sanguine Batch 2 remain approved — not reopened
- 116,284-row disease DB remains **unauthorized**
- No universal diagnostic accuracy claim
- Eleven legacy keywords are **not** complete Lymphatic coverage

---

## Status tokens

- `RULE1_LYMPHATIC_BATCH3_OWNER_APPROVED_DOCUMENTATION_ONLY`
- `RULE1_LYMPHATIC_RAW_KEYWORDS_WEIGHT_ZERO`
- `RULE1_CLINICAL_ACTIVATION_NONE`
- `RULE1_MEDICINE_SELECTION_INFLUENCE_NONE`
- `RULE1_RUNTIME_NOT_CONNECTED`
