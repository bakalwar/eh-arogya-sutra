# Phase 5R-4 — Rule 4 Phase 1 implementation report

**Baseline documentation commit:** `4c35469b9e9ba104e4097ddc48649b0aaa3761b4`
**Branch:** `phase-5r/rule4-implementation-phase1`
**Scope:** Non-clinical foundation only — **no patient-facing activation**

## Delivered

- Versioned **Rule4InputContract** / **Rule4Result** / **Rule4SlotResult** (TypeScript + Python)
- **Phase 1 foundation subset** reason/limitation registry (`fixtures/rule4/reason-code-registry.phase1-foundation-subset.v1.json`) — **`scope = PHASE1_FOUNDATION_SUBSET`**, **`complete = false`**, full mechanical harvest **pending**
- **Unknown-code policy:** `REJECT_UNKNOWN_CODE` — evaluator output `reason_codes` / `limitation_codes` validated fail-closed (TS + Python)
- **Feature mode:** `RULE4_ENGINE_MODE` = `off` (default) | `shadow` | `active` (blocked in Phase 1)
- **Empty deterministic evaluator** — always `execution_status = NOT_IMPLEMENTED`
- **Orchestrator shadow hook** — runs empty evaluator in shadow mode; shadow envelope is delivered **only** to an **optional injected collector** on `OrchestratorRun.rule4_shadow_collector` (validation/tests). **No module-global mutable sink.** Production orchestration does **not** inject a collector — shadow output is **not retained, exposed, logged, or persisted**. Public orchestrator JSON is **unchanged** in shadow mode.

## Not delivered (by design)

- No potency cascade, polarity routing, phase/severity inference, pediatric overlay, temperament, issuance
- No complete Rule 4 reason/limitation registry (clinical cascade codes not harvested in Phase 1)
- No database migrations, API `/analysis` changes, or analyze-complete activation
- No paid/external clinical APIs
- No approved telemetry/persistence for Rule 4 shadow output (future phase)

## Feature flag

| Mode | Behavior |
|------|----------|
| `off` (default) | No Rule 4 side effects; orchestrator response unchanged |
| `shadow` | Empty evaluator runs; envelope passed **only** if a collector is injected on the run; otherwise discarded; **no** public payload mutation |
| `active` | `RULE4_ENGINE_MODE_ACTIVE_NOT_IMPLEMENTED` — orchestration error |

## Contract version

`ehas2-rule4-contract-v1-phase1`

## Registry version

`rule4-reason-codes-phase1-foundation-subset-v1`

## Runtime truthfulness

- `automatic_potency_runtime = false`
- `automatic_prescription_issuance_runtime = false`
- `automatic_issuance` / issuance paths unchanged — **false** / not connected
- **Clinical potency selection:** **NOT_IMPLEMENTED**

## Tests

- `tests/unit/rule4-phase1-contracts.test.ts`
- `apps/clinical-engine/tests/test_rule4_phase1.py`

## Limitations

- Registry is **not** the full frozen-doc code harvest; `fullRegistryStatus = FUTURE_MECHANICAL_HARVEST_PENDING`
- `GLOBAL_TEXT_NOT_RULE4_SELECTOR_INPUT` is an implementation-boundary code (registry `source` field), not a rewrite of frozen clinical bodies
- Shadow envelopes exist only in **request-local collector objects** supplied by tests/validation harnesses

**STOP — RULE 4 PHASE 1 FOUNDATION ONLY · WAIT FOR OWNER FINAL VALIDATION BEFORE PHASE 2**
