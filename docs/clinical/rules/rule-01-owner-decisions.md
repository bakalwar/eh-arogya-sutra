# Rule 1 — Owner Decisions (Phase 5R-1F Freeze)

**Authority:** OWNER-APPROVED
**Effective:** Phase 5R-1F documentation freeze
**EHAS2 code:** NOT_IMPLEMENTED (this document does not activate runtime)

This file records **final owner answers** captured for EHAS2. Cursor must not extend these with new clinical thresholds, medicines, or fallbacks without a new owner phase.

---

## Identity and scope

| Item | Decision | Tag |
|------|----------|-----|
| Rule number | 1 | OWNER-APPROVED |
| Canonical name | Temperament Engine | OWNER-APPROVED |
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
| Full 39-medicine pool for Formula 2/3 | OWNER-APPROVED |
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
