# Rule 3 — Legacy Conflicts (Rejected for EHAS2)

**Tag key:** LEGACY-PROVEN = observed in old app · LEGACY_CONFLICT = numbering/naming · Rejected = must not ship in EHAS2.

Forensic source: Phase 5R-3 audit artifacts under `%TEMP%\ehas2_rule3_forensic_audit\`.

---

## Explicitly rejected (OWNER-APPROVED)

| Defect | LEGACY-PROVEN evidence | EHAS2 stance |
|--------|------------------------|--------------|
| BP passed as gender | `report_analyzer.py` ~356 `detect_active_systems(combined_symptoms, bp_systolic)` | **Rejected** — path not migrated |
| GYNE → METABOLIC automatic remap | `integrated_engine.py` ~295–298 | **Rejected** |
| No-system → METABOLIC fallback | MDE ~517, ~909; detector UNRESOLVED vs downstream METABOLIC | **Rejected** — owner UNRESOLVED stop |
| Silent hybrid-search exception | `integrated_engine.py` ~314–315 `except: pass` | **Rejected** |
| Dictionary-order tie as SoT | `merge_system_lists` ordering | **Rejected** |
| Global report leakage | `report_analyzer` appends report/photo systems without full re-gate | **Rejected** — structured isolated findings |
| Wrapper drops evidence | `detect_active_systems` returns systems only | **Rejected** — full contract |
| Keyword-only as “Confirmed Organ Systems” | Summary/renderer certainty vs method | **Rejected** — LOW_CONFIDENCE_CANDIDATE |
| Duplicate detector overwrite | Normalizer + MDE both call `detect_systems` without single SoT | **Rejected** — canonical Rule 3 engine only |
| Concatenate OCR into symptom blob for Rule 3 | Multimodal vs MDE symptom-only re-run | **Rejected** |
| Ordinary photo sets organ system | Photo merge paths | **Rejected** |
| Rule 3 before Rule 1 in orchestration | MDE `_analyze_once` | **Rejected** — parallel Rule 1/3 model |
| Co-involvement auto-confirmed | CONSTIPATION→GASTRIC etc. without candidate gate | **Rejected** — candidate-only |

---

## LEGACY_CONFLICT — “Rule 3” label collisions

| Source | Meaning | EHAS2 Rule 3 |
|--------|---------|--------------|
| EH_9 / MDE live | Organ / System Affinity | **Canonical** |
| `clinical_consensus_engine._EH_RULE_MAP` life_threat | Vital sign / life-threat safety | **Do not import** |
| `backend/engines/medicine_engine.py` | Prakriti boost | **Do not import** |
| `backend/engines/safety_engine.py` | Neutral dose safety | **Do not import** |
| S5-SUMMARY-R3 | Summary hardening phase tag | **Not clinical Rule 3** |
| Summary “Organ-System Triad” | Rule 6 golden concept | **AUDIT_PENDING** — not Rule 3 |

---

## LEGACY_CONFLICT — PDF vs code numbering

Older PDF guides may swap rule numbers (polarity, aggravation, composition). EHAS2 uses owner freezes for Rules 1–3 and EH_9 alignment for vocabulary — do not copy PDF Rule 3 label without owner legend.

---

## LEGACY-PROVEN live path (reference — do not implement verbatim)

| Component | Path |
|-----------|------|
| Detector | `eh-api/core/integrated_engine.py` `detect_systems` |
| Wrapper | `eh-api/core/clinical_engines.py` `detect_active_systems` |
| MDE caller | `eh-api/core/multi_disease_engine.py` ~249–253 |
| Shadow organ block | `eh-api/core/eh_master_clinical_state.py` `_organ_affinity` |

Old project unchanged by Phase 5R-3F.

---

## Phase 5C synthetic orchestrator

EHAS2 isolated nine-rule orchestration organ step — **not** this owner specification. Re-baseline when implementing production Rule 3.
