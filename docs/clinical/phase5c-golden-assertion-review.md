# Phase 5C golden assertion review (Phase 5C-G)

**Claim:** Golden PASS is based on meaningful clinical assertions, not mere harness execution.  
**Not claimed:** 100% medical accuracy.

Harness: `apps/clinical-engine/src/ehas2_clinical_engine/golden.py` + `fixtures/synthetic/clinical/golden/cases.json`  
Universal assertions on every case: `SYNTHETIC` label, `PRESCRIPTION_ENGINE_NOT_CONNECTED`, `medicine_output_count == 0`, Rule 8 `NOT_IMPLEMENTED`, `clinical_readiness == false`, fingerprint determinism (≥3 repeats).

| ID | Meaningful expects | Category |
|----|-------------------|----------|
| GC01 | `min_candidates≥1`, `systems_min≥1` | disease + systems |
| GC02 | `min_candidates≥1` | multi-symptom retrieval |
| GC03 | `systems_min≥3` | multi-system |
| GC04 | `language_hi` | Hindi normalization |
| GC05 | `min_candidates≥1` | Hinglish |
| GC06 | `negated_contains: fever` | negation |
| GC07 | `forced_top1: false` | no forced diagnosis |
| GC08 | `min_candidates==0`, Rule6 `UNRESOLVED` | unknown disease |
| GC09 | warning prefix `DOCTOR` | conflicting evidence |
| GC10 | `HIGH_BP_RED_FLAG` safety | safety |
| GC11 | `forced_top1: false` | low-confidence |
| GC12 | prakriti `VATA` | prakriti |
| GC13 | prakriti `PITTA` | prakriti |
| GC14 | prakriti `KAPHA` | prakriti |
| GC15 | prakriti unknown/mixed | unresolved prakriti |
| GC16 | polarity `POSITIVE` | polarity |
| GC17 | polarity `NEGATIVE` | polarity |
| GC18 | polarity mixed/unknown | unresolved polarity |
| GC19 | temperament not unknown | temperament |
| GC20 | temperament `UNKNOWN` | unresolved temperament |
| GC21 | `beyond_five` systems | no silent 5-cap |
| GC22 | noise not top (`gene`/virus) | contamination rejection |
| GC23 | doctor conflict possible | doctor-vs-symptoms |
| GC24 | `MISSING_VITALS` | unresolved vitals |
| GC25 | image not used | unsupported image |
| GC26 | report processing inactive; findings not claimed | report contract |

## Review verdict

| Gate | Result |
|------|--------|
| Assertions are case-specific (not empty pass) | PASS |
| Determinism fingerprints checked | PASS |
| Contamination / no-match / safety covered | PASS |
| Prescription never asserted successful | PASS |
| Medical accuracy 100% | **NOT CLAIMED** |

Legacy comparison remains `NOT_COMPARABLE` (no live old-server execution).
