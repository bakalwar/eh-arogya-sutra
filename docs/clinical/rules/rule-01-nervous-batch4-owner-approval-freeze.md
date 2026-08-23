# Rule 1 — Nervous Batch 4 Owner Approval Freeze

| Field | Value |
|-------|--------|
| **Authority** | Dr. Ghanshyam Bakalwar — APPROVED_OWNER_FREEZE |
| **Document class** | Append-only owner decision record |
| **Canonical base** | `d2580e88e34c639d40090152492952d2d880d26b` |
| **Runtime activation** | **NONE** — documentation/review only |
| **Machine docket** | [rule-01-keyword-row-clinical-review-docket.csv](./rule-01-keyword-row-clinical-review-docket.csv) |
| **Weight scale** | Reuses frozen `OWNER-FREEZE-R1-TEMPERAMENT-WEIGHT-SCALE-v1` (do **not** create a second scale token) |

This document records owner-approved **Nervous Batch 4** row dispositions. It does **not** activate Rule 1 runtime, set `clinically_used=true`, grant diagnosis authority, or grant medicine-selection influence.

---

## Batch-wide raw-keyword policy

```text
RULE1_NERVOUS_BATCH4_RAW_KEYWORD_POLICY =
ALL_RAW_LEGACY_KEYWORDS_WEIGHT_ZERO
```

1. Raw substring keywords do not score.
2. Only normalized, context-bound concepts may score.
3. One normalized concept contributes once.
4. Repeated words/synonyms do not multiply score.
5. R2/R3 routing does not automatically add Rule 1 score.
6. Negation/history-only/unaccepted evidence scores zero.
7. Red-flag pathways operate independently.
8. Temperament score does not replace diagnosis, referral, or treatment.
9. Rule 1 does not select medicine.
10. Disease labels and temperament-name collisions do not self-confirm Nervous temperament.

**Legacy vs owner:** CSV `verified_legacy_weight=2` remains **forensic evidence only**. All eight raw Nervous rows have `owner_approved_weight=0`.

---

## Deduplication freezes

### Affective (anxiety / restlessness)

```text
anxiety + bechaini
→ one ACCEPTED_CURRENT_AFFECTIVE_OR_RESTLESSNESS contribution
when source evidence, clinical meaning, and context are the same
```

Distinct accepted anxiety versus accepted restlessness may contribute separately **only if** independent source evidence, clinical meaning, and context are present.

Bare `nervous` remains quarantined and must **never** self-confirm the Nervous temperament label.

### Neuropathic / sensory

```text
nerve pain + site-bound shooting pain + site-bound tingling
→ one-concept-once within the same neuropathic-sensory evidence identity
```

Pain versus paresthesia may both contribute **only when** they are independent accepted features (different source evidence, clinical meaning, and context). The same underlying observation must never score twice via raw text, R2, or R3.

### Disease / ambiguous tokens

```text
sciatica → MOVE_TO_R3; Rule 1 weight = 0
nas → QUARANTINE; Rule 1 weight = 0
```

---

## Approved normalized concepts (documentation rules — not CSV child rows)

| Normalized concept | Weight | Notes |
|--------------------|-------:|-------|
| Accepted current anxiety symptom | 2 | Not diagnosis label alone; situational-only/negation/history = 0 |
| Accepted current restlessness (`bechaini` path) | 2 | One with anxiety when same evidence; distinct only if independent |
| Accepted neuropathic / neuralgia-type pain feature (`nerve pain` path) | 2 | Site/context required; does not diagnose neurological disease |
| Accepted site-bound shooting pain | 2 | Bare “shooting” quality alone = 0 |
| Accepted current site-bound paresthesia / tingling | 2 | Transient pressure-only/negation/history = 0 unless accepted |

**Explicitly not approved in this freeze:**

- Psychomotor agitation as a separate scoring concept
- Objective neurological examination signs
- Any new neurological thresholds, grading scales, or diagnostic cut-offs
- Bare `nas`, bare `nervous`, disease label `sciatica`
- Compound unauthorized phrases (e.g. sweat+bechaini packs) unless separately present and later owner-authorized

**No child-concept rows were added to the 37-row legacy CSV.**

---

## Nervous Batch 4 freeze

**Batch token:** `OWNER-FREEZE-R1-NERVOUS-BATCH4-v1`

```text
RULE1_NERVOUS_BATCH4_STATUS = OWNER_APPROVED

ROWS_REVIEWED = 8
SPLIT = 5
QUARANTINE = 2
MOVE_TO_R3 = 1
DIRECT_RAW_KEYWORD_APPROVAL = 0
RAW_OWNER_WEIGHT_ZERO = 8
```

| Row ID | Keyword | Owner decision | Raw owner weight | Token |
|--------|---------|----------------|-----------------:|-------|
| R1-KW-0020 | anxiety | SPLIT | 0 | `OWNER-APPROVE-R1-KW-0020-v1` |
| R1-KW-0021 | bechaini | SPLIT | 0 | `OWNER-APPROVE-R1-KW-0021-v1` |
| R1-KW-0022 | nas | QUARANTINE | 0 | `OWNER-APPROVE-R1-KW-0022-v1` |
| R1-KW-0023 | nerve pain | SPLIT | 0 | `OWNER-APPROVE-R1-KW-0023-v1` |
| R1-KW-0024 | nervous | QUARANTINE | 0 | `OWNER-APPROVE-R1-KW-0024-v1` |
| R1-KW-0025 | sciatica | MOVE_TO_R3 | 0 | `OWNER-APPROVE-R1-KW-0025-v1` |
| R1-KW-0026 | shooting | SPLIT | 0 | `OWNER-APPROVE-R1-KW-0026-v1` |
| R1-KW-0027 | tingling | SPLIT | 0 | `OWNER-APPROVE-R1-KW-0027-v1` |

---

## Safety separation

Suicidal ideation/self-harm risk, psychosis or severe agitation, chest pain or severe breathlessness with anxiety/restlessness, acute unilateral weakness or numbness, facial droop or speech disturbance, progressive motor weakness, bowel/bladder dysfunction with saddle anesthesia, severe headache with neurological deficits, seizure or loss of consciousness, major trauma, rapidly progressive sensory loss, and fever/systemic illness with neurological symptoms operate on **independent red-flag/medical-evaluation pathways**. Temperament scoring does **not** replace emergency assessment, diagnosis, referral, or treatment.

---

## Coverage and batch posture

- All four primary temperament keyword batches are now owner-reviewed at documentation level (Bilious, Sanguine, Lymphatic, Nervous)
- 116,284-row disease DB remains **unauthorized**
- Eight legacy Nervous keywords are **not** complete neurological coverage
- No universal diagnostic accuracy claim
- Migration tip remains **018**; **no 019**
- Medicine-selection influence **none**

---

## Status tokens

- `RULE1_NERVOUS_BATCH4_OWNER_APPROVED_DOCUMENTATION_ONLY`
- `RULE1_NERVOUS_RAW_KEYWORDS_WEIGHT_ZERO`
- `RULE1_CLINICAL_ACTIVATION_NONE`
- `RULE1_MEDICINE_SELECTION_INFLUENCE_NONE`
- `RULE1_RUNTIME_NOT_CONNECTED`
