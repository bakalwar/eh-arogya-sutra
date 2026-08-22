# Rule 1 — Temperament Taxonomy Owner Freezes (R1-OD-01 through R1-OD-05)

| Field | Value |
|-------|--------|
| **Authority** | Dr. Ghanshyam Bakalwar — APPROVED_OWNER_FREEZE |
| **Document class** | Append-only owner decision record |
| **Canonical base** | `61279fe609e91e9d105fc6c1db0025767a875012` |
| **Runtime activation** | **NONE** |
| **Relationship to Phase 5R-1F** | [rule-01-owner-decisions.md](./rule-01-owner-decisions.md) preserved; this tranche records **new** owner-approved taxonomy decisions that clarify/supersede conflicting tokens (e.g. `BILIOUS_HEPATIC` vs four-primary model, disease-name keyword posture) for **future** implementation only |

Companion: [rule-01-legacy-scoring-evidence-resolution.md](./rule-01-legacy-scoring-evidence-resolution.md) · [rule-01-keyword-row-clinical-review-docket.md](./rule-01-keyword-row-clinical-review-docket.md)

---

## R1-OD-01 — Four primary temperaments

**Approval token:** `OWNER-FREEZE-R1-OD-01-v1`

```text
PRIMARY_TEMPERAMENTS =
SANGUINE | LYMPHATIC | NERVOUS | BILIOUS
```

All four are **independent primary** Electrohomeopathy temperament categories.

---

## R1-OD-02 — Bilious posture

**Approval token:** `OWNER-FREEZE-R1-OD-02-v1`

Bilious is an **independent primary temperament** (not merely a secondary modifier).

**Owner clinical interpretation:**

- Associated with hepatic/biliary and digestive imbalance patterns
- Not merely a secondary modifier
- Disease name alone does **not** prove Bilious temperament

---

## R1-OD-03 — Mixed temperament representation

**Approval token:** `OWNER-FREEZE-R1-OD-03-v1`

Mixed temperament must be shown as **normalized score/percentage across all four primary temperaments**.

**Example presentation:**

```text
Lymphatic: 70%
Sanguine: 30%
Nervous: 0%
Bilious: 0%
```

**Requirements:**

- Show all four or clearly show non-zero scores
- Identify leading temperament
- Show secondary tendencies
- Percentages must be deterministic
- Percentages must sum to 100 when sufficient evidence exists
- Retain raw evidence/score trace
- Ties must be visible
- Insufficient evidence must **not** be forced into percentages
- Contradictory inputs require doctor review

**Fail-closed outcomes:**

- `TEMPERAMENT_INSUFFICIENT_EVIDENCE`
- `TEMPERAMENT_CONTRADICTORY`
- `MIXED_TEMPERAMENT_REVIEW_REQUIRED`
- `UNMAPPED_FEATURE`

---

## R1-OD-04 — Disease name vs patient features

**Approval token:** `OWNER-FREEZE-R1-OD-04-v1`

Temperament must be determined mainly from **patient-specific symptoms, physical features, clinical signs, constitution, and accepted observations**.

Disease names such as **jaundice** or **sciatica** must **not** directly determine temperament merely because the disease label is present.

Disease/diagnosis may provide **context only** after separate clinical acceptance; it must **not** act as an unreviewed direct temperament keyword.

---

## R1-OD-05 — Weighting principle

**Approval token:** `OWNER-FREEZE-R1-OD-05-v1`

Feature weighting must follow the owner-approved Electrohomeopathy / **Count Mattei** doctrinal temperament and pathology model.

**Terminology note:** Owner Hindi wording **"काउंट मैटी"** is documented in English as **Count Mattei** (repository accepted spelling).

**Weighting requirements:**

- Stronger objective clinical signs may contribute more than weak/vague keywords
- BP and other vitals must use explicit bounded rules
- Intensity, persistence, and context may affect contribution only under approved contracts
- Negated symptoms contribute **zero**
- Duplicated synonyms must **not** double-score
- Disease label alone contributes **no** direct temperament score
- R2/R3 overlap must **not** automatically double-score
- Every weight must be versioned and traceable
- Rule 1 must **not** select medicines
- Rule 1 percentages are doctrinal decision-support output, **not** a standalone diagnosis

Do **not** describe this model as universally or conventionally scientifically validated unless an approved evidence source explicitly supports that statement.

---

## Status tokens

- `R1_OD_01_TO_05_APPROVED_OWNER_FREEZE_RECORDED`
- `RULE1_TAXONOMY_OWNER_FREEZE_DOCUMENTATION_ONLY`
- `RULE1_CLINICAL_ACTIVATION_NONE`
- `RULE1_MEDICINE_SELECTION_INFLUENCE_NONE`
