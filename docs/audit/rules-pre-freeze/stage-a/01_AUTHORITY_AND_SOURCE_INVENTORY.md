# Stage A — Authority and source inventory

**Baseline SHA:** `658f3fd97e1e00fcafef74ddd3788d2cfa3bf1d7` (`origin/main`)  
**Method:** `git ls-files`, repository search (`rg`), full read of constitution + mixture policy + key status docs, sampled complete reads of rule specs and orchestration docs.

## Authority hierarchy (Stage A)

1. Explicit owner approval (constitution OD-013, OD-014; rule owner-decision registers where marked OWNER-APPROVED)
2. `docs/clinical/CLINICAL_PRODUCT_CONSTITUTION.md`
3. Approved owner decisions (OD-013, OD-014; rule-0x-owner-decisions.md)
4. Formally owner-approved / frozen rule specifications (Rules 1–3 non-DRAFT; Rule 4 **DRAFT** filename)
5. Security / patient-safety requirements (constitution, mixture-evidence-safety-policy)
6. ADRs (`docs/adr/*.md`)
7. Current EHAS2 implementation (`packages/clinical-contracts`, `apps/clinical-engine`, API shell)
8. Tests, golden fixtures, Phase 5C synthetic validation
9. Legacy references (`nine-rule-engine-matrix.md` MDE column, old-engine audits)

Code and tests are **not** automatically normative clinical authority.

## Source counts (tracked files, baseline)

| Category | Count (git ls-files) | Notes |
|----------|----------------------|--------|
| `packages/clinical-contracts/src/rule4/**` | 104 | Rule 4 contracts/adapters only on `main` |
| `docs/clinical/rules/**` | 17 | Rules 1–4 specs; **no** `rule-05-*` on `main` |
| `tests/unit/rule4*` | 56 | Rule 4 unit coverage |
| `apps/clinical-engine/**` (tracked) | 118 | Python orchestrator + tests (excludes `.venv` if untracked) |
| Rule 5 monitoring spec on `main` | **0** | Not found at baseline |

## Representative inventory (by authority tier)

Full row-level inventory for every file would exceed Stage A readability; below are **indexed anchors** plus **bundled groups**. Every Rules 1–9 claim in Stage A traces to one of these IDs or the identity matrix (file 02).

### Tier 1 — Owner-approved normative (documentation)

| ID | Rule | Path | Section / symbol | Authority | Runtime reach |
|----|------|------|------------------|-----------|---------------|
| AUTH-001 | All | `docs/clinical/CLINICAL_PRODUCT_CONSTITUTION.md` | §D Rules 1–3; §F oral mixtures; OD-013; OD-014 | **OWNER_APPROVED** | **CONTRACT_ONLY** — guard strings; not production engine |
| AUTH-002 | All | `docs/clinical/mixture-evidence-safety-policy.md` | OD-014; OD-013 cross-ref | **OWNER_APPROVED** | **CONTRACT_ONLY** |
| AUTH-003 | 1 | `docs/clinical/rules/rule-01-temperament-engine.md` | Full spec | **FORMALLY_FROZEN_SPEC** (5R-1F) | **NOT_IMPLEMENTED** production |
| AUTH-004 | 1 | `docs/clinical/rules/rule-01-owner-decisions.md` | Owner register | **OWNER_APPROVED** | Docs |
| AUTH-005 | 2 | `docs/clinical/rules/rule-02-polarity-engine.md` | Full spec | **FORMALLY_FROZEN_SPEC** (5R-2F) | **NOT_IMPLEMENTED** production |
| AUTH-006 | 2 | `docs/clinical/rules/rule-02-owner-decisions.md` | Owner register | **OWNER_APPROVED** | Docs |
| AUTH-007 | 3 | `docs/clinical/rules/rule-03-organ-system-affinity.md` | Full spec | **FORMALLY_FROZEN_SPEC** (5R-3F) | **NOT_IMPLEMENTED** production |
| AUTH-008 | 3 | `docs/clinical/rules/rule-03-owner-decisions.md` | Owner register | **OWNER_APPROVED** | Docs |
| AUTH-009 | 4 | `docs/clinical/rules/rule-04-potency-engine-DRAFT.md` | Potency spec body | **NORMATIVE_CANDIDATE** (filename **DRAFT**; status doc says frozen 5R-4D) | **NOT_IMPLEMENTED** evaluator |
| AUTH-010 | 4 | `docs/clinical/rules/rule-04-owner-decisions-DRAFT.md` | Q1–Q16 registers | **NORMATIVE_CANDIDATE** / mixed CLOSED NOT_IMPLEMENTED | Docs |
| AUTH-011 | — | `docs/architecture/SUTRA_SOFTWEAR_MASTER_PLAN.md` | Engineering plan | **SUPPORTING** — not clinical rule authority | N/A |
| AUTH-012 | — | `docs/process/SUTRA_SOFTWEAR_CURSOR_GUIDE.md` | Process guide | **SUPPORTING** | N/A |

### Tier 2 — Status, matrix, orchestration (mixed authority)

