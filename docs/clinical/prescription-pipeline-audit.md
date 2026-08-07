# Prescription pipeline audit (Phase 5A)

> **Current canonical medicine identity (2026-08-07, CQ-001A / PR #15):** `ehas2-medicine-registry-v2` — **38** medicines, **C11 excluded** (no replacement or remapping). The Phase 5A findings below describe the **historical** live old path and former **39**-code / v1 framing; they are **not** rewritten.

Owner EHAS2 target rules are scored against the **live old production path**.

## Owner-rule scorecard

| Rule | Verdict |
|------|---------|
| Simple→3 / Moderate→4 / Complex→5; never 1 or 2 | **MATCH** (`mixture_count_engine.py`) |
| No unjustified repetition; no fixed triad | **PARTIAL** (oral excludes used meds; tablet allows intentional repeat) |
| Formula-specific potency | **MATCH** (oral) / tablet **PARTIAL** |
| Formula-specific electricity; no default WE | **MATCH** (canonical oral POLICY-004-WE) / legacy summary-tablet **PARTIAL** |
| Tablet A/B independent full 39 pool; no oral-copy | **CONFLICT** (production `derived_from_oral: True`) |
| Empty Section B → `NO_CLINICALLY_JUSTIFIED_CANDIDATE` | **MATCH** |
| External site/evidence-specific | **MATCH** (prod); legacy oral-copy env-gated OFF |
| Frontend no medicine inference | **MATCH** intent / adapters **PARTIAL** (display parse only) |

## A. Oral mixtures — PROVEN

| Aspect | Detail |
|--------|--------|
| Entry | `POST /api/v4/analyze-complete` → `MultiModalEHEngine` → `MultiDiseaseEngine.analyze` |
| Pool | Liquid medicines from 39 registry |
| Selection | `medicine_confidence_engine` + `formula_generator` |
| Count | `decide_mixture_count` → 3\|4\|5 (0 if untreatable) |
| Fallbacks | complexity gates; unresolved → 0 |
| Output | `mixtures[]` with meds, polarity, electricity, potency |
| Migration | **HIGH** suitability |

## B. Tablet Section A — PROVEN / CONFLICT vs EHAS2

| Aspect | Detail |
|--------|--------|
| Entry | `build_tablet_prescription` after oral |
| Pool | Ranked from **finalized oral mixtures** (`build_section_a_from_oral_mixtures`) |
| Flag | `derived_from_oral: True` |
| Full 39 pool | Shadow / env `EH_TABLET_FULL_POOL_PRODUCTION` default OFF |
| Migration | **LOW** until independent pool cutover |

## C. Tablet Section B — PROVEN / PARTIAL

| Aspect | Detail |
|--------|--------|
| Empty contract | `NO_CLINICALLY_JUSTIFIED_CANDIDATE` |
| Pool | Oral-linked / meal-slot evidence (not independent 39 in prod) |
| Migration | **MEDIUM** |

## D. External applications — PROVEN

| Aspect | Detail |
|--------|--------|
| Entry | `build_external_routes` + composer |
| Behavior | Evidence/site gated; `NOT_CLINICALLY_INDICATED` valid |
| Migration | **HIGH** |

## E. Potency — PROVEN

| Aspect | Detail |
|--------|--------|
| Entry | `calculate_mixture_potency` → `get_unified_clinical_potency` |
| Inputs | polarity, phase, severity, age, BP, system, symptoms |
| Migration | **HIGH** (oral) |

## F. Electricity — PROVEN (oral)

| Aspect | Detail |
|--------|--------|
| Entry | `select_oral_electricity_for_mixture` |
| WE | Only with MM evidence — no fixed disease→WE table on canonical path |
| Unresolved | empty electricity + reason (not forced WE) |
| Defects | Legacy summary/tablet config may still show WE defaults |
| Migration | **HIGH** oral; scrub legacy presentation defaults |

## Known defects blocking clean EHAS2 port

1. Production tablet oral-copy vs owner full-pool rule  
2. Multimodal findings prepared but not fed into `MDE.analyze` (see multimodal audit)  
3. Residual WE strings in non-canonical summary paths  
4. SQLite medicines missing C11 vs MM 39
