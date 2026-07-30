# Old clinical engine — source inventory (Phase 5A)

**Mode:** Read-only forensic audit  
**Old root:** `C:\Users\zero error\Desktop\EH_Arogya_Sutra_App`  
**Old HEAD:** `b9ec3f6986c402afee13241673b954fe3564f169`  
**DB SHA-256:** `C3FF59F862EAD2559E116CF6A4F629B7259BBD12D73385F299B780F25C4D1154`  
**Rule stamp:** `RULE_ENGINE_VERSION = "9-rule-v4.0"`  
**Classification legend:** A Canonical · B Required dependency · C Data-only · D Presentation · E Phase F · F Legacy fallback · G Shadow/comparison · H Test/fixture · I Obsolete/duplicate · J Unknown (owner review)

> Filenames alone do **not** prove canonicity. Classifications below are from execution traces + prior EH_9 audits + live call chains.

## Critical authority set

| Absolute path | Purpose | Key symbols | Inbound | Outbound | DB/file dep | Clinical vs presentation | Executed | Safe migrate | Refactor needed | SHA-256 | Risk |
|---------------|---------|-------------|---------|----------|-------------|--------------------------|----------|--------------|-----------------|---------|------|
| `...\eh-api\core\clinical_engines.py` | Version stamp; prakriti/polarity/systems/dosage/safety helpers; ALLOWED_39 | `RULE_ENGINE_VERSION`, `detect_prakriti`, `ALLOWED_39` | MDE, APIs | potency, systems | `engine_medicines_38.py` | Clinical helpers | YES | PARTIAL | Split helpers vs orchestrator; unify polarity | `D30F2404…9419D5` | High — dual paths |
| `...\eh-api\core\multi_disease_engine.py` | Live clinical orchestrator | `MultiDiseaseEngine.analyze` | `intelligence/engine.py`, `eh_api.py` | nearly all engines | SQLite session | Clinical authority | YES | PARTIAL | Extract clean service boundary | `0704BC23…C4C78DF9` | Critical |
| `...\eh-api\core\medicine_confidence_engine.py` | Oral liquid scoring | `score_all_medicines`, `build_formula_from_confidence` | formula_generator, MDE | MM registry | MM file | Clinical selection | YES | YES | Slot-scope evidence; version API | `5F141115…C2E6` | High |
| `...\eh-api\core\mixture_count_engine.py` | 3/4/5 oral count | `decide_mixture_count`, `classify_case_complexity` | MDE / synthesizer | — | — | Clinical | YES | YES | Keep contract | `9612569E…B3D6` | Low |
| `...\eh-api\core\formula_generator.py` | Mixture formula assembly | `generate_mixture_formula` | MDE | confidence engine | MM | Clinical | YES | YES | — | (see TEMP hashes) | Medium |
| `...\eh-api\core\potency_engine.py` | Unified potency | `get_unified_clinical_potency` | MDE | — | potency rules | Clinical | YES | YES | Single SoT | `45FA4E8D…8F23` | Medium |
| `...\eh-api\core\formula_polarity_policy_engine.py` | Formula-specific polarity | `resolve_formula_specific_polarity` | MDE | scoring | — | Clinical | YES | YES | Deprecate legacy BP polarity | `E0018245…8639` | Medium |
| `...\eh-api\core\oral_electricity_policy_engine.py` | Oral electricity; no default WE | `select_oral_electricity_for_mixture` | MDE | MM | MM | Clinical | YES | YES | Keep POLICY-004-WE | `B37BE7F7…556B` | Medium |
| `...\eh-api\core\external_application_engine.py` | External routes | `build_external_routes` | MDE | composer | — | Clinical | YES | YES | Keep evidence gates | `A496A1AA…988C` | Medium |
| `...\eh-api\core\tablet_globules_engine.py` | Tablet A/B production | `build_tablet_prescription` | MDE | section_a optimizer | oral mixtures | Clinical (oral-derived) | YES | PARTIAL | Replace oral-copy with full-pool | `E609FDA2…53A92` | **Critical CONFLICT** |
| `...\eh-api\core\integrated_engine.py` | Hybrid disease search | FTS+vector RRF | MDE, search API | DB | `eh_arogya.db` | Clinical detection | YES | PARTIAL | Disease-pack only; clean corrupt rows | `742F1DB9…6D20` | High |
| `...\eh-api\intelligence\engine.py` | Multimodal orchestrator | `MultiModalEHEngine.run_analysis` | `/api/v4/analyze-complete` | MDE + summary | OCR/vision | Clinical + presentation attach | YES | PARTIAL | Wire findings into analyze | `6D0997F5…8152` | High |
| `...\eh-api\data\engine_medicines_38.py` | Canonical 39 MM | `MEDICINES_38` (39 entries) | scoring engines | — | self | Data/clinical | YES | YES | Rename to 39; drop SQLite seed drift | `907AF5DB…F703` | Medium |
| `...\eh-api\data\eh_arogya.db` | Disease knowledge + consultations | tables `diseases`, `consultations`, … | search, MDE | — | self | **Mixed** knowledge + PHI | YES | PARTIAL | Extract diseases only | `C3FF59F8…1154` | **Critical** |