| ID | Rule | Path | Authority | Notes |
|----|------|------|-----------|--------|
| STAT-001 | 1–9 | `docs/clinical/rule-by-rule-implementation-status.md` | **SUPPORTING** | Production NOT_CONNECTED; per-rule status table |
| STAT-002 | 1–9 | `docs/clinical/nine-rule-engine-matrix.md` | **LEGACY_REFERENCE_ONLY** + **STALE_OR_CONFLICTING** | EH_9 list + **legacy MDE** execution column |
| STAT-003 | 1–9 | `docs/clinical/nine-rule-orchestration.md` | **SYNTHETIC_VALIDATION_ONLY** | Phase 5C; analyze-complete 501 |
| STAT-004 | 1–9 | `docs/clinical/nine-rule-interface-status.md` | **SUPPORTING** | Interface honesty table |
| STAT-005 | 8 | `docs/clinical/rule-8-readiness-decision.md` | **OWNER_APPROVED** / **SUPPORTING** | NOT_REQUIRED_FOR_PRESCRIPTION recommendation |
| STAT-006 | 5–7 | `docs/clinical/prescription-boundary.md` | **SUPPORTING** | Prescription not connected |

### Tier 3 — TypeScript contracts (implementation current, not owner clinical freeze)

| ID | Rule | Path | Authority | Runtime |
|----|------|------|-----------|---------|
| IMPL-001 | 1–9 | `packages/clinical-contracts/src/nineRules.ts` | **IMPLEMENTATION_CURRENT** | **CONTRACT_ONLY**; `ORCHESTRATION_STATUS=NOT_CONNECTED` |
| IMPL-002 | 1–9 | `packages/clinical-contracts/src/analyze.ts` | **IMPLEMENTATION_CURRENT** | AnalyzeComplete **NOT_CONNECTED** helpers |
| IMPL-003 | 4 | `packages/clinical-contracts/src/rule4/**` (104 files) | **IMPLEMENTATION_CURRENT** | Shadow/off modes; **RULE4_ENGINE_MODE=off** default per phase reports |
| IMPL-004 | 5–9 | No `rule5`–`rule9` package dirs on `main` | **NOT_IMPLEMENTED** | Rule 5 name in `nineRules.ts` only |

### Tier 4 — Python clinical engine (synthetic validation)

| ID | Rule | Path | Authority | Runtime |
|----|------|------|-----------|---------|
| PY-001 | 1–9 | `apps/clinical-engine/src/ehas2_clinical_engine/orchestrator.py` | **SYNTHETIC_VALIDATION_ONLY** | Used by tests/preview; not production API |
| PY-002 | 1–9 | `apps/clinical-engine/src/ehas2_clinical_engine/rules.py` | **SYNTHETIC_VALIDATION_ONLY** | Rule metadata in orchestration |
| PY-003 | 1–9 | `apps/clinical-engine/src/ehas2_clinical_engine/interpretation.py` | **SYNTHETIC_VALIDATION_ONLY** | Phase 5C interpretation path |

### Tier 5 — Tests and fixtures

| ID | Rule | Path | Authority | Runtime |
|----|------|------|-----------|---------|
| TST-001 | 1–9 | `tests/unit/phase5c-nine-rule-orchestration.test.ts` | **TEST_EVIDENCE** | Asserts NOT_CONNECTED production |
| TST-002 | 4 | `tests/unit/rule4-*.test.ts` (56 files) | **TEST_EVIDENCE** | Contract/shadow behavior |
| TST-003 | 1–9 | `fixtures/` golden / rule4 scenario JSON | **SYNTHETIC_VALIDATION_ONLY** | Synthetic CI subset |

### Tier 6 — API / adapter (disconnected)

| ID | Rule | Path | Authority | Runtime |
|----|------|------|-----------|---------|
| API-001 | 9 | `packages/engine-adapter/src/index.ts` | **PLACEHOLDER** | `EHAS2ClinicalEngineAdapter: NOT_IMPLEMENTED (Phase 6)` |
| API-002 | 9 | `apps/api/src/createApp.ts` | **IMPLEMENTATION_CURRENT** | No live analyze-complete route wired to engine |
| API-003 | — | `README.md` | **SUPPORTING** | `/api/eh-as-2/v1/analysis` — **501 NOT_IMPLEMENTED** |

## Unknown / stale / conflicting (summary)

| Class | Examples |
|-------|----------|
| **STALE_OR_CONFLICTING** | `nineRules.ts` Rule 5 = **Dosage** vs owner monitoring identity **not present on `main`**; matrix legacy MDE column vs 5R specs |
| **UNKNOWN_AUTHORITY** | Rule 5 canonical identity on **`main`** (Dosage label only; no OD-R5 monitoring spec in tree) |
| **LEGACY_REFERENCE_ONLY** | Matrix rows citing `calc_dosage`, MDE order |

## Limitations

- Inventory performed on **single baseline** `658f3fd`; unmerged branches (e.g. `phase-5r/rule5-phase1-contract-foundation`) were **not** checked out (per Stage A scope on `main`).
- `.venv` under clinical-engine may exist locally but is not normative authority.
- No `.env` contents were read.

## Evidence references

- Constitution OD-013/OD-014: `CLINICAL_PRODUCT_CONSTITUTION.md` L139–165 (baseline)
- `nineRules.ts`: L34–89, L119–122
- `rule-by-rule-implementation-status.md`: full table L7–17
- `engine-adapter/src/index.ts`: NOT_IMPLEMENTED throw
