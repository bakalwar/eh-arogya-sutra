# Rule 2 — Owner Decisions (Phase 5R-2F Freeze)

**Authority:** OWNER-APPROVED
**EHAS2 code:** NOT_IMPLEMENTED

---

## Identity

| Item | Decision | Tag |
|------|----------|-----|
| Rule number | 2 | OWNER-APPROVED |
| Canonical name | Polarity Engine | OWNER-APPROVED |
| Clinical authority | Formula-specific policy engine | OWNER-APPROVED |
| Legacy status | LIVE_BUT_PARTIAL | LEGACY-PROVEN |
| EHAS2 implementation | NOT_IMPLEMENTED | IMPLEMENTATION-PENDING |
| mutates_mixtures | false | OWNER-APPROVED |

---

## Strict responsibility (prohibitions)

Rule 2 must **not**: select primary medicine; mutate medicine; select potency; select RE/BE/YE/GE/WE; change mixture count; change target pathology; issue prescription.

Rule 2 provides **immutable polarity annotation only** (OWNER-APPROVED).

---

## Law of opposites

| disease_polarity | required_therapeutic_polarity | Tag |
|------------------|-------------------------------|-----|
| POSITIVE | NEGATIVE | OWNER-APPROVED |
| NEGATIVE | POSITIVE | OWNER-APPROVED |
| RESOLVED NEUTRAL support | NEUTRAL | OWNER-APPROVED |

---

## Unresolved policy

| Field / behavior | Value | Tag |
|------------------|-------|-----|
| disease_polarity | UNRESOLVED | OWNER-APPROVED |
| required_therapeutic_polarity | NEUTRAL | OWNER-APPROVED |
| fallback_policy | OWNER_APPROVED_NEUTRAL_FALLBACK | OWNER-APPROVED |
| doctor_review_required | true | OWNER-APPROVED |
| Overwrite uncertainty as proven Neutral disease | **Prohibited** | OWNER-APPROVED |
| Draft analysis may complete | Yes | OWNER-APPROVED |
| Final prescription without doctor approval | **No** when unresolved policy applies | OWNER-APPROVED |

---

## SUPPORT_ONLY

| Field | Value | Tag |
|-------|-------|-----|
| disease_polarity | SUPPORT_ONLY | OWNER-APPROVED |
| required_therapeutic_polarity | NEUTRAL | OWNER-APPROVED |
| status | RESOLVED_SUPPORT_ROLE | OWNER-APPROVED |
| Distinct from UNRESOLVED | Always | OWNER-APPROVED |

---

## Isolation policies

| Policy | Tag |
|--------|-----|
| Formula-specific evidence only; no global case polarity on all formulas | OWNER-APPROVED |
| BP supporting only for cardiac/vascular/BP-target formulas | OWNER-APPROVED |
| Report findings slot-aligned only | OWNER-APPROVED |
| Photo: no ordinary face; local verified observation only; no global override | OWNER-APPROVED |
| case_polarity_summary display-only | OWNER-APPROVED |
| formula_polarities authoritative for downstream annotation use | OWNER-APPROVED |

---

## Engine separation

| Engine | Tag |
|--------|-----|
| Rule 2 — polarity annotation only | OWNER-APPROVED |
| Potency — separate audit before selection | AUDIT_PENDING |
| Electricity — separate audit before selection | AUDIT_PENDING |
| Medicine selection — 39-pool + other engines; Rule 2 NO_DIRECT_EFFECT | OWNER-APPROVED |

---

## Electricity reference (not Rule 2 selection)

RE→POSITIVE, BE/YE/GE→NEGATIVE, WE→NEUTRAL — **reference only** | OWNER-APPROVED |

---

## Numbering

Rule 1 Temperament; Rule 2 Polarity; “Rule 2 Organ System” typo **rejected** | OWNER-APPROVED |

Organ-System rule number | AUDIT_PENDING |

---

## Supersedes legacy for EHAS2 direction

Legacy UNRESOLVED→MIXED scoring coerce, global detect_polarity, case polarity as driver — **rejected** per [rule-02-legacy-conflicts.md](./rule-02-legacy-conflicts.md).
