# Nine-rule engine matrix (Phase 5A)

**Verdict:** Canonical nine-rule **pipeline = PARTIAL**
**Source found:** YES (branded `9-rule-v4.0`)
**Clean isolated nine engines:** NO — one orchestrator (`MultiDiseaseEngine`) with interleaved modules
**Conflicting naming maps:** ≥4 (EH_9 audit, EH_CORE Siddhant, MASTER_9 UCKB, consensus/PDF)

> **R5-M1a:** Documentation alignment only. Current v1 contract, synthetic orchestration, dashboard, and test surfaces retain pre-migration Rule 5 metadata until separately authorized **R5-M1b**. No runtime or clinical behavior changes in R5-M1a.

## Canonical names (EH_9 audit — do not invent)

From `docs/EH_9_RULE_ENGINE_AUDIT/01_RULE_ENGINE_LIST.md` in the old project:

1. Temperament (Prakriti)
2. Polarity
3. Organ / System Affinity
4. Potency
5. Monitoring, Follow-up & Post-Release Safety Surveillance
6. Multi-Disease / Organ-System Triad
7. External Use Routes
8. Disease-level Prakruti Inference
9. Master Pipeline

**EHAS2 Rule 5 authority (R5-M0):** Rule 5 is **not** Dosage. Owner-approved identity and post-release scope: [rules/rule-05-owner-decisions-R5-M0.md](./rules/rule-05-owner-decisions-R5-M0.md). EHAS2 implementation **NOT_IMPLEMENTED** · runtime **NOT_CONNECTED**. Dosage scheduling/generation remains **`DOSAGE_ENGINE_AUDIT_PENDING`** (unnumbered, non-authoritative). Legacy `calc_dosage` and related MDE dosage paths below are **LEGACY_REFERENCE_ONLY** — not EHAS2 clinical authority for Rule 5. v1 code metadata may still say **Dosage** until **R5-M1b**.

## Live execution order (truthful)

Not 1→9 sequential engines. Observed MDE order:

```
chief_complaint → systems (R3) → prakriti (R1) → constitution
→ mixture_plans (R6 planning) → per mix: polarity (R2) → formula/score (R6)
→ potency (R4) → dosage (R5 hybrid) → external (R7) → tablet (unnumbered)
→ summary / Phase F (presentation)
→ optional eh_master_clinical_state (shadow, non-mutating)
```

*(Legacy diagram: “dosage (R5 hybrid)” describes old MDE interleaving — **LEGACY_REFERENCE_ONLY**; EHAS2 Rule 5 canonical responsibility is post-release monitoring per R5-M0.)*

## Rule matrix

