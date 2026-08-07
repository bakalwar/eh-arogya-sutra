# Prescription readiness matrix (Phase 5C-G)

Audit only — **no prescription code activated**. Sources: Phase 5A `prescription-pipeline-audit.md`, nine-rule matrix, owner constitution, Phase 5C boundary.

Classification key: `READY` · `REQUIRES_RECONSTRUCTION` · `LEGACY_CONFLICT` · `MISSING_EVIDENCE` · `BLOCKED` · `OWNER_DECISION_REQUIRED`

| Item | Legacy source | Inputs | Outputs | Conflict | Migration decision | Class |
|------|---------------|--------|---------|----------|-------------------|-------|
| Oral mixture generator | `formula_generator` / MDE analyze | diseases, systems, CC, polarity, temperament | `mixtures[]` | None for oral core | Port into isolated engine | **REQUIRES_RECONSTRUCTION** |
| 3/4/5 complexity rule | `mixture_count_engine.decide_mixture_count` | complexity / treatability | exactly 3\|4\|5 or 0 | Owner: never 1–2 | Preserve; unresolved → 0 | **READY** (spec MATCH) |
| Medicine scoring | `medicine_confidence_engine` | candidates, evidence | ranked scores | Dual paths partial | Single scoring SoT | **REQUIRES_RECONSTRUCTION** |
| Zero unjustified repetition | oral exclude-used; tablet allows intentional | used-med set | non-repeating oral | Tablet intentional repeats | Oral strict; tablet policy explicit | **REQUIRES_RECONSTRUCTION** |
| Polarity | `formula_polarity_policy_engine` (+ legacy detect) | case/slot | POS/NEG/MIXED/UNRESOLVED | Dual engines; UNRESOLVED→MIXED coerce | Keep policy engine; no silent coerce in EHAS2 | **REQUIRES_RECONSTRUCTION** |
| Potency | `get_unified_clinical_potency` | polarity, phase, BP, severity, age, system | dilution per mixture | Tablet PARTIAL | Formula-specific oral first | **REQUIRES_RECONSTRUCTION** |
| Electricity | `select_oral_electricity_for_mixture` | MM evidence | electricity or unresolved reason | Legacy summary WE defaults | No default WE; unresolved + reason | **REQUIRES_RECONSTRUCTION** |
| No-default-WE | POLICY-004-WE oral | MM evidence | WE only if evidenced | Non-canonical summary paths | Scrub presentation defaults | **READY** (policy MATCH oral) |
| Tablet Section A | `build_section_a_from_oral_mixtures` | finalized oral | section A meds | `derived_from_oral: True` vs owner full pool | Independent canonical **38**-medicine v2 pool (CQ-001A; **C11 excluded**) | **LEGACY_CONFLICT** |
| Tablet Section B | meal-slot tablet builder | slots, evidence | slot meds or empty contract | Oral-linked pool in prod | Independent **38**-medicine v2 pool + slots (**C11 excluded**) | **LEGACY_CONFLICT** |
| Full-pool independent tablet selection | shadow / env OFF in prod | `ehas2-medicine-registry-v2` (**38**; **C11 excluded**; no remapping) | independent A/B | Production oral-copy | Owner rule wins; tablet engine **NOT_IMPLEMENTED** / **NOT_CONNECTED** | **OWNER_DECISION_REQUIRED** (cutover) |
| Section B timing slots | tablet B slots | before/after/night evidence | med or `NO_CLINICALLY_JUSTIFIED_CANDIDATE` | None on empty contract | Preserve empty contract | **READY** (empty contract MATCH) |
| `NO_CLINICALLY_JUSTIFIED_CANDIDATE` | Section B empty | missing slot evidence | explicit status | None | Keep; never fabricate | **READY** |
| External applications | `external_application_engine.build_external_routes` | systems, site, symptoms, BP, phase | routes or NOT_CLINICALLY_INDICATED | Legacy oral-copy env OFF | Evidence/site based; no oral-copy | **REQUIRES_RECONSTRUCTION** |
| Affected-site selection | external composer | site + organ evidence | site-bound externals | None if evidence-gated | Required for externals | **REQUIRES_RECONSTRUCTION** |
| Safety blocking | MDE safety / red flags | vitals, aggravation | block / warnings | Partial legacy | Block dependent Rx selection | **REQUIRES_RECONSTRUCTION** |
| Doctor review | review gate | clinician decision | issue only after review | Weak enforcement historically | Hard gate before issue | **REQUIRES_RECONSTRUCTION** |
| Summary / prescription separation | Phase F presentation | packaged Rx | display must not invent meds | Phase F presentation-only | Summary non-authoritative | **READY** (policy) |

## Aggregate readiness for Phase 5D

| Area | Status |
|------|--------|
| Oral | REQUIRES_RECONSTRUCTION (spec largely MATCH) |
| Potency | REQUIRES_RECONSTRUCTION |
| Electricity | REQUIRES_RECONSTRUCTION |
| Tablet A | LEGACY_CONFLICT |
| Tablet B | LEGACY_CONFLICT |
| External | REQUIRES_RECONSTRUCTION |
| Prescription engine (EHAS2 live) | **NOT_CONNECTED** / BLOCKED until 5D |

Phase 5D may start **only after** owner decisions on Tablet full-pool cutover, Rule 8, and minimum-3 vs insufficient-evidence policy (see `mixture-evidence-safety-policy.md`).
