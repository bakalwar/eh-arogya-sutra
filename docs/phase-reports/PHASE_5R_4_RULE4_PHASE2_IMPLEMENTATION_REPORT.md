# Phase 5R-4 Rule 4 Phase 2 — patient-wide safety gate (shadow-only)

**Worktree:** `%TEMP%\ehas2_rule4_implementation_phase2_wt`
**Branch:** `phase-5r/rule4-implementation-phase2`
**Base commit:** `59152afc08d1cd0212a72ffc10d12324138f9c6b`

## Phase 2 correction pass (validation blockers)

| Blocker | Fix |
|--------|-----|
| DOB vs upstream band | Canonical band from verified DOB + assessment; if verified upstream P13 disagrees → `CONTRADICTORY`, `VERIFIED_AGE_CONTRADICTORY`, `DOB_UPSTREAM_PEDIATRIC_BAND_CONFLICT`; no silent DOB preference; no D13-HS from contradictory age |
| Upstream provenance | Controlled `age_source` enum; missing/invalid → `UNRESOLVED`, `UPSTREAM_AGE_BAND_PROVENANCE_MISSING` |
| Source-critical / red flags | Structured findings only; allowlist in `fixtures/rule4/phase2-allowed-critical-codes.v1.json`; unknown → no escalation, `UNRESOLVED` slots |
| Registry merge | `registry_merge.py` + `registryMerge.ts`; duplicate conflict → `Rule4RegistryMergeError` |
| Shared scenarios | `fixtures/rule4/safety-gate-scenarios.v1.json` (35 scenarios) — TS + Python parity on normalized fields |
| Fingerprint | `rule4-safety-fingerprint-v1` and `rule4-empty-result-fingerprint-v1` — cross-language byte-identical SHA-256 (uppercase) |

### Controlled critical / red-flag codes (Phase 2 allowlist)

**Source-declared (Q16-H):** `SOURCE_DECLARED_CRITICAL`, `SOURCE_DECLARED_LIFE_THREATENING`, `SOURCE_DECLARED_URGENT`
**Frozen red flag (Q4F):** `ACUTE_NEUROLOGICAL_RED_FLAG`
**Fixture:** `fixtures/rule4/phase2-allowed-critical-codes.v1.json`

### Contradiction behavior (summary)

- Verified DOB pair + verified upstream P13 **match** → DOB resolution stands.
- **Mismatch** → age `CONTRADICTORY`, band null, gate `UNRESOLVED`, slots `UNRESOLVED`, no safety clear, no D13-HS inference from band.
- Invalid upstream enum with valid DOB → upstream ignored; DOB resolution only.

### BP multi-reading matrix (Python `Rule4BpMultiReadingTests`)

Contradictory-only, historical-only, historical+current crisis, invalid sibling+crisis, duplicate non-crisis, duplicate crisis, crisis+non-crisis, single-unconfirmed high, repeated-confirmed crisis — no averaging, any-valid-crisis OR logic.

## Delivered (implementation + corrections)

- Phase 2 safety contract (`ehas2-rule4-contract-v1-phase2-safety`)
- Calendar DOB vs assessment age bands (P13-A–E); leap-year handling
- Q06C patient-wide BP crisis (mmHg only; OR thresholds 180/110)
- D13-HS under-one hard stop
- Hold aggregator (explicit holds, structured critical, frozen red flags)
- Phase 2 reason-code subset registry (merge hardened with Phase 1)
- TS + Python parity; shadow envelope `RULE4_SHADOW_PHASE2`
- Default mode **off**; public orchestrator unchanged

## Not delivered

- Potency cascade, D10/D30 cardiac paths, non-BP catalog thresholds, persistence/UI/API activation

## Phase 2 final correction pass

- **rule4-safety-fingerprint-v1** — shared snake_case canonical JSON + uppercase SHA-256 (TS/Python byte-identical); fixture reference on `valid-adult-clear`
- **rule4-empty-result-fingerprint-v1** — cross-language full Phase 2 empty-evaluator fingerprint (embeds safety v1 hash; sorted slots)
- **OWNER_STRUCTURED** removed from upstream age band authority → `UPSTREAM_AGE_SOURCE_NOT_AUTHORIZED`
- Shared fixture expanded (35 scenarios) including full P13 boundary matrix + fingerprint reference
- Raw lab keyword → `safety_gate_status` **UNRESOLVED** (no clear/cascade contradiction)
- Invalid calendar DOB/assessment strings → **INVALID** (fail-closed)

**STOP — RULE 4 PHASE 2 COMMITTED · WAIT FOR OWNER APPROVAL BEFORE PHASE 3**
