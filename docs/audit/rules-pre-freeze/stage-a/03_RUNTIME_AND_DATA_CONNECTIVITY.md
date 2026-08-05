# Stage A — Runtime and data connectivity

**Baseline SHA:** `658f3fd97e1e00fcafef74ddd3788d2cfa3bf1d7`

## API connectivity (`/api/eh-as-2/v1/`)

| Path / surface | Evidence | Classification |
|----------------|----------|----------------|
| `/health`, `/ready` | `README.md` L60–61 | **NON_PRODUCTION_CONNECTED** (liveness only) |
| `/api/eh-as-2/v1/analysis` | `README.md` L65 — **501 NOT_IMPLEMENTED** | **NOT_IMPLEMENTED** |
| `POST /v1/analyze-complete` | `docs/clinical/nine-rule-orchestration.md`; `prescription-boundary.md` L24 | **NOT_CONNECTED** — `CLINICAL_ENGINE_NOT_CONNECTED` (501) |
| Auth / profile routes | Phase 3D/4A — session shell | **NON_PRODUCTION_CONNECTED** (OTP **NOT_CONFIGURED**) |

**Production API clinical rules execution:** **NOT_CONNECTED**

## Adapter and orchestrator

| Component | Path | Classification | Notes |
|-----------|------|------------------|--------|
| `EHAS2ClinicalEngineAdapter` | `packages/engine-adapter/src/index.ts` | **NOT_IMPLEMENTED** | Throws Phase 6 message |
| `ORCHESTRATION_STATUS` | `nineRules.ts` L119 | **NOT_CONNECTED** | Production orchestration |
| `VALIDATION_ORCHESTRATION_STATUS` | `nineRules.ts` L121 | **SYNTHETIC_VALIDATION_ONLY** | 5C label |
| Python `orchestrator.py` | `apps/clinical-engine/...` | **SYNTHETIC_VALIDATION_ONLY** | Golden tests / preview |
| Rule 4 shadow hook | Phase 5R reports; `rule4` contracts | **SHADOW_ONLY** | Default **off**; no public mutation |
| Prescription generator | `PRESCRIPTION_ENGINE_NOT_CONNECTED` (`nineRules.ts` L122) | **NOT_CONNECTED** | |
| Summary renderer | Phase 1C-C UX (local) | **NON_PRODUCTION_CONNECTED** | Not live clinical pipeline |
| Persistence services | Phase 3B–3D | **NON_PRODUCTION_CONNECTED** | No production patient DB deploy |

## Per-rule runtime reachability (summary)

| Rule | Production API | Synthetic 5C | Shadow | Prescription consumer |
|------|----------------|-------------|--------|------------------------|
| 1 | **NOT_CONNECTED** | Interpretation step only | No | **NOT_CONNECTED** |
| 2 | **NOT_CONNECTED** | Interpretation step only | No | **NOT_CONNECTED** |
| 3 | **NOT_CONNECTED** | Systems step (≠ owner spec) | No | **NOT_CONNECTED** |
| 4 | **NOT_CONNECTED** | Stub / shadow contracts | **SHADOW_ONLY** | **NOT_CONNECTED** |
| 5 | **NOT_CONNECTED** | Dosage stub row in 5C | No | **NOT_CONNECTED** |
| 6 | **NOT_CONNECTED** | Mixture planning in 5C | No | **NOT_CONNECTED** |
| 7 | **NOT_CONNECTED** | External stub | No | **NOT_CONNECTED** |
| 8 | **NOT_IMPLEMENTED** | Explicit NOT_IMPLEMENTED | No | **NOT_CONNECTED** |
| 9 | **NOT_CONNECTED** | Wrapper executes in tests | No | **NOT_CONNECTED** |

**Distinction enforced:** Passing **Vitest** / Python unit tests on synthetic orchestrator ≠ production integration.

## Data / package connectivity

| Asset | Evidence | Status |
|-------|----------|--------|
| **116k / 116,284** disease package | `README.md`; `clinical-data-manifest`; extract tooling | **TOOLING_ONLY** / **NOT_INSTALLED** live (`DATA_PACKAGE_NOT_INSTALLED`) |
| Disease-data versioning | Package manifest contracts | **CONTRACT_ONLY** |
| **39-medicine** registry | `@ehas2/medicine-registry`; constitution Tablet A/B | **PACKAGE_PRESENT_NOT_CONNECTED** to prescription engine |
| Medicine-data versioning | Registry package metadata | **CONTRACT_ONLY** |
| Clinical artifact package | `clinical-artifacts` placeholder (5C) | **PLACEHOLDER** |
| Legacy database | ADR 001 separation; no legacy import | **NOT_FOUND** in EHAS2 runtime |
| Extract/bootstrap | `tools/clinical-extract/` | **TOOLING_ONLY** |
| Runtime consumption in analyze | Adapter NOT_IMPLEMENTED | **NOT_CONNECTED** |
| Prescription-engine consumption | NOT_CONNECTED | **NOT_CONNECTED** |

## Truthful connectivity verdict

At baseline **`658f3fd`**, EHAS2 **does not** expose production clinical rule execution through the public API. Rules 1–9 appear as **contracts**, **documentation**, **synthetic validation**, and **Rule 4 shadow-capable contracts** only. **No** prescription issuance path consumes live rule outputs.

## Evidence

- `packages/engine-adapter/src/index.ts` — NOT_IMPLEMENTED
- `docs/clinical/nine-rule-orchestration.md` — synthetic only; 501 analyze-complete
- `docs/phase-reports/PHASE_5C_NINE_RULE_VALIDATION_REPORT.md` — Production AnalyzeComplete NOT_CONNECTED
- `README.md` — explicit absent features list
