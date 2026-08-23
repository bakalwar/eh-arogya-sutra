# Rule 1 — Owner Decisions (Phase 5R-1F Freeze)

**Authority:** OWNER-APPROVED
**Effective:** Phase 5R-1F documentation freeze
**EHAS2 code:** NOT_IMPLEMENTED (this document does not activate runtime)

**Current focused canonical contract (identity/scope/schemas; does not rewrite this register):** [rule-01-temperament-engine-contract.md](./rule-01-temperament-engine-contract.md) — machine identity **`TEMPERAMENT_ENGINE`**; owner decisions **R1-ID-01…R1-ID-05** (`R1_ID01_TO_ID05_RECOMMENDED_DECISIONS_APPROVED`).

This file records **final owner answers** captured for EHAS2. Cursor must not extend these with new clinical thresholds, medicines, or fallbacks without a new owner phase.

---

## Identity and scope

| Item | Decision | Tag |
|------|----------|-----|
| Rule number | 1 | OWNER-APPROVED |
| Canonical name | Temperament Engine | OWNER-APPROVED |
| Machine identity token | `TEMPERAMENT_ENGINE` | OWNER-APPROVED (`R1-ID-01`; see [rule-01-temperament-engine-contract.md](./rule-01-temperament-engine-contract.md)) |
| Legacy status | LIVE_BUT_PARTIAL | LEGACY-PROVEN |
| EHAS2 implementation | NOT_IMPLEMENTED | IMPLEMENTATION-PENDING |
| Clinical authority | OWNER_APPROVED_SPECIFICATION | OWNER-APPROVED |
| Separation | Rule 1 ≠ disease selection ≠ final medicine selection | OWNER-APPROVED |

---

## Output enumeration

Frozen EH Temperament tokens: **LYMPHATIC**, **SANGUINE**, **BILIOUS_HEPATIC**, **NERVOUS**, **MIXED**, **UNKNOWN**.

Full result contract field list frozen in [rule-01-temperament-engine.md](./rule-01-temperament-engine.md) — **IMPLEMENTATION-PENDING** in runtime.

---

## Temperament vs Tridosha

| Decision | Tag |
|----------|-----|
| Separate typed fields; no merged ambiguous `prakriti` string | OWNER-APPROVED |
| Dosha mapping table (KAPHA/PITTA/VATA, DWANDVAJA, TRIDOSHAJA) | OWNER-APPROVED |
| Bilious secondary dosha evidence rules | **OWNER-CLARIFICATION-PENDING** |

---

## No-evidence behavior

| Decision | Tag |
|----------|-----|
| temperament = UNKNOWN | OWNER-APPROVED |
| resolution_status = ADDITIONAL_INFORMATION_REQUIRED | OWNER-APPROVED |
| No Lymphatic / Mixed / Balanced default | OWNER-APPROVED |
| No dictionary order; no guess | OWNER-APPROVED |
| Question bank content | **OWNER-CLARIFICATION-PENDING** (later audit) |

---

## Equal-tie behavior

| Decision | Tag |
|----------|-----|
| UNRESOLVED_TIE + FOLLOW_UP_REQUIRED when equal score and strength | OWNER-APPROVED |
| DWANDVAJA (two) / TRIDOSHAJA (three+) dosha classification on tie | OWNER-APPROVED |
| One approved follow-up question | OWNER-APPROVED |
| If no answer → MIXED + BALANCED_MIXED | OWNER-APPROVED |
| Never dictionary/alphabetical/insertion order for primary | OWNER-APPROVED |
| Follow-up question text bank | **OWNER-CLARIFICATION-PENDING** |

---

## BP supporting evidence

| Decision | Tag |
|----------|-----|
| Systolic ≥ 140 → SANGUINE +3 supporting | OWNER-APPROVED |
| Systolic < 100 → LYMPHATIC +2 supporting | OWNER-APPROVED |
| BP supporting only; never sole determinant | OWNER-APPROVED |
| Requires ≥1 non-BP approved symptom/observation before resolved result | OWNER-APPROVED |
| No extra BP thresholds in this phase | OWNER-APPROVED |

---

## Photo

| Decision | Tag |
|----------|-----|
| Supporting observation only | OWNER-APPROVED |
| Photo alone cannot determine temperament | OWNER-APPROVED |
| No skin colour / ordinary face as automatic authority | OWNER-APPROVED |
| Future gates (consent, quality, attribution, verification) documented | OWNER-APPROVED |
| No image processing activated in 5R-1F | OWNER-APPROVED |

---

## Clinical impact matrix

Owner-approved intended downstream influence documented in [rule-01-temperament-engine.md](./rule-01-temperament-engine.md) — Formula 1 **NO** direct effect; Formula 2/3, tablets, external, potency, electricity, summary **YES** as evidence inputs only.

---

## Fixed medicine

| Decision | Tag |
|----------|-----|
| L1, S1, A3, F1 etc. illustrative only | OWNER-APPROVED |
| Full 38-medicine pool for Formula 2/3 (CQ-001A v2) | OWNER-APPROVED |
| No temperament→medicine shortcut | OWNER-APPROVED |

---

## Legacy forensic questions superseded for EHAS2

Phase 5R-1 audit owner questions (interpreter bypass, Mixed vs UNKNOWN, etc.) are **resolved for EHAS2 direction** by this freeze where they conflict with sections above. Legacy runtime remains **LEGACY-PROVEN** and unchanged in the old project.

---

## Still pending (not invented here)

