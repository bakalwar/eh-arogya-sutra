# Nine-rule engine matrix (Phase 5A)

**Verdict:** Canonical nine-rule **pipeline = PARTIAL**  
**Source found:** YES (branded `9-rule-v4.0`)  
**Clean isolated nine engines:** NO — one orchestrator (`MultiDiseaseEngine`) with interleaved modules  
**Conflicting naming maps:** ≥4 (EH_9 audit, EH_CORE Siddhant, MASTER_9 UCKB, consensus/PDF)

## Canonical names (EH_9 audit — do not invent)

From `docs/EH_9_RULE_ENGINE_AUDIT/01_RULE_ENGINE_LIST.md` in the old project:

1. Temperament (Prakriti)  
2. Polarity  
3. Organ / System Affinity  
4. Potency  
5. Dosage  
6. Multi-Disease / Organ-System Triad  
7. External Use Routes  
8. Disease-level Prakruti Inference  
9. Master Pipeline  

## Live execution order (truthful)

Not 1→9 sequential engines. Observed MDE order:

```
chief_complaint → systems (R3) → prakriti (R1) → constitution
→ mixture_plans (R6 planning) → per mix: polarity (R2) → formula/score (R6)
→ potency (R4) → dosage (R5 hybrid) → external (R7) → tablet (unnumbered)
→ summary / Phase F (presentation)
→ optional eh_master_clinical_state (shadow, non-mutating)
```

## Rule matrix

| Rule | Source | Inputs | Outputs | Clinical effect | Fallback | Test | Migration decision |
|------|--------|--------|---------|-----------------|----------|------|-------------------|
| 1 Temperament | `MultiDiseaseEngine.detect_prakriti`; `clinical_engines.detect_prakriti` | symptoms, BP | Lymphatic/Sanguine/Bilious/Nervous/**UNKNOWN** | Selection boost | UNKNOWN if no evidence | Partial | Migrate; unify photo temperament |
| 2 Polarity | Live: `formula_polarity_policy_engine`; legacy `detect_polarity` | slot/case context | POSITIVE/NEGATIVE/MIXED/UNRESOLVED | Selection + potency | UNRESOLVED→MIXED for legacy scoring | `test_formula_polarity_policy_engine.py` | Keep policy engine; deprecate dual path |
| 3 Organ/System | `integrated_engine.detect_systems`; `detect_active_systems` | symptoms, gender, CC | systems + details | Plans + boosts | keyword / METABOLIC last resort | Partial | First detector; disease-pack only |
| 4 Potency | `potency_engine.get_unified_clinical_potency` | polarity, phase, BP, severity, age, system | dilution | Mixture dilution | Internal defaults | potency metadata tests | Single SoT |
| 5 Dosage | `calc_dosage` then MDE potency-band override | age, polarity, phase, dilution | drops + schedule | Admin + schedule | age→40; polarity→MIXED | Weak | Split drops helper vs schedule |
| 6 Multi-Disease/Triad | `disease_registry` / synthesizer / `medicine_confidence_engine` / `formula_generator` | diseases, systems, CC, temperament, polarity | `mixture_plans` + liquids | **Primary oral selection** | fill/replace controls | fixtures + suite | Core selection package |
| 7 External | `external_application_engine.build_external_routes` | systems, symptoms, BP, phase, CC | routes or NOT_CLINICALLY_INDICATED | Route selection | NOT_CLINICALLY_INDICATED valid | `test_external_*` | Keep evidence-gated |
| 8 Disease Prakruti | `infer_disease_prakruti` / `resolve_prakriti` | disease name / DB votes | temperament label | **Docs claim clinical; live MDE does not call** | Balanced | Docs only | Wire deliberately or demote dormant |
| 9 Master Pipeline | Brand: `generate_complete_formula` + uniqueness; live: MDE loop | full case | packaged Rx | Orchestration label | unresolved empty mixtures | isolation=PARTIAL | Treat as orchestrator, not 9th selector |

## Unnumbered but clinically material

| Module | Role |
|--------|------|
| Chief complaint engine | Pre-rule gate |
| Constitution engine | Sibling of R1/R8 |
| Oral electricity policy | Formula electricity (no default WE on canonical path) |
| Tablet globules engine | Post-oral complementary — **not** Rule N |
| Phase F / summary | Presentation after selection |

## Safety / unknown behavior

| Concern | Behavior |
|---------|----------|
| Temperament | UNKNOWN when no evidence (no silent Lymphatic) |
| Polarity unresolved | Scoring may coerce MIXED |
| External | NOT_CLINICALLY_INDICATED is success-path empty |
| Safety check | Partial aggravation (POS+low D / NEG+high D) |
| Validation | Up to 2 retries with blocked systems |
| Unresolved case | `status: unresolved`, 0 mixtures |

## Conflicting implementations (must resolve before EHAS2 integration)

1. EH_9 vs EH_CORE vs MASTER_9 vs consensus/PDF taxonomies  
2. Rule 6 triad vs Complexis vs PDF aggravation  
3. Rule 8 APIs unwired on live MDE path  
4. Dual polarity engines  
5. Dual dosage (helper vs potency-band override)  
6. Isolation suite marks “9 Rule Engines (isolated)” as PARTIAL  

## Migration decision summary

Adopt **EH_9 code-numbered list** as the EHAS2 vocabulary, implement as **versioned orchestrated stages** (not nine separate microservices initially), and require owner decision on:

- whether Rule 8 becomes live  
- whether EH_CORE Complexis remains shadow-only  
- whether MASTER_9 UCKB map is retired