| Rule | Source | Inputs | Outputs | Clinical effect | Fallback | Test | Migration decision |
|------|--------|--------|---------|-----------------|----------|------|-------------------|
| 1 Temperament | `MultiDiseaseEngine.detect_prakriti`; `clinical_engines.detect_prakriti` | symptoms, BP | Lymphatic/Sanguine/Bilious/Nervous/**UNKNOWN** | Selection boost | UNKNOWN if no evidence | Partial | Migrate; unify photo temperament |
| 2 Polarity | Live: `formula_polarity_policy_engine`; legacy `detect_polarity` | slot/case context | POSITIVE/NEGATIVE/MIXED/UNRESOLVED | Selection + potency | UNRESOLVED→MIXED for legacy scoring | `test_formula_polarity_policy_engine.py` | Keep policy engine; deprecate dual path |
| 3 Organ/System | `integrated_engine.detect_systems`; `detect_active_systems` | symptoms, gender, CC | systems + details | Plans + boosts | keyword / METABOLIC last resort | Partial | First detector; disease-pack only |
| 4 Potency | `potency_engine.get_unified_clinical_potency` | polarity, phase, BP, severity, age, system | dilution | Mixture dilution | Internal defaults | potency metadata tests | Single SoT |
| 5 Monitoring (EHAS2 canonical) · legacy dosage path **LEGACY_REFERENCE_ONLY** | **Legacy (not Rule 5 authority):** `calc_dosage` then MDE potency-band override | age, polarity, phase, dilution | drops + schedule (legacy app) | Legacy admin + schedule only | age→40; polarity→MIXED | Weak | **Dosage engine:** **`DOSAGE_ENGINE_AUDIT_PENDING`**. **Rule 5 EHAS2:** post-release monitoring — **NOT_IMPLEMENTED** / **NOT_CONNECTED**; do not treat legacy helpers as EHAS2 Rule 5 implementation |
| 6 Multi-Disease/Triad | **EHAS2 canonical contract:** [rules/rule-06-multi-disease-organ-system-triad-contract.md](./rules/rule-06-multi-disease-organ-system-triad-contract.md) (`MULTI_DISEASE_ORGAN_SYSTEM_TRIAD`, owner-locked). **Post-merge shadow evaluator evidence:** [rules/rule-06-multi-disease-organ-system-triad-implementation-evidence.md](./rules/rule-06-multi-disease-organ-system-triad-implementation-evidence.md) (`RULE6_SHADOW_EVALUATOR_IMPLEMENTED`, PR #84). **Relationship-data / evidence-intake contract:** [rules/rule-06-relationship-data-and-evidence-intake-contract.md](./rules/rule-06-relationship-data-and-evidence-intake-contract.md) (`R6_CE_OD01_TO_OD05_RECOMMENDED_DECISIONS_APPROVED`; active registry **EMPTY**). Package `@ehas2/rule6` / `evaluateRule6Shadow`. Legacy row (reference only): `disease_registry` / synthesizer / `medicine_confidence_engine` / `formula_generator` | Canonical shadow inputs per contract; legacy: diseases, systems, CC, temperament, polarity | Shadow candidates / compositions per contract; legacy: `mixture_plans` + liquids | **Shadow-only**; orchestration **NOT_CONNECTED**; clinical activation **NONE**; legacy “primary oral selection” = LEGACY_REFERENCE_ONLY | No legacy fill/replace in EHAS2 | P01–P20 + 24 regressions on main (PR #84) | EHAS2: identity/scope/contract documented · shadow evaluator **IMPLEMENTED** · real relationships **0** / empty active registry / `RULE6_VALIDATED_RELATIONSHIP_DATA_PENDING` · mixture **count** owned by Rule 9 / §F · electricity **not** Rule 6 · independent of Rule 5 C3E |
| 7 External | **EHAS2 canonical contract:** [rules/rule-07-external-use-routes-contract.md](./rules/rule-07-external-use-routes-contract.md) (`EXTERNAL_USE_ROUTES`, owner-locked, `R7_ID01_TO_ID05_RECOMMENDED_DECISIONS_APPROVED`). **Post-merge shadow evaluator evidence:** [rules/rule-07-external-use-routes-implementation-evidence.md](./rules/rule-07-external-use-routes-implementation-evidence.md) (`RULE7_SHADOW_EVALUATOR_IMPLEMENTED`, PR #88). Package `@ehas2/rule7` / `evaluateRule7Shadow`. Legacy row (reference only): `external_application_engine.build_external_routes` | Canonical shadow inputs per contract; legacy: systems, symptoms, BP, phase, CC | Shadow route/site indication or `NOT_CLINICALLY_INDICATED`; legacy: routes | **Shadow-only**; orchestration **NOT_CONNECTED**; clinical activation **NONE**; no external medicine/instructions in this stage; legacy = LEGACY_REFERENCE_ONLY | No oral→external copy; no legacy fill/replace in EHAS2 | P01–P16 + R01–R10 on main (PR #88) | EHAS2: identity/scope/contract documented · shadow evaluator **IMPLEMENTED** · real route/site mappings **0** / `RULE7_CLINICAL_EVIDENCE_PENDING` · fail-closed · independent of Rule 5 C3E and Rule 6 relationship data |
| 8 Disease Prakruti | **EHAS2 canonical contract:** [rules/rule-08-disease-level-prakruti-inference-contract.md](./rules/rule-08-disease-level-prakruti-inference-contract.md) (`DISEASE_LEVEL_PRAKRUTI_INFERENCE`, owner-locked, `R8_ID01_TO_ID05_RECOMMENDED_DECISIONS_APPROVED`). **Post-merge shadow evaluator evidence:** [rules/rule-08-disease-level-prakruti-inference-implementation-evidence.md](./rules/rule-08-disease-level-prakruti-inference-implementation-evidence.md) (`RULE8_SHADOW_EVALUATOR_IMPLEMENTED`, PR #92). Package `@ehas2/rule8` / `evaluateRule8Shadow`. Legacy row (reference only): `infer_disease_prakruti` / `resolve_prakriti` | Canonical shadow inputs per contract; legacy: disease name / DB votes | Shadow disease-level prakriti indication or `NOT_CLINICALLY_INDICATED`; legacy: temperament label | **Shadow-only**; orchestration **NOT_CONNECTED**; clinical activation **NONE**; medicine-selection influence **NONE**; prescription effect **NONE**; `NOT_REQUIRED_FOR_PRESCRIPTION`; real approved mappings **0**; production mapping registry empty; clinical dashboard remains **`NOT_IMPLEMENTED`**; legacy = LEGACY_REFERENCE_ONLY | No Rule 1 overwrite/silent merge; no medicine/formula authority | P01–P16 + R01–R12 on main (PR #92) | EHAS2: identity/scope/contract documented · shadow evaluator **IMPLEMENTED** · fail-closed · separate from Rule 1 · independent of Rule 5 C3E / Rule 6 edges / Rule 7 mappings · `RULE8_CLINICAL_EVIDENCE_PENDING` |
| 9 Master Pipeline | **EHAS2 canonical contract:** [rules/rule-09-master-pipeline-contract.md](./rules/rule-09-master-pipeline-contract.md) (`MASTER_PIPELINE`, owner-locked, `R9_ID01_TO_ID05_RECOMMENDED_DECISIONS_APPROVED`). Legacy row (reference only): `generate_complete_formula` / MDE loop / `mixture_count_engine` | Canonical shadow inputs per contract (Rules 1–8 envelopes + approved complexity-tier input); legacy: full case | Shadow package or typed fail-closed (`INSUFFICIENT_CLINICAL_EVIDENCE` / count / contradiction); legacy: packaged Rx | **Shadow-only** until separate impl/orchestration auth; validate/reject/package **only**; clinical activation **NONE**; medicine-selection influence **NONE**; prescription effect **NONE**; no composition mutation; legacy = LEGACY_REFERENCE_ONLY | No new selection; no filler; OD-014 fail-closed | Contract proof matrix pending impl | EHAS2: identity/scope/contract documented · impl **NOT_AUTHORIZED** · not a 9th medicine selector · §F/OD-013/014 count validate-or-reject · complexity tier separate input · independent of Rule 5 C3E |

## Unnumbered but clinically material

| Module | Role |
|--------|------|
| Chief complaint engine | Pre-rule gate |
| Constitution engine | Sibling of R1/R8 |
| Oral electricity policy | Formula electricity (no default WE on canonical path) — **separate pending sibling track; not Rule 6** (R6-ID-05). Historical `RULE_6_AUDIT_PENDING` ownership claims are superseded for EHAS2 Rule 6 authority. |
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
5. Dual dosage (helper vs potency-band override) — **Dosage track `DOSAGE_ENGINE_AUDIT_PENDING`**; not conflated with EHAS2 Rule 5 monitoring identity
6. Isolation suite marks “9 Rule Engines (isolated)” as PARTIAL

## Migration decision summary

Adopt **EH_9 code-numbered list** as the EHAS2 vocabulary, implement as **versioned orchestrated stages** (not nine separate microservices initially), and require owner decision on:

- whether Rule 8 becomes **clinically activated** (identity/scope owner-locked; shadow evaluator implemented on main via PR #92; clinical activation / orchestration / real mappings remain separate owner decisions)
- whether Rule 9 shadow implementation / orchestration / clinical activation proceeds (identity/scope now owner-locked; canonical contract documented; complexity-classifier contract and impl remain separate)
- whether EH_CORE Complexis remains shadow-only
- whether MASTER_9 UCKB map is retired