1. Bilious secondary dosha evidence rules
2. Additional-information question bank
3. Equal-tie follow-up question bank
4. Downstream scoring weights (Formula 2/3, tablets, etc.) — per-rule audits

---

## Append — Owner freezes (legacy adoption tranche @ `61279fe`)

**Authority:** Dr. Ghanshyam Bakalwar — APPROVED_OWNER_FREEZE (documentation only; **no runtime activation**)

| Tranche | Document | Tokens |
|---------|----------|--------|
| Medicine identity + C11 + routes | [../legacy-adoption/owner-freeze-od-ext006-007-medicine-route-architecture.md](../legacy-adoption/owner-freeze-od-ext006-007-medicine-route-architecture.md) | `OWNER-FREEZE-OD-EXT-006-v1` · `OWNER-FREEZE-OD-EXT-007-v1` · `OWNER-FREEZE-EH-MEDICINE-ROUTE-ARCHITECTURE-v1` |
| Rule 1 temperament taxonomy Q1–Q5 | [rule-01-temperament-taxonomy-owner-freeze-R1-OD-01-05.md](./rule-01-temperament-taxonomy-owner-freeze-R1-OD-01-05.md) | `OWNER-FREEZE-R1-OD-01-v1` … `OWNER-FREEZE-R1-OD-05-v1` |
| Legacy scoring +1/+2 resolution | [rule-01-legacy-scoring-evidence-resolution.md](./rule-01-legacy-scoring-evidence-resolution.md) | `LEGACY_RUNTIME_KEYWORD_HIT_WEIGHT = 2` (Rule 1 path) · `LEGACY_SCORING_IMPLEMENTATION_CONFLICT` |
| Rule 1 keyword row docket (37 rows) | [rule-01-keyword-row-clinical-review-docket.md](./rule-01-keyword-row-clinical-review-docket.md) | Bilious Batch 1 **approved** (8) · Sanguine Batch 2 **approved** (10) · Lymphatic Batch 3 **approved** (11); Nervous pending |

**Note:** R1-OD-01…05 partially clarifies/supersedes tokens above (e.g. four-primary `BILIOUS` vs `BILIOUS_HEPATIC`, disease-name keyword posture). Phase 5R-1F body preserved; future implementation follows the append tranche.

---

## Append — Bilious Batch 1 + weight scale (@ `0737de1`)

**Authority:** Dr. Ghanshyam Bakalwar — APPROVED_OWNER_FREEZE (documentation only; **no runtime activation**)

| Tranche | Document | Tokens |
|---------|----------|--------|
| Common weight scale v1 | [rule-01-bilious-batch1-owner-approval-freeze.md](./rule-01-bilious-batch1-owner-approval-freeze.md) | `OWNER-FREEZE-R1-TEMPERAMENT-WEIGHT-SCALE-v1` |
| Bilious Batch 1 (8 rows) | [rule-01-bilious-batch1-owner-approval-freeze.md](./rule-01-bilious-batch1-owner-approval-freeze.md) · [rule-01-keyword-row-clinical-review-docket.csv](./rule-01-keyword-row-clinical-review-docket.csv) | `OWNER-FREEZE-R1-BILIOUS-BATCH1-v1` · `OWNER-APPROVE-R1-KW-0001-v1` … `0008-v1` |

**Posture:** `clinically_used=false` / Rule 1 clinical activation **none** · medicine-selection influence **none** · Nervous batch **pending**

---

## Append — Sanguine Batch 2 (@ `9b9ec3a`)

**Authority:** Dr. Ghanshyam Bakalwar — APPROVED_OWNER_FREEZE (documentation only; **no runtime activation**)

| Tranche | Document | Tokens |
|---------|----------|--------|
| Sanguine Batch 2 (10 rows) | [rule-01-sanguine-batch2-owner-approval-freeze.md](./rule-01-sanguine-batch2-owner-approval-freeze.md) · [rule-01-keyword-row-clinical-review-docket.csv](./rule-01-keyword-row-clinical-review-docket.csv) | `OWNER-FREEZE-R1-SANGUINE-BATCH2-v1` · `OWNER-APPROVE-R1-KW-0028-v1` … `0037-v1` |

**Posture:** All ten raw Sanguine keywords `owner_approved_weight=0` · normalized concepts documented separately · structured systolic BP ≥140 weight **3** (max 1) · no second weight-scale token · Lymphatic Batch 3 / Nervous still pending at time of this append

---

## Append — Lymphatic Batch 3 (@ `01cc71c`)

**Authority:** Dr. Ghanshyam Bakalwar — APPROVED_OWNER_FREEZE (documentation only; **no runtime activation**)

| Tranche | Document | Tokens |
|---------|----------|--------|
| Lymphatic Batch 3 (11 rows) | [rule-01-lymphatic-batch3-owner-approval-freeze.md](./rule-01-lymphatic-batch3-owner-approval-freeze.md) · [rule-01-keyword-row-clinical-review-docket.csv](./rule-01-keyword-row-clinical-review-docket.csv) | `OWNER-FREEZE-R1-LYMPHATIC-BATCH3-v1` · `OWNER-APPROVE-R1-KW-0009-v1` … `0019-v1` |

**Posture:** All eleven raw Lymphatic keywords `owner_approved_weight=0` · normalized cold/bowel/habitus/edema/discharge concepts documented separately · structured systolic BP **&lt;100** weight **2** (max 1) **only with** ≥1 independent accepted non-BP Lymphatic feature · no second weight-scale token · Nervous still pending · `clinically_used=false` · medicine-selection influence **none**
