# Golden validation plan (Phase 5A)

## Inventory (old project — do not copy PHI)

| Set | Location | Notes |
|-----|----------|-------|
| Structural golden 16 | `docs/structural-v2/golden/GOLDEN_CASES.json` + fixtures | Case IDs only for planning |
| UCKB step goldens | `docs/uckb-validation/STEP*_GOLDEN*.json` | Capture artifacts |
| Multimodal synthetic | `eh-api/tests/fixtures/multimodal_summary/` | Prefer synthetic |
| Simulation stream | `eh-api/data/clinical_simulation_dataset.jsonl` | UUID ids |
| Next restored fixtures | `next-app/src/lib/__tests__/…` | Presentation |

**Historical Irfaz / identifiable consultation material:** protected forensic evidence only — **do not migrate identifiable text** into EHAS2 fixtures.

## EHAS2 de-identified golden matrix (design)

Build new synthetic fixtures under a future `fixtures/synthetic/clinical/` (not created in 5A) covering:

1. Simple disease → 3 oral mixtures  
2. Moderate → 4  
3. Complex multi-system → 5  
4. High-BP emergency warning  
5. Report vs no-report comparison (same chief complaint)  
6. Unrelated-report contamination rejection  
7. Polarity resolution / UNRESOLVED  
8. Prakriti / temperament / constitution paths  
9. No default WE  
10. Formula-specific potency + electricity  
11. Full-pool Tablet A selection  
12. Full-pool Tablet B selection  
13. Empty Section B → `NO_CLINICALLY_JUSTIFIED_CANDIDATE`  
14. Site-specific external application  
15. Uncertain/unknown findings → doctor review required  
16. Frontend never invents medicines when engine fails  

## Fingerprint gates

Each golden emits:

- clinical result fingerprint  
- mixture count  
- medicine ID set (ordered)  
- potency/elec per slot  
- tablet statuses  
- external evidence_status  
- version stamps  

Mismatches fail CI without printing PHI.
