# Rule 2 — Legacy Conflicts (Rejected for EHAS2)

**Tag key:** LEGACY-PROVEN = observed in old app · LEGACY_CONFLICT = numbering/naming · Rejected = must not ship in EHAS2.

---

## Explicitly rejected (OWNER-APPROVED)

| Defect | LEGACY-PROVEN evidence | EHAS2 stance |
|--------|------------------------|--------------|
| UNRESOLVED/SUPPORT_ONLY → MIXED for scoring | `polarity_for_legacy_scoring` | **Rejected** — NEUTRAL therapeutic fallback + review |
| Global `detect_polarity` on report path | `report_analyzer.py` ~378 | **Rejected** — formula-specific policy only |
| BP-first global polarity | `clinical_engines.detect_polarity` L345–348 | **Rejected** — BP isolation |
| Global symptoms as polarity proof | Legacy detect vs policy slot isolation | **Rejected** |
| Photo global polarity override | `report_analyzer.py` L379–380 | **Rejected** |
| Case `polarity` drives scoring | `mixtures[0]["polarity"]`, scoring_polarity split | **Rejected** — formula_polarities + display summary |
| Rule 2 selects medicine/potency/electricity | MDE passes polarity into generators | **Rejected** — annotation-only Rule 2 |
| Summary Rule 1=Polarity, Rule 2=Potency | `summary_engine.py` L1890–1891 | **Rejected** — canonical Rule 2 = Polarity Engine |
| Dual uncoordinated engines | policy + detect_polarity + delegate | **Rejected** — single EHAS2 Polarity Engine spec |
| Siddhant mutates_mixtures false vs per-mix JSON | `eh_siddhant_map.py` | **Rejected** — owner mutates_mixtures false = no mutation **by Rule 2** (annotation attached, not structural mix mutation) |

---

## LEGACY_CONFLICT — PDF / summary numbering

| Source | Says | Canonical EHAS2 |
|--------|------|-----------------|
| Legacy professional summary lines | Rule 1 (Polarity), Rule 2 (Potency) | Rule 1 Temperament, Rule 2 Polarity |
| EH_9 audit / MDE rules_applied | Rule 2 (Polarity) | Aligns with EHAS2 |

Document only; do not copy PDF numbering into EHAS2 UI without owner legend.

---

## LEGACY_CONFLICT — “Rule 2 Organ System” typo

Owner freeze: **rejected** as Rule 2 identity. Organ-System Engine rule number **AUDIT_PENDING**.

---

## LEGACY-PROVEN live path (reference — do not implement verbatim)

| Component | Path |
|-----------|------|
| Formula policy | `eh-api/core/formula_polarity_policy_engine.py` |
| Target binding | `eh-api/core/formula_clinical_target.py` |
| MDE caller | `eh-api/core/multi_disease_engine.py` ~563–832 |
| Legacy global | `eh-api/core/clinical_engines.py` `detect_polarity` |

Old project unchanged by Phase 5R-2F.

---

## Phase 5C synthetic orchestrator

EHAS2 isolated Python orchestrator Rule 2 interpretation — **not** this owner specification. Re-baseline when implementing production Rule 2.
