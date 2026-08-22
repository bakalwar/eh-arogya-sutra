# Rule 1 — Sanguine Batch 2 Owner Approval Freeze

| Field | Value |
|-------|--------|
| **Authority** | Dr. Ghanshyam Bakalwar — APPROVED_OWNER_FREEZE |
| **Document class** | Append-only owner decision record |
| **Canonical base** | `9b9ec3a3b05f715945dbc5986edb4d82b06fb28b` |
| **Runtime activation** | **NONE** — documentation/review only |
| **Machine docket** | [rule-01-keyword-row-clinical-review-docket.csv](./rule-01-keyword-row-clinical-review-docket.csv) |
| **Weight scale** | Reuses frozen `OWNER-FREEZE-R1-TEMPERAMENT-WEIGHT-SCALE-v1` (do **not** create a second scale token) |

This document records owner-approved **Sanguine Batch 2** row dispositions. It does **not** activate Rule 1 runtime, set `clinically_used=true`, grant diagnosis authority, or grant medicine-selection influence.

---

## Batch-wide raw-keyword policy

```text
RULE1_SANGUINE_BATCH2_RAW_KEYWORD_POLICY =
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

**Legacy vs owner:** CSV `verified_legacy_weight=2` remains **forensic evidence only**. All ten raw Sanguine rows have `owner_approved_weight=0`.

---

## Deduplication freezes

### Thermal

```text
hot + garam
→ one TARGET_BOUND_THERMAL_FEATURE contribution
```

### Blood

```text
khoon + rakt + bleeding
→ one SITE_AND_CONTEXT_BOUND_BLEEDING_FEATURE contribution
```

### BP

```text
raw high-bp text + structured BP + R2 + R3
→ at most one Rule 1 structured BP contribution
```

### Circulatory

```text
arterial + circulation + high bp + fast heartbeat + flushing
```

Distinct accepted clinical concepts may contribute separately, but the **same underlying evidence must never be counted twice**.

---

## Structured BP support rule (owner-approved)

```text
VALIDATED_STRUCTURED_SYSTOLIC_BP >= 140
RULE1_SANGUINE_WEIGHT = 3
MAX_CONTRIBUTIONS_PER_CASE = 1
```

Requirements: valid structured numeric systolic · current measurement context · malformed/missing fails closed · structured overrides raw `high bp` text · historical hypertension label alone = 0 · no R2/R3 duplicate · diastolic Rule 1 weight **not** frozen · medical evaluation/red-flag pathway remains separate.

This is owner-approved Electrohomeopathy doctrinal temperament support — **not** a standalone hypertension diagnostic rule.

---

## Approved normalized concepts (documentation rules — not CSV child rows)

| Normalized concept | Weight | Notes |
|--------------------|-------:|-------|
| Accepted current site-bound bleeding symptom | 2 | From bleeding/khoon/rakt normalization |
| Accepted objective bleeding sign | 3 | Safety pathway still independent |
| Accepted patient-specific palpitation | 2 | Not exertional/fever/anxiety/medicine auto |
| Validated measured resting tachycardia | 3 | Severe/syncope/chest pain/irregular → safety |
| Accepted facial/cutaneous flushing | 2 | Allergy/drug/menopausal/fever/emotional excluded |
| Accepted subjective heat tendency | 1 | Shared hot+garam |
| Accepted heat intolerance or observed hot skin | 2 | Shared hot+garam; fever not auto |
| Validated structured systolic BP ≥ 140 | 3 | Max one per case |

**No child-concept rows were added to the 37-row legacy CSV.**

---

## Sanguine Batch 2 freeze

**Batch token:** `OWNER-FREEZE-R1-SANGUINE-BATCH2-v1`

```text
RULE1_SANGUINE_BATCH2_STATUS = OWNER_APPROVED

ROWS_REVIEWED = 10
MOVED_TO_R3 = 2
SPLIT = 8
DIRECT_RAW_KEYWORD_APPROVAL = 0
RAW_OWNER_WEIGHT_ZERO = 10
```

| Row ID | Keyword | Owner decision | Raw owner weight | Token |
|--------|---------|----------------|-----------------:|-------|
| R1-KW-0028 | arterial | MOVE_TO_R3 | 0 | `OWNER-APPROVE-R1-KW-0028-v1` |
| R1-KW-0029 | bleeding | SPLIT | 0 | `OWNER-APPROVE-R1-KW-0029-v1` |
| R1-KW-0030 | circulation | MOVE_TO_R3 | 0 | `OWNER-APPROVE-R1-KW-0030-v1` |
| R1-KW-0031 | fast heartbeat | SPLIT | 0 | `OWNER-APPROVE-R1-KW-0031-v1` |
| R1-KW-0032 | flushing | SPLIT | 0 | `OWNER-APPROVE-R1-KW-0032-v1` |
| R1-KW-0033 | garam | SPLIT | 0 | `OWNER-APPROVE-R1-KW-0033-v1` |
| R1-KW-0034 | high bp | SPLIT | 0 | `OWNER-APPROVE-R1-KW-0034-v1` |
| R1-KW-0035 | hot | SPLIT | 0 | `OWNER-APPROVE-R1-KW-0035-v1` |
| R1-KW-0036 | khoon | SPLIT | 0 | `OWNER-APPROVE-R1-KW-0036-v1` |
| R1-KW-0037 | rakt | SPLIT | 0 | `OWNER-APPROVE-R1-KW-0037-v1` |

---

## Safety separation

Bleeding (severe/internal/ongoing), markedly elevated BP, syncope/chest pain/irregular or severe tachycardia, allergy/anaphylaxis or sepsis-associated flushing operate on **independent red-flag/medical-evaluation pathways**. Temperament scoring does **not** replace emergency assessment, diagnosis, referral, or treatment.

---

## Coverage and batch posture

- Lymphatic (11) and Nervous (8) batches remain **pending** (19 rows unapproved)
- Bilious Batch 1 remains approved (8 rows) — not reopened
- 116,284-row disease DB remains **unauthorized**
- No universal diagnostic accuracy claim

---

## Status tokens

- `RULE1_SANGUINE_BATCH2_OWNER_APPROVED_DOCUMENTATION_ONLY`
- `RULE1_SANGUINE_RAW_KEYWORDS_WEIGHT_ZERO`
- `RULE1_CLINICAL_ACTIVATION_NONE`
- `RULE1_MEDICINE_SELECTION_INFLUENCE_NONE`
- `RULE1_RUNTIME_NOT_CONNECTED`