## Supporting clinical modules (A/B)

| Path | Class | Notes |
|------|-------|-------|
| `eh-api\core\disease_registry.py` | A/B | Mixture plan split |
| `eh-api\core\prescription_synthesizer.py` | A/B | Treatment plans A–E |
| `eh-api\core\chief_complaint_engine.py` | B | Pre-rule gate |
| `eh-api\core\constitution_engine.py` | B | Sibling of prakriti |
| `eh-api\core\dosage_utils.py` | A/PARTIAL | Overridden by potency-band schedule in MDE |
| `eh-api\core\section_a_tablet_optimizer.py` | A (oral-derived) | `build_section_a_from_oral_mixtures` |
| `eh-api\core\tablet_section_b_*.py` | A/PARTIAL | Slot selection / policy |
| `eh-api\core\ghost_disease_filter.py` | B | Junk/ghost filtering |
| `eh-api\eh_api.py` | B | FastAPI entry |
| `backend\routes\ehV4Proxy.js` | B | Node proxy (branding strings) |

## Presentation / Phase F (D/E)

| Path | Class | Notes |
|------|-------|-------|
| `eh-api\core\professional_summary_renderer.py` | E | `phase_f_professional_summary_v1` |
| `eh-api\core\summary_engine.py` | D/E | Attaches Phase F after Rx; some legacy WE strings |
| `eh-api\core\clinical_explanation_engine.py` | D | Explanations only |
| `next-app\src\components\PhaseFProfessionalReportView.tsx` | E | Frontend renderer |
| `next-app\src\lib\phaseFProfessionalSummary.ts` | E | Presentation |
| `next-app\src\lib\presentationGate.ts` | D | Gate — no clinical invent |

## Shadow / additive (G)

| Path | Class | Notes |
|------|-------|-------|
| `eh-api\core\eh_master_clinical_state.py` | G | Parallel “Rules 1–9”; non-mutating oral |
| `eh-api\core\eh_complexis_engine.py` | G | Complexis as alternate “Rule 6” |
| Tablet full-pool modules / env `EH_TABLET_FULL_POOL_PRODUCTION` | G | Independent 39-pool **not** production default |
| `_legacy_external_oral_copy.py` | F/G | Quarantined; env-gated |

## Data / indexes (C)

| Path | Class | Notes |
|------|-------|-------|
| `diseases` + `fts_diseases` + `vec_diseases*` in DB | C | 116,284 rows |
| `medicines` table (38 rows) | C / **I vs MM** | Missing C11 — non-canonical |
| `potency_rules` table | C | Seed rules |
| `engine_diseases_icd.py` | C/I | 503 bootstrap ICD list only |

## Tests / fixtures (H)

| Path | Class | Notes |
|------|-------|-------|
| `eh-api\tests\test_formula_polarity_policy_engine.py` | H | Polarity |
| `eh-api\tests\test_oral_electricity_policy_engine.py` | H | Electricity |
| `eh-api\tests\test_external_*.py` | H | External |
| `docs\structural-v2\golden\GOLDEN_CASES.json` | H | IDs only for EHAS2 planning |
| `eh-api\tests\fixtures\multimodal_summary\` | H | Synthetic |
| `docs\EH_9_RULE_ENGINE_AUDIT\*` | A/H | Canonical audit pack |

## Unknown / owner review (J)

| Item | Why |
|------|-----|
| `docs\uckb-validation\MASTER_9_RULE_ENGINE_AUDIT.md` | Different Rule 1–9 naming map |
| `clinical_consensus_engine._EH_RULE_MAP` | Reviewer metadata map ≠ EH_9 list |
| PDF rule guides vs code `9-rule-v4.0` | Historical numbering conflict |

## Explicit non-migration

Do **not** copy into EHAS2 in Phase 5A (or later without isolation):

- `consultations` (1862 rows; patient names/vitals/formulas)
- `api_keys`
- uploaded reports / images
- identifiable golden case narratives without de-identification
- old project source trees as runtime imports
