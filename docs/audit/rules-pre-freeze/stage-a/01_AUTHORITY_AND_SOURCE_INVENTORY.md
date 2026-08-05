# Stage A — Authority and source inventory (micro-correction pass)

**Stage A base main:** `658f3fd97e1e00fcafef74ddd3788d2cfa3bf1d7` (`origin/main`)  
**Initial Stage A head:** `136ca9e78c4d6ec738df4097f95ff875c7ca5aa6`  
**Correction-pass reviewed head:** `d44375ea0234f73a0bc6172d24ca2685bd3e408a`  
**Primary correction-content commit:** `19dd5bedca43601abf2eee0356e48270e3d74a82` (CI run **15** / **31038083277** — historical supporting evidence)  
**Inventory date:** 2026-08-06

## Authority hierarchy

Owner approval → constitution → OD-013/OD-014 → rule owner registers → specs → ADRs → implementation → tests/synthetic → legacy. Code/tests are not automatic clinical authority.

## Reproducible counts

| Metric | Exact count |
|--------|------------:|
| **Row-level manifest (below)** | **326** |
| `packages/clinical-contracts/src/rule4/**` | 104 |
| `docs/clinical/rules/**` on `main` | 17 (no `rule-05-*`) |
| `tests/unit/rule4*` | 56 |
| Tracked `apps/clinical-engine/**` | 118 |

Discovery: union of documented `git ls-files` prefixes + paths matching `nineRules|nine-rule|orchestrator.py|rules.py` (HashSet, no double-count in manifest).

## Full-read authority documents

All listed paths read **complete to EOF** on baseline `658f3fd` (multi-segment where large), including:

`CLINICAL_PRODUCT_CONSTITUTION.md`, `mixture-evidence-safety-policy.md`, all `rule-01-*`, `rule-02-*`, `rule-03-*`, `rule-04-*` on `main`, `rule-by-rule-implementation-status.md`, `nine-rule-engine-matrix.md`, `nine-rule-orchestration.md`, `nine-rule-interface-status.md`, `rule-8-readiness-decision.md`, `prescription-boundary.md`.

### Rule 4 — `rule-04-owner-decisions-DRAFT.md` (complete EOF read)

| Field | Evidence |
|-------|----------|
| Path | `docs/clinical/rules/rule-04-owner-decisions-DRAFT.md` |
| EOF read | **Yes** (5707 lines; file tail § “Related draft artifacts” + “Rule 4 documentation formally frozen: **YES**”) |
| Top markers | **DOCUMENTATION FROZEN** · **OWNER_APPROVED** · **FROZEN** · filename **DRAFT** |
| `NOT_FROZEN` occurrences | **40** (incl. Q1–Q6 row metadata **NOT_FROZEN**; Q7 section “**Rule 4** remains **NOT_FROZEN**”) |
| `DRAFT` occurrences | **15** (filename + cross-links) |
| Frozen/closed/approved markers | **68** lines matching **FROZEN** / **OWNER_APPROVED** / **DOCUMENTATION FROZEN** (incl. Q7–Q18 **CLOSED**, **14/14** decisions) |
| Major headings / IDs | **Q1**–**Q6**, **Q01F**–**Q06C**, **Q7** (**FULLY_RESOLVED**), **Q07C-CLOSE-D05**–**D14**, **Q08-CLOSE**–**Q18-CLOSE**, **5R-DRG**, **5R-SDG** |
| **FREEZE_STATUS_CONFLICT** basis | Same file asserts **DOCUMENTATION FROZEN** + tail **formally frozen: YES** while path remains **DRAFT**, internal **NOT_FROZEN** rows, and **NOT_IMPLEMENTED** runtime — vs constitution/status table on `main` (**CONFLICTING_HISTORICAL_STATUS_CLAIM** elsewhere) |
| Additional conflict | Internal Q7 block: “Rule 4 documentation **FROZEN**” adjacent to “Rule 4 remains **NOT_FROZEN**” (line ~506) — documented, not resolved (SAC-003) |

**Stage A Rule 4 conclusion (unchanged):** Identity **IDENTITY_CANDIDATE_ONLY** · authority **NORMATIVE_CANDIDATE** · freeze **FREEZE_STATUS_CONFLICT** · runtime **SHADOW_ONLY** / **PRODUCTION_NOT_CONNECTED** · owner **OWNER_DECISION_REQUIRED**.

## Rule 4 Stage A classification (consistent)

- Identity: **IDENTITY_CANDIDATE_ONLY**
- Specification authority: **NORMATIVE_CANDIDATE**
- Freeze status: **FREEZE_STATUS_CONFLICT** (not formally frozen in Stage A conclusions)
- Historical “DOCUMENTATION FROZEN” in status table: **CONFLICTING_HISTORICAL_STATUS_CLAIM**

## Complete row-level inventory (326 rows)
| ID | Rule | Path | Source type | Language | Candidate name/responsibility | Authority | Runtime mode | Tests/consumer | Conflict ID |
|----|------|------|-------------|----------|--------------------------------|-----------|--------------|----------------|-------------|
| SRC-0001 | ALL | `apps/clinical-engine/README.md` | ENGINE_IMPLEMENTATION | Markdown | NOT_PROVEN | UNKNOWN_AUTHORITY | NOT_CONNECTED | NOT_PROVEN | N/A |
| SRC-0002 | ALL | `apps/clinical-engine/requirements.txt` | ENGINE_IMPLEMENTATION | Markdown | NOT_PROVEN | UNKNOWN_AUTHORITY | NOT_CONNECTED | NOT_PROVEN | N/A |
| SRC-0003 | ALL | `apps/clinical-engine/src/ehas2_clinical_engine/__init__.py` | ENGINE_IMPLEMENTATION | Python | NOT_PROVEN | UNKNOWN_AUTHORITY | NOT_CONNECTED | NOT_PROVEN | N/A |
| SRC-0004 | ALL | `apps/clinical-engine/src/ehas2_clinical_engine/app.py` | ENGINE_IMPLEMENTATION | Python | NOT_PROVEN | UNKNOWN_AUTHORITY | NOT_CONNECTED | NOT_PROVEN | N/A |
| SRC-0005 | ALL | `apps/clinical-engine/src/ehas2_clinical_engine/disease_package.py` | ENGINE_IMPLEMENTATION | Python | NOT_PROVEN | UNKNOWN_AUTHORITY | NOT_CONNECTED | NOT_PROVEN | N/A |
| SRC-0006 | ALL | `apps/clinical-engine/src/ehas2_clinical_engine/fingerprints.py` | ENGINE_IMPLEMENTATION | Python | NOT_PROVEN | UNKNOWN_AUTHORITY | NOT_CONNECTED | NOT_PROVEN | N/A |
| SRC-0007 | ALL | `apps/clinical-engine/src/ehas2_clinical_engine/golden.py` | ENGINE_IMPLEMENTATION | Python | NOT_PROVEN | SYNTHETIC_VALIDATION_ONLY | SYNTHETIC_VALIDATION_ONLY | NOT_PROVEN | N/A |
| SRC-0008 | ALL | `apps/clinical-engine/src/ehas2_clinical_engine/interpretation.py` | ENGINE_IMPLEMENTATION | Python | NOT_PROVEN | SYNTHETIC_VALIDATION_ONLY | SYNTHETIC_VALIDATION_ONLY | NOT_PROVEN | N/A |
| SRC-0009 | ALL | `apps/clinical-engine/src/ehas2_clinical_engine/logging_safe.py` | ENGINE_IMPLEMENTATION | Python | NOT_PROVEN | UNKNOWN_AUTHORITY | NOT_CONNECTED | NOT_PROVEN | N/A |
| SRC-0010 | ALL | `apps/clinical-engine/src/ehas2_clinical_engine/models.py` | ENGINE_IMPLEMENTATION | Python | NOT_PROVEN | UNKNOWN_AUTHORITY | NOT_CONNECTED | NOT_PROVEN | N/A |
| SRC-0011 | ALL | `apps/clinical-engine/src/ehas2_clinical_engine/normalize.py` | ENGINE_IMPLEMENTATION | Python | NOT_PROVEN | UNKNOWN_AUTHORITY | NOT_CONNECTED | NOT_PROVEN | N/A |
| SRC-0012 | 9 | `apps/clinical-engine/src/ehas2_clinical_engine/orchestrator.py` | ENGINE_IMPLEMENTATION | Python | Phase 5C synthetic orchestrator | SYNTHETIC_VALIDATION_ONLY | SYNTHETIC_VALIDATION_ONLY | NOT_PROVEN | N/A |
| SRC-0013 | ALL | `apps/clinical-engine/src/ehas2_clinical_engine/retrieval.py` | ENGINE_IMPLEMENTATION | Python | NOT_PROVEN | UNKNOWN_AUTHORITY | NOT_CONNECTED | NOT_PROVEN | N/A |
| SRC-0014 | 4 | `apps/clinical-engine/src/ehas2_clinical_engine/rule4/__init__.py` | ENGINE_IMPLEMENTATION | Python | Rule 4 shadow engine modules | UNKNOWN_AUTHORITY | SHADOW_ONLY | NOT_PROVEN | N/A |
| SRC-0015 | 4 | `apps/clinical-engine/src/ehas2_clinical_engine/rule4/canonical_json.py` | ENGINE_IMPLEMENTATION | Python | Rule 4 shadow engine modules | UNKNOWN_AUTHORITY | SHADOW_ONLY | NOT_PROVEN | N/A |
| SRC-0016 | 4 | `apps/clinical-engine/src/ehas2_clinical_engine/rule4/doctor_review/__init__.py` | ENGINE_IMPLEMENTATION | Python | Rule 4 shadow engine modules | UNKNOWN_AUTHORITY | SHADOW_ONLY | NOT_PROVEN | N/A |
| SRC-0017 | 4 | `apps/clinical-engine/src/ehas2_clinical_engine/rule4/doctor_review/build_shadow_audit_events.py` | ENGINE_IMPLEMENTATION | Python | Rule 4 shadow engine modules | UNKNOWN_AUTHORITY | SHADOW_ONLY | NOT_PROVEN | N/A |
| SRC-0018 | 4 | `apps/clinical-engine/src/ehas2_clinical_engine/rule4/doctor_review/evaluate_doctor_review_adapter.py` | ENGINE_IMPLEMENTATION | Python | Rule 4 shadow engine modules | UNKNOWN_AUTHORITY | SHADOW_ONLY | NOT_PROVEN | N/A |
| SRC-0019 | 4 | `apps/clinical-engine/src/ehas2_clinical_engine/rule4/doctor_review/expected_authenticity_authority.py` | ENGINE_IMPLEMENTATION | Python | Rule 4 shadow engine modules | UNKNOWN_AUTHORITY | SHADOW_ONLY | NOT_PROVEN | N/A |
| SRC-0020 | 4 | `apps/clinical-engine/src/ehas2_clinical_engine/rule4/doctor_review/gate_ledger.py` | ENGINE_IMPLEMENTATION | Python | Rule 4 shadow engine modules | UNKNOWN_AUTHORITY | SHADOW_ONLY | NOT_PROVEN | N/A |
| SRC-0021 | 4 | `apps/clinical-engine/src/ehas2_clinical_engine/rule4/doctor_review/review_code_validation.py` | ENGINE_IMPLEMENTATION | Python | Rule 4 shadow engine modules | UNKNOWN_AUTHORITY | SHADOW_ONLY | NOT_PROVEN | N/A |
| SRC-0022 | 4 | `apps/clinical-engine/src/ehas2_clinical_engine/rule4/eligibility/__init__.py` | ENGINE_IMPLEMENTATION | Python | Rule 4 shadow engine modules | UNKNOWN_AUTHORITY | SHADOW_ONLY | NOT_PROVEN | N/A |
| SRC-0023 | 4 | `apps/clinical-engine/src/ehas2_clinical_engine/rule4/eligibility/eligibility_code_validation.py` | ENGINE_IMPLEMENTATION | Python | Rule 4 shadow engine modules | UNKNOWN_AUTHORITY | SHADOW_ONLY | NOT_PROVEN | N/A |
| SRC-0024 | 4 | `apps/clinical-engine/src/ehas2_clinical_engine/rule4/eligibility/eligibility_fingerprint_v1.py` | ENGINE_IMPLEMENTATION | Python | Rule 4 shadow engine modules | UNKNOWN_AUTHORITY | SHADOW_ONLY | NOT_PROVEN | N/A |
| SRC-0025 | 4 | `apps/clinical-engine/src/ehas2_clinical_engine/rule4/eligibility/evaluate_eligibility_adapter.py` | ENGINE_IMPLEMENTATION | Python | Rule 4 shadow engine modules | UNKNOWN_AUTHORITY | SHADOW_ONLY | NOT_PROVEN | N/A |
| SRC-0026 | 4 | `apps/clinical-engine/src/ehas2_clinical_engine/rule4/eligibility/formula_bp_gate.py` | ENGINE_IMPLEMENTATION | Python | Rule 4 shadow engine modules | UNKNOWN_AUTHORITY | SHADOW_ONLY | NOT_PROVEN | N/A |
| SRC-0027 | 4 | `apps/clinical-engine/src/ehas2_clinical_engine/rule4/eligibility/gate_ledger.py` | ENGINE_IMPLEMENTATION | Python | Rule 4 shadow engine modules | UNKNOWN_AUTHORITY | SHADOW_ONLY | NOT_PROVEN | N/A |
| SRC-0028 | 4 | `apps/clinical-engine/src/ehas2_clinical_engine/rule4/eligibility/resolve_slot_eligibility.py` | ENGINE_IMPLEMENTATION | Python | Rule 4 shadow engine modules | UNKNOWN_AUTHORITY | SHADOW_ONLY | NOT_PROVEN | N/A |
| SRC-0029 | 4 | `apps/clinical-engine/src/ehas2_clinical_engine/rule4/eligibility/types.py` | ENGINE_IMPLEMENTATION | Python | Rule 4 shadow engine modules | UNKNOWN_AUTHORITY | SHADOW_ONLY | NOT_PROVEN | N/A |
| SRC-0030 | 4 | `apps/clinical-engine/src/ehas2_clinical_engine/rule4/empty_result_fingerprint_v1.py` | ENGINE_IMPLEMENTATION | Python | Rule 4 shadow engine modules | UNKNOWN_AUTHORITY | SHADOW_ONLY | NOT_PROVEN | N/A |
| SRC-0031 | 4 | `apps/clinical-engine/src/ehas2_clinical_engine/rule4/evaluator.py` | ENGINE_IMPLEMENTATION | Python | Rule 4 shadow engine modules | UNKNOWN_AUTHORITY | SHADOW_ONLY | NOT_PROVEN | N/A |
| SRC-0032 | 4 | `apps/clinical-engine/src/ehas2_clinical_engine/rule4/evidence/__init__.py` | ENGINE_IMPLEMENTATION | Python | Rule 4 shadow engine modules | UNKNOWN_AUTHORITY | SHADOW_ONLY | NOT_PROVEN | N/A |
| SRC-0033 | 4 | `apps/clinical-engine/src/ehas2_clinical_engine/rule4/evidence/evaluate_evidence_adapter.py` | ENGINE_IMPLEMENTATION | Python | Rule 4 shadow engine modules | UNKNOWN_AUTHORITY | SHADOW_ONLY | NOT_PROVEN | N/A |
| SRC-0034 | 4 | `apps/clinical-engine/src/ehas2_clinical_engine/rule4/evidence/evidence_fingerprint_v1.py` | ENGINE_IMPLEMENTATION | Python | Rule 4 shadow engine modules | UNKNOWN_AUTHORITY | SHADOW_ONLY | NOT_PROVEN | N/A |
| SRC-0035 | 4 | `apps/clinical-engine/src/ehas2_clinical_engine/rule4/evidence/supersession.py` | ENGINE_IMPLEMENTATION | Python | Rule 4 shadow engine modules | UNKNOWN_AUTHORITY | SHADOW_ONLY | NOT_PROVEN | N/A |
| SRC-0036 | 4 | `apps/clinical-engine/src/ehas2_clinical_engine/rule4/mode.py` | ENGINE_IMPLEMENTATION | Python | Rule 4 shadow engine modules | UNKNOWN_AUTHORITY | SHADOW_ONLY | NOT_PROVEN | N/A |
| SRC-0037 | 4 | `apps/clinical-engine/src/ehas2_clinical_engine/rule4/orchestrator_hook.py` | ENGINE_IMPLEMENTATION | Python | Rule 4 shadow engine modules | UNKNOWN_AUTHORITY | SHADOW_ONLY | NOT_PROVEN | N/A |
| SRC-0038 | 4 | `apps/clinical-engine/src/ehas2_clinical_engine/rule4/pediatric_overlay/__init__.py` | ENGINE_IMPLEMENTATION | Python | Rule 4 shadow engine modules | UNKNOWN_AUTHORITY | SHADOW_ONLY | NOT_PROVEN | N/A |
| SRC-0039 | 4 | `apps/clinical-engine/src/ehas2_clinical_engine/rule4/pediatric_overlay/evaluate_pediatric_overlay_adapter.py` | ENGINE_IMPLEMENTATION | Python | Rule 4 shadow engine modules | UNKNOWN_AUTHORITY | SHADOW_ONLY | NOT_PROVEN | N/A |
| SRC-0040 | 4 | `apps/clinical-engine/src/ehas2_clinical_engine/rule4/pediatric_overlay/overlay_code_validation.py` | ENGINE_IMPLEMENTATION | Python | Rule 4 shadow engine modules | UNKNOWN_AUTHORITY | SHADOW_ONLY | NOT_PROVEN | N/A |
| SRC-0041 | 4 | `apps/clinical-engine/src/ehas2_clinical_engine/rule4/pediatric_overlay/overlay_matrix.py` | ENGINE_IMPLEMENTATION | Python | Rule 4 shadow engine modules | UNKNOWN_AUTHORITY | SHADOW_ONLY | NOT_PROVEN | N/A |
| SRC-0042 | 4 | `apps/clinical-engine/src/ehas2_clinical_engine/rule4/pediatric_overlay/pediatric_overlay_fingerprint_v1.py` | ENGINE_IMPLEMENTATION | Python | Rule 4 shadow engine modules | UNKNOWN_AUTHORITY | SHADOW_ONLY | NOT_PROVEN | N/A |
| SRC-0043 | 4 | `apps/clinical-engine/src/ehas2_clinical_engine/rule4/pediatric_overlay/resolve_slot_pediatric_overlay.py` | ENGINE_IMPLEMENTATION | Python | Rule 4 shadow engine modules | UNKNOWN_AUTHORITY | SHADOW_ONLY | NOT_PROVEN | N/A |
| SRC-0044 | 4 | `apps/clinical-engine/src/ehas2_clinical_engine/rule4/phase/__init__.py` | ENGINE_IMPLEMENTATION | Python | Rule 4 shadow engine modules | UNKNOWN_AUTHORITY | SHADOW_ONLY | NOT_PROVEN | N/A |
| SRC-0045 | 4 | `apps/clinical-engine/src/ehas2_clinical_engine/rule4/phase/binding_gate.py` | ENGINE_IMPLEMENTATION | Python | Rule 4 shadow engine modules | UNKNOWN_AUTHORITY | SHADOW_ONLY | NOT_PROVEN | N/A |
| SRC-0046 | 4 | `apps/clinical-engine/src/ehas2_clinical_engine/rule4/phase/day_bands.py` | ENGINE_IMPLEMENTATION | Python | Rule 4 shadow engine modules | UNKNOWN_AUTHORITY | SHADOW_ONLY | NOT_PROVEN | N/A |
| SRC-0047 | 4 | `apps/clinical-engine/src/ehas2_clinical_engine/rule4/phase/duration_calendar.py` | ENGINE_IMPLEMENTATION | Python | Rule 4 shadow engine modules | UNKNOWN_AUTHORITY | SHADOW_ONLY | NOT_PROVEN | N/A |
| SRC-0048 | 4 | `apps/clinical-engine/src/ehas2_clinical_engine/rule4/phase/evaluate_phase_adapter.py` | ENGINE_IMPLEMENTATION | Python | Rule 4 shadow engine modules | UNKNOWN_AUTHORITY | SHADOW_ONLY | NOT_PROVEN | N/A |
| SRC-0049 | 4 | `apps/clinical-engine/src/ehas2_clinical_engine/rule4/phase/phase_fingerprint_v1.py` | ENGINE_IMPLEMENTATION | Python | Rule 4 shadow engine modules | UNKNOWN_AUTHORITY | SHADOW_ONLY | NOT_PROVEN | N/A |
| SRC-0050 | 4 | `apps/clinical-engine/src/ehas2_clinical_engine/rule4/phase/resolve_slot_phase.py` | ENGINE_IMPLEMENTATION | Python | Rule 4 shadow engine modules | UNKNOWN_AUTHORITY | SHADOW_ONLY | NOT_PROVEN | N/A |
| SRC-0051 | 2 | `apps/clinical-engine/src/ehas2_clinical_engine/rule4/polarity/__init__.py` | ENGINE_IMPLEMENTATION | Python | Rule 2 polarity (Rule 4 adapter) | UNKNOWN_AUTHORITY | SHADOW_ONLY | NOT_PROVEN | N/A |
| SRC-0052 | 2 | `apps/clinical-engine/src/ehas2_clinical_engine/rule4/polarity/binding_gate.py` | ENGINE_IMPLEMENTATION | Python | Rule 2 polarity (Rule 4 adapter) | UNKNOWN_AUTHORITY | SHADOW_ONLY | NOT_PROVEN | N/A |
| SRC-0053 | 2 | `apps/clinical-engine/src/ehas2_clinical_engine/rule4/polarity/evaluate_polarity_adapter.py` | ENGINE_IMPLEMENTATION | Python | Rule 2 polarity (Rule 4 adapter) | UNKNOWN_AUTHORITY | SHADOW_ONLY | NOT_PROVEN | N/A |
| SRC-0054 | 2 | `apps/clinical-engine/src/ehas2_clinical_engine/rule4/polarity/pathway_router.py` | ENGINE_IMPLEMENTATION | Python | Rule 2 polarity (Rule 4 adapter) | UNKNOWN_AUTHORITY | SHADOW_ONLY | NOT_PROVEN | N/A |
| SRC-0055 | 2 | `apps/clinical-engine/src/ehas2_clinical_engine/rule4/polarity/polarity_fingerprint_v1.py` | ENGINE_IMPLEMENTATION | Python | Rule 2 polarity (Rule 4 adapter) | UNKNOWN_AUTHORITY | SHADOW_ONLY | NOT_PROVEN | N/A |
| SRC-0056 | 2 | `apps/clinical-engine/src/ehas2_clinical_engine/rule4/polarity/quarantine_probe.py` | ENGINE_IMPLEMENTATION | Python | Rule 2 polarity (Rule 4 adapter) | UNKNOWN_AUTHORITY | SHADOW_ONLY | NOT_PROVEN | N/A |
| SRC-0057 | 2 | `apps/clinical-engine/src/ehas2_clinical_engine/rule4/polarity/rule2_validate.py` | ENGINE_IMPLEMENTATION | Python | Rule 2 polarity (Rule 4 adapter) | UNKNOWN_AUTHORITY | SHADOW_ONLY | NOT_PROVEN | N/A |
| SRC-0058 | 4 | `apps/clinical-engine/src/ehas2_clinical_engine/rule4/registry_loader.py` | ENGINE_IMPLEMENTATION | Python | Rule 4 shadow engine modules | UNKNOWN_AUTHORITY | SHADOW_ONLY | NOT_PROVEN | N/A |
| SRC-0059 | 4 | `apps/clinical-engine/src/ehas2_clinical_engine/rule4/registry_merge.py` | ENGINE_IMPLEMENTATION | Python | Rule 4 shadow engine modules | UNKNOWN_AUTHORITY | SHADOW_ONLY | NOT_PROVEN | N/A |
| SRC-0060 | 4 | `apps/clinical-engine/src/ehas2_clinical_engine/rule4/registry_paths.py` | ENGINE_IMPLEMENTATION | Python | Rule 4 shadow engine modules | UNKNOWN_AUTHORITY | SHADOW_ONLY | NOT_PROVEN | N/A |
| SRC-0061 | 4 | `apps/clinical-engine/src/ehas2_clinical_engine/rule4/registry_validation.py` | ENGINE_IMPLEMENTATION | Python | Rule 4 shadow engine modules | UNKNOWN_AUTHORITY | SHADOW_ONLY | NOT_PROVEN | N/A |
| SRC-0062 | 4 | `apps/clinical-engine/src/ehas2_clinical_engine/rule4/safety/__init__.py` | ENGINE_IMPLEMENTATION | Python | Rule 4 shadow engine modules | UNKNOWN_AUTHORITY | SHADOW_ONLY | NOT_PROVEN | N/A |
| SRC-0063 | 4 | `apps/clinical-engine/src/ehas2_clinical_engine/rule4/safety/age_validator.py` | ENGINE_IMPLEMENTATION | Python | Rule 4 shadow engine modules | UNKNOWN_AUTHORITY | SHADOW_ONLY | NOT_PROVEN | N/A |
| SRC-0064 | 4 | `apps/clinical-engine/src/ehas2_clinical_engine/rule4/safety/date_calendar.py` | ENGINE_IMPLEMENTATION | Python | Rule 4 shadow engine modules | UNKNOWN_AUTHORITY | SHADOW_ONLY | NOT_PROVEN | N/A |
| SRC-0065 | 4 | `apps/clinical-engine/src/ehas2_clinical_engine/rule4/safety/evaluate_safety_gate.py` | ENGINE_IMPLEMENTATION | Python | Rule 4 shadow engine modules | UNKNOWN_AUTHORITY | SHADOW_ONLY | NOT_PROVEN | N/A |
| SRC-0066 | 4 | `apps/clinical-engine/src/ehas2_clinical_engine/rule4/safety/structured_critical.py` | ENGINE_IMPLEMENTATION | Python | Rule 4 shadow engine modules | UNKNOWN_AUTHORITY | SHADOW_ONLY | NOT_PROVEN | N/A |
| SRC-0067 | 4 | `apps/clinical-engine/src/ehas2_clinical_engine/rule4/safety_fingerprint_v1.py` | ENGINE_IMPLEMENTATION | Python | Rule 4 shadow engine modules | UNKNOWN_AUTHORITY | SHADOW_ONLY | NOT_PROVEN | N/A |
| SRC-0068 | 4 | `apps/clinical-engine/src/ehas2_clinical_engine/rule4/selection/__init__.py` | ENGINE_IMPLEMENTATION | Python | Rule 4 shadow engine modules | UNKNOWN_AUTHORITY | SHADOW_ONLY | NOT_PROVEN | N/A |
| SRC-0069 | 4 | `apps/clinical-engine/src/ehas2_clinical_engine/rule4/selection/d3_d5_discriminator_fingerprint_v1.py` | ENGINE_IMPLEMENTATION | Python | Rule 4 shadow engine modules | UNKNOWN_AUTHORITY | SHADOW_ONLY | NOT_PROVEN | N/A |
| SRC-0070 | 4 | `apps/clinical-engine/src/ehas2_clinical_engine/rule4/selection/d3_d5_evidence_provenance.py` | ENGINE_IMPLEMENTATION | Python | Rule 4 shadow engine modules | UNKNOWN_AUTHORITY | SHADOW_ONLY | NOT_PROVEN | N/A |
| SRC-0071 | 4 | `apps/clinical-engine/src/ehas2_clinical_engine/rule4/selection/evaluate_selection_adapter.py` | ENGINE_IMPLEMENTATION | Python | Rule 4 shadow engine modules | UNKNOWN_AUTHORITY | SHADOW_ONLY | NOT_PROVEN | N/A |
| SRC-0072 | 4 | `apps/clinical-engine/src/ehas2_clinical_engine/rule4/selection/q7bf_gate_ids.py` | ENGINE_IMPLEMENTATION | Python | Rule 4 shadow engine modules | UNKNOWN_AUTHORITY | SHADOW_ONLY | NOT_PROVEN | N/A |
| SRC-0073 | 4 | `apps/clinical-engine/src/ehas2_clinical_engine/rule4/selection/resolve_slot_selection.py` | ENGINE_IMPLEMENTATION | Python | Rule 4 shadow engine modules | UNKNOWN_AUTHORITY | SHADOW_ONLY | NOT_PROVEN | N/A |
| SRC-0074 | 4 | `apps/clinical-engine/src/ehas2_clinical_engine/rule4/selection/selection_code_validation.py` | ENGINE_IMPLEMENTATION | Python | Rule 4 shadow engine modules | UNKNOWN_AUTHORITY | SHADOW_ONLY | NOT_PROVEN | N/A |
| SRC-0075 | 4 | `apps/clinical-engine/src/ehas2_clinical_engine/rule4/selection/selection_fingerprint_v1.py` | ENGINE_IMPLEMENTATION | Python | Rule 4 shadow engine modules | UNKNOWN_AUTHORITY | SHADOW_ONLY | NOT_PROVEN | N/A |
| SRC-0076 | 4 | `apps/clinical-engine/src/ehas2_clinical_engine/rule4/selection/validate_d3_d5_discriminator.py` | ENGINE_IMPLEMENTATION | Python | Rule 4 shadow engine modules | UNKNOWN_AUTHORITY | SHADOW_ONLY | NOT_PROVEN | N/A |
| SRC-0077 | 4 | `apps/clinical-engine/src/ehas2_clinical_engine/rule4/severity/__init__.py` | ENGINE_IMPLEMENTATION | Python | Rule 4 shadow engine modules | UNKNOWN_AUTHORITY | SHADOW_ONLY | NOT_PROVEN | N/A |
| SRC-0078 | 4 | `apps/clinical-engine/src/ehas2_clinical_engine/rule4/severity/assertion_binding.py` | ENGINE_IMPLEMENTATION | Python | Rule 4 shadow engine modules | UNKNOWN_AUTHORITY | SHADOW_ONLY | NOT_PROVEN | N/A |
| SRC-0079 | 4 | `apps/clinical-engine/src/ehas2_clinical_engine/rule4/severity/binding_gate.py` | ENGINE_IMPLEMENTATION | Python | Rule 4 shadow engine modules | UNKNOWN_AUTHORITY | SHADOW_ONLY | NOT_PROVEN | N/A |
| SRC-0080 | 4 | `apps/clinical-engine/src/ehas2_clinical_engine/rule4/severity/cross_role_leakage_guard.py` | ENGINE_IMPLEMENTATION | Python | Rule 4 shadow engine modules | UNKNOWN_AUTHORITY | SHADOW_ONLY | NOT_PROVEN | N/A |
| SRC-0081 | 4 | `apps/clinical-engine/src/ehas2_clinical_engine/rule4/severity/evaluate_severity_adapter.py` | ENGINE_IMPLEMENTATION | Python | Rule 4 shadow engine modules | UNKNOWN_AUTHORITY | SHADOW_ONLY | NOT_PROVEN | N/A |
| SRC-0082 | 4 | `apps/clinical-engine/src/ehas2_clinical_engine/rule4/severity/resolve_slot_severity.py` | ENGINE_IMPLEMENTATION | Python | Rule 4 shadow engine modules | UNKNOWN_AUTHORITY | SHADOW_ONLY | NOT_PROVEN | N/A |
| SRC-0083 | 4 | `apps/clinical-engine/src/ehas2_clinical_engine/rule4/severity/severity_fingerprint_v1.py` | ENGINE_IMPLEMENTATION | Python | Rule 4 shadow engine modules | UNKNOWN_AUTHORITY | SHADOW_ONLY | NOT_PROVEN | N/A |
| SRC-0084 | 4 | `apps/clinical-engine/src/ehas2_clinical_engine/rule4/severity/severity_scale.py` | ENGINE_IMPLEMENTATION | Python | Rule 4 shadow engine modules | UNKNOWN_AUTHORITY | SHADOW_ONLY | NOT_PROVEN | N/A |
| SRC-0085 | 4 | `apps/clinical-engine/src/ehas2_clinical_engine/rule4/severity/upstream_context_boundary.py` | ENGINE_IMPLEMENTATION | Python | Rule 4 shadow engine modules | UNKNOWN_AUTHORITY | SHADOW_ONLY | NOT_PROVEN | N/A |
| SRC-0086 | 4 | `apps/clinical-engine/src/ehas2_clinical_engine/rule4/validate.py` | ENGINE_IMPLEMENTATION | Python | Rule 4 shadow engine modules | UNKNOWN_AUTHORITY | SHADOW_ONLY | NOT_PROVEN | N/A |
| SRC-0087 | ALL | `apps/clinical-engine/src/ehas2_clinical_engine/rules.py` | ENGINE_IMPLEMENTATION | Python | NOT_PROVEN | UNKNOWN_AUTHORITY | NOT_CONNECTED | NOT_PROVEN | N/A |
| SRC-0088 | 4 | `apps/clinical-engine/tests/rule4_phase10_context.py` | TEST | Python | Rule 4 shadow engine modules | TEST_EVIDENCE | TEST_ONLY | npm test / pytest | N/A |
| SRC-0089 | 4 | `apps/clinical-engine/tests/rule4_phase9_context.py` | TEST | Python | Rule 4 shadow engine modules | TEST_EVIDENCE | TEST_ONLY | npm test / pytest | N/A |
| SRC-0090 | 4 | `apps/clinical-engine/tests/test_rule4_fingerprint_v1.py` | TEST | Python | Rule 4 shadow engine modules | TEST_EVIDENCE | TEST_ONLY | npm test / pytest | N/A |
| SRC-0091 | 4 | `apps/clinical-engine/tests/test_rule4_phase1.py` | TEST | Python | Rule 4 shadow engine modules | TEST_EVIDENCE | TEST_ONLY | npm test / pytest | N/A |
| SRC-0092 | 4 | `apps/clinical-engine/tests/test_rule4_phase10_authenticity_audit.py` | TEST | Python | Rule 4 shadow engine modules | TEST_EVIDENCE | TEST_ONLY | npm test / pytest | N/A |
| SRC-0093 | 4 | `apps/clinical-engine/tests/test_rule4_phase10_registry_codes.py` | TEST | Python | Rule 4 shadow engine modules | TEST_EVIDENCE | TEST_ONLY | npm test / pytest | N/A |
| SRC-0094 | 4 | `apps/clinical-engine/tests/test_rule4_phase10_scenario_parity.py` | TEST | Python | Rule 4 shadow engine modules | TEST_EVIDENCE | TEST_ONLY | npm test / pytest | N/A |
| SRC-0095 | 4 | `apps/clinical-engine/tests/test_rule4_phase10_supersession_parity.py` | TEST | Python | Rule 4 shadow engine modules | TEST_EVIDENCE | TEST_ONLY | npm test / pytest | N/A |
| SRC-0096 | 4 | `apps/clinical-engine/tests/test_rule4_phase2_safety.py` | TEST | Python | Rule 4 shadow engine modules | TEST_EVIDENCE | TEST_ONLY | npm test / pytest | N/A |
| SRC-0097 | 4 | `apps/clinical-engine/tests/test_rule4_phase3_evidence.py` | TEST | Python | Rule 4 shadow engine modules | TEST_EVIDENCE | TEST_ONLY | npm test / pytest | N/A |
| SRC-0098 | 4 | `apps/clinical-engine/tests/test_rule4_phase4_binding_gate.py` | TEST | Python | Rule 4 shadow engine modules | TEST_EVIDENCE | TEST_ONLY | npm test / pytest | N/A |
| SRC-0099 | 2 | `apps/clinical-engine/tests/test_rule4_phase4_polarity.py` | TEST | Python | Rule 2 polarity (Rule 4 adapter) | TEST_EVIDENCE | TEST_ONLY | npm test / pytest | N/A |
| SRC-0100 | 4 | `apps/clinical-engine/tests/test_rule4_phase5_binding_gate.py` | TEST | Python | Rule 4 shadow engine modules | TEST_EVIDENCE | TEST_ONLY | npm test / pytest | N/A |
| SRC-0101 | 4 | `apps/clinical-engine/tests/test_rule4_phase5_phase.py` | TEST | Python | Rule 4 shadow engine modules | TEST_EVIDENCE | TEST_ONLY | npm test / pytest | N/A |
| SRC-0102 | 2 | `apps/clinical-engine/tests/test_rule4_phase5_safety_polarity.py` | TEST | Python | Rule 2 polarity (Rule 4 adapter) | TEST_EVIDENCE | TEST_ONLY | npm test / pytest | N/A |
| SRC-0103 | 4 | `apps/clinical-engine/tests/test_rule4_phase6_corrections.py` | TEST | Python | Rule 4 shadow engine modules | TEST_EVIDENCE | TEST_ONLY | npm test / pytest | N/A |
| SRC-0104 | 4 | `apps/clinical-engine/tests/test_rule4_phase6_fingerprint_collision.py` | TEST | Python | Rule 4 shadow engine modules | TEST_EVIDENCE | TEST_ONLY | npm test / pytest | N/A |
| SRC-0105 | 2 | `apps/clinical-engine/tests/test_rule4_phase6_safety_polarity.py` | TEST | Python | Rule 2 polarity (Rule 4 adapter) | TEST_EVIDENCE | TEST_ONLY | npm test / pytest | N/A |
| SRC-0106 | 4 | `apps/clinical-engine/tests/test_rule4_phase6_severity.py` | TEST | Python | Rule 4 shadow engine modules | TEST_EVIDENCE | TEST_ONLY | npm test / pytest | N/A |
| SRC-0107 | 4 | `apps/clinical-engine/tests/test_rule4_phase7_eligibility.py` | TEST | Python | Rule 4 shadow engine modules | TEST_EVIDENCE | TEST_ONLY | npm test / pytest | N/A |
| SRC-0108 | 4 | `apps/clinical-engine/tests/test_rule4_phase7_fingerprint_collision.py` | TEST | Python | Rule 4 shadow engine modules | TEST_EVIDENCE | TEST_ONLY | npm test / pytest | N/A |
| SRC-0109 | 4 | `apps/clinical-engine/tests/test_rule4_phase7_scenario_parity.py` | TEST | Python | Rule 4 shadow engine modules | TEST_EVIDENCE | TEST_ONLY | npm test / pytest | N/A |
| SRC-0110 | 4 | `apps/clinical-engine/tests/test_rule4_phase8_d3d5_discriminator_fingerprint_tamper.py` | TEST | Python | Rule 4 shadow engine modules | TEST_EVIDENCE | TEST_ONLY | npm test / pytest | N/A |
| SRC-0111 | 4 | `apps/clinical-engine/tests/test_rule4_phase8_d3d5_evidence_provenance.py` | TEST | Python | Rule 4 shadow engine modules | TEST_EVIDENCE | TEST_ONLY | npm test / pytest | N/A |
| SRC-0112 | 4 | `apps/clinical-engine/tests/test_rule4_phase8_scenario_parity.py` | TEST | Python | Rule 4 shadow engine modules | TEST_EVIDENCE | TEST_ONLY | npm test / pytest | N/A |
| SRC-0113 | 4 | `apps/clinical-engine/tests/test_rule4_phase9_context_regression.py` | TEST | Python | Rule 4 shadow engine modules | TEST_EVIDENCE | TEST_ONLY | npm test / pytest | N/A |
| SRC-0114 | 4 | `apps/clinical-engine/tests/test_rule4_phase9_d13hs_cross_phase.py` | TEST | Python | Rule 4 shadow engine modules | TEST_EVIDENCE | TEST_ONLY | npm test / pytest | N/A |
| SRC-0115 | 4 | `apps/clinical-engine/tests/test_rule4_phase9_fingerprint_parity.py` | TEST | Python | Rule 4 shadow engine modules | TEST_EVIDENCE | TEST_ONLY | npm test / pytest | N/A |
| SRC-0116 | 4 | `apps/clinical-engine/tests/test_rule4_phase9_scenario_parity.py` | TEST | Python | Rule 4 shadow engine modules | TEST_EVIDENCE | TEST_ONLY | npm test / pytest | N/A |
| SRC-0117 | 4 | `apps/clinical-engine/tests/test_rule4_scenario_parity.py` | TEST | Python | Rule 4 shadow engine modules | TEST_EVIDENCE | TEST_ONLY | npm test / pytest | N/A |
| SRC-0118 | ALL | `apps/clinical-engine/tests/test_scaffold.py` | TEST | Python | NOT_PROVEN | TEST_EVIDENCE | TEST_ONLY | npm test / pytest | N/A |
| SRC-0119 | ALL | `apps/web/src/lib/clinical-validation/dashboard.ts` | SOURCE | TypeScript | NOT_PROVEN | UNKNOWN_AUTHORITY | NOT_PROVEN | NOT_PROVEN | N/A |
| SRC-0120 | ALL | `docs/adr/001-monorepo-and-separation.md` | DOCUMENTATION | Markdown | NOT_PROVEN | UNKNOWN_AUTHORITY | NOT_PROVEN | N/A | N/A |
| SRC-0121 | ALL | `docs/adr/002-api-namespace.md` | DOCUMENTATION | Markdown | NOT_PROVEN | UNKNOWN_AUTHORITY | NOT_PROVEN | N/A | N/A |
| SRC-0122 | ALL | `docs/adr/003-postgresql-application-db.md` | DOCUMENTATION | Markdown | NOT_PROVEN | UNKNOWN_AUTHORITY | NOT_PROVEN | N/A | N/A |
| SRC-0123 | ALL | `docs/adr/004-super-admin-separate-control-plane.md` | DOCUMENTATION | Markdown | NOT_PROVEN | UNKNOWN_AUTHORITY | NOT_PROVEN | N/A | N/A |
| SRC-0124 | ALL | `docs/adr/005-security-event-and-audit-boundary.md` | DOCUMENTATION | Markdown | NOT_PROVEN | UNKNOWN_AUTHORITY | NOT_PROVEN | N/A | N/A |
| SRC-0125 | ALL | `docs/adr/008-management-admin-boundary.md` | DOCUMENTATION | Markdown | NOT_PROVEN | UNKNOWN_AUTHORITY | NOT_PROVEN | N/A | N/A |
| SRC-0126 | ALL | `docs/adr/009-private-feedback-vs-testimonial.md` | DOCUMENTATION | Markdown | NOT_PROVEN | UNKNOWN_AUTHORITY | NOT_PROVEN | N/A | N/A |
| SRC-0127 | ALL | `docs/adr/010-structured-clinical-data-and-snapshots.md` | DOCUMENTATION | Markdown | NOT_PROVEN | UNKNOWN_AUTHORITY | NOT_PROVEN | N/A | N/A |
| SRC-0128 | ALL | `docs/adr/011-report-file-non-retention.md` | DOCUMENTATION | Markdown | NOT_PROVEN | UNKNOWN_AUTHORITY | NOT_PROVEN | N/A | N/A |
| SRC-0129 | ALL | `docs/adr/012-provider-portable-deployment.md` | DOCUMENTATION | Markdown | NOT_PROVEN | UNKNOWN_AUTHORITY | NOT_PROVEN | N/A | N/A |
| SRC-0130 | ALL | `docs/adr/013-authentication-provider-decision.md` | DOCUMENTATION | Markdown | NOT_PROVEN | UNKNOWN_AUTHORITY | NOT_PROVEN | N/A | N/A |
| SRC-0131 | ALL | `docs/adr/014-postgresql-access-layer.md` | DOCUMENTATION | Markdown | NOT_PROVEN | UNKNOWN_AUTHORITY | NOT_PROVEN | N/A | N/A |
| SRC-0132 | ALL | `docs/adr/015-identifier-strategy.md` | DOCUMENTATION | Markdown | NOT_PROVEN | UNKNOWN_AUTHORITY | NOT_PROVEN | N/A | N/A |
| SRC-0133 | ALL | `docs/adr/016-tenant-rls-strategy.md` | DOCUMENTATION | Markdown | NOT_PROVEN | UNKNOWN_AUTHORITY | NOT_PROVEN | N/A | N/A |
| SRC-0134 | ALL | `docs/clinical/CLINICAL_PRODUCT_CONSTITUTION.md` | DOCUMENTATION | Markdown | NOT_PROVEN | OWNER_APPROVED | NOT_CONNECTED | N/A | SAC-005 |
| SRC-0135 | ALL | `docs/clinical/clinical-interpretation-validation.md` | DOCUMENTATION | Markdown | NOT_PROVEN | UNKNOWN_AUTHORITY | NOT_PROVEN | N/A | N/A |
| SRC-0136 | ALL | `docs/clinical/clinical-migration-architecture.md` | DOCUMENTATION | Markdown | NOT_PROVEN | UNKNOWN_AUTHORITY | NOT_PROVEN | N/A | N/A |
| SRC-0137 | ALL | `docs/clinical/clinical-service-contract.md` | DOCUMENTATION | Markdown | NOT_PROVEN | UNKNOWN_AUTHORITY | NOT_PROVEN | N/A | N/A |
| SRC-0138 | ALL | `docs/clinical/determinism-and-fingerprints.md` | DOCUMENTATION | Markdown | NOT_PROVEN | UNKNOWN_AUTHORITY | NOT_PROVEN | N/A | N/A |
| SRC-0139 | ALL | `docs/clinical/disease-dataset-audit.md` | DOCUMENTATION | Markdown | NOT_PROVEN | UNKNOWN_AUTHORITY | NOT_PROVEN | N/A | N/A |
| SRC-0140 | ALL | `docs/clinical/disease-extraction-procedure.md` | DOCUMENTATION | Markdown | NOT_PROVEN | UNKNOWN_AUTHORITY | NOT_PROVEN | N/A | N/A |
| SRC-0141 | ALL | `docs/clinical/disease-package-manifest.md` | DOCUMENTATION | Markdown | NOT_PROVEN | UNKNOWN_AUTHORITY | NOT_PROVEN | N/A | N/A |
| SRC-0142 | ALL | `docs/clinical/disease-package-schema.md` | DOCUMENTATION | Markdown | NOT_PROVEN | UNKNOWN_AUTHORITY | NOT_PROVEN | N/A | N/A |
| SRC-0143 | ALL | `docs/clinical/disease-retrieval-validation.md` | DOCUMENTATION | Markdown | NOT_PROVEN | UNKNOWN_AUTHORITY | NOT_PROVEN | N/A | N/A |
| SRC-0144 | ALL | `docs/clinical/disease-search-lineage.md` | DOCUMENTATION | Markdown | NOT_PROVEN | UNKNOWN_AUTHORITY | NOT_PROVEN | N/A | N/A |
| SRC-0145 | ALL | `docs/clinical/golden-case-catalog.md` | DOCUMENTATION | Markdown | NOT_PROVEN | SYNTHETIC_VALIDATION_ONLY | SYNTHETIC_VALIDATION_ONLY | N/A | N/A |
| SRC-0146 | ALL | `docs/clinical/golden-comparison-results.md` | DOCUMENTATION | Markdown | NOT_PROVEN | SYNTHETIC_VALIDATION_ONLY | SYNTHETIC_VALIDATION_ONLY | N/A | N/A |
| SRC-0147 | ALL | `docs/clinical/golden-validation-plan.md` | DOCUMENTATION | Markdown | NOT_PROVEN | SYNTHETIC_VALIDATION_ONLY | SYNTHETIC_VALIDATION_ONLY | N/A | N/A |
| SRC-0148 | ALL | `docs/clinical/medicine-registry-audit.md` | DOCUMENTATION | Markdown | NOT_PROVEN | UNKNOWN_AUTHORITY | NOT_PROVEN | N/A | N/A |
| SRC-0149 | ALL | `docs/clinical/medicine-registry-lineage.md` | DOCUMENTATION | Markdown | NOT_PROVEN | UNKNOWN_AUTHORITY | NOT_PROVEN | N/A | N/A |
| SRC-0150 | 6 | `docs/clinical/mixture-evidence-safety-policy.md` | DOCUMENTATION | Markdown | Rule 6 mixture evidence policy | OWNER_APPROVED | NOT_CONNECTED | N/A | SAC-005 |
| SRC-0151 | ALL | `docs/clinical/multimodal-boundary-audit.md` | DOCUMENTATION | Markdown | NOT_PROVEN | UNKNOWN_AUTHORITY | NOT_PROVEN | N/A | N/A |
| SRC-0152 | ALL | `docs/clinical/multimodal-reconstruction-status.md` | DOCUMENTATION | Markdown | NOT_PROVEN | UNKNOWN_AUTHORITY | NOT_PROVEN | N/A | N/A |
| SRC-0153 | 9 | `docs/clinical/nine-rule-engine-matrix.md` | DOCUMENTATION | Markdown | Nine-rule registry/orchestration | LEGACY_REFERENCE_ONLY | LEGACY_REFERENCE_ONLY | N/A | N/A |
| SRC-0154 | 9 | `docs/clinical/nine-rule-interface-status.md` | DOCUMENTATION | Markdown | Nine-rule registry/orchestration | UNKNOWN_AUTHORITY | NOT_PROVEN | N/A | N/A |
| SRC-0155 | 9 | `docs/clinical/nine-rule-orchestration.md` | DOCUMENTATION | Markdown | Nine-rule registry/orchestration | UNKNOWN_AUTHORITY | NOT_PROVEN | N/A | N/A |
| SRC-0156 | ALL | `docs/clinical/old-engine-source-inventory.md` | DOCUMENTATION | Markdown | NOT_PROVEN | LEGACY_REFERENCE_ONLY | LEGACY_REFERENCE_ONLY | N/A | N/A |
| SRC-0157 | ALL | `docs/clinical/phase5c-golden-assertion-review.md` | DOCUMENTATION | Markdown | NOT_PROVEN | SYNTHETIC_VALIDATION_ONLY | SYNTHETIC_VALIDATION_ONLY | N/A | N/A |
| SRC-0158 | ALL | `docs/clinical/phase-f-separation.md` | DOCUMENTATION | Markdown | NOT_PROVEN | UNKNOWN_AUTHORITY | NOT_PROVEN | N/A | N/A |
| SRC-0159 | ALL | `docs/clinical/prescription-boundary.md` | DOCUMENTATION | Markdown | NOT_PROVEN | UNKNOWN_AUTHORITY | NOT_PROVEN | N/A | N/A |
| SRC-0160 | ALL | `docs/clinical/prescription-pipeline-audit.md` | DOCUMENTATION | Markdown | NOT_PROVEN | LEGACY_REFERENCE_ONLY | LEGACY_REFERENCE_ONLY | N/A | N/A |
| SRC-0161 | ALL | `docs/clinical/prescription-readiness-matrix.md` | DOCUMENTATION | Markdown | NOT_PROVEN | UNKNOWN_AUTHORITY | NOT_PROVEN | N/A | N/A |
| SRC-0162 | ALL | `docs/clinical/README.md` | DOCUMENTATION | Markdown | NOT_PROVEN | UNKNOWN_AUTHORITY | NOT_PROVEN | N/A | N/A |
| SRC-0163 | 8 | `docs/clinical/rule-8-decision.md` | DOCUMENTATION | Markdown | Rule 8 candidate | UNKNOWN_AUTHORITY | NOT_PROVEN | N/A | SAC-006 |
| SRC-0164 | 8 | `docs/clinical/rule-8-readiness-decision.md` | DOCUMENTATION | Markdown | Rule 8 readiness (not constitution name) | UNKNOWN_AUTHORITY | NOT_PROVEN | N/A | SAC-006 |
| SRC-0165 | ALL | `docs/clinical/rule-by-rule-implementation-status.md` | DOCUMENTATION | Markdown | NOT_PROVEN | UNKNOWN_AUTHORITY | NOT_PROVEN | N/A | SAC-003 |
| SRC-0166 | 1 | `docs/clinical/rules/rule-01-legacy-conflicts.md` | DOCUMENTATION | Markdown | NOT_PROVEN | UNKNOWN_AUTHORITY | NOT_PROVEN | N/A | N/A |
| SRC-0167 | 1 | `docs/clinical/rules/rule-01-owner-decisions.md` | DOCUMENTATION | Markdown | NOT_PROVEN | OWNER_APPROVED | NOT_CONNECTED | N/A | N/A |
| SRC-0168 | 1 | `docs/clinical/rules/rule-01-temperament-engine.md` | DOCUMENTATION | Markdown | Rule 1 Temperament Engine | OWNER_APPROVED | NOT_CONNECTED | N/A | N/A |
| SRC-0169 | 1 | `docs/clinical/rules/rule-01-test-requirements.md` | DOCUMENTATION | Markdown | NOT_PROVEN | UNKNOWN_AUTHORITY | NOT_PROVEN | N/A | N/A |
| SRC-0170 | 2 | `docs/clinical/rules/rule-02-data-contract.md` | DOCUMENTATION | Markdown | NOT_PROVEN | UNKNOWN_AUTHORITY | NOT_PROVEN | N/A | N/A |
| SRC-0171 | 2 | `docs/clinical/rules/rule-02-legacy-conflicts.md` | DOCUMENTATION | Markdown | NOT_PROVEN | UNKNOWN_AUTHORITY | NOT_PROVEN | N/A | N/A |
| SRC-0172 | 2 | `docs/clinical/rules/rule-02-owner-decisions.md` | DOCUMENTATION | Markdown | NOT_PROVEN | OWNER_APPROVED | NOT_CONNECTED | N/A | N/A |
| SRC-0173 | 2 | `docs/clinical/rules/rule-02-polarity-engine.md` | DOCUMENTATION | Markdown | Rule 2 Polarity Engine | OWNER_APPROVED | NOT_CONNECTED | N/A | N/A |
| SRC-0174 | 2 | `docs/clinical/rules/rule-02-test-requirements.md` | DOCUMENTATION | Markdown | NOT_PROVEN | UNKNOWN_AUTHORITY | NOT_PROVEN | N/A | N/A |
| SRC-0175 | 3 | `docs/clinical/rules/rule-03-data-contract.md` | DOCUMENTATION | Markdown | NOT_PROVEN | UNKNOWN_AUTHORITY | NOT_PROVEN | N/A | N/A |
| SRC-0176 | 3 | `docs/clinical/rules/rule-03-legacy-conflicts.md` | DOCUMENTATION | Markdown | NOT_PROVEN | UNKNOWN_AUTHORITY | NOT_PROVEN | N/A | N/A |
| SRC-0177 | 3 | `docs/clinical/rules/rule-03-organ-system-affinity.md` | DOCUMENTATION | Markdown | Rule 3 Organ-System Affinity | OWNER_APPROVED | NOT_CONNECTED | N/A | N/A |
| SRC-0178 | 3 | `docs/clinical/rules/rule-03-owner-decisions.md` | DOCUMENTATION | Markdown | NOT_PROVEN | OWNER_APPROVED | NOT_CONNECTED | N/A | N/A |
| SRC-0179 | 3 | `docs/clinical/rules/rule-03-test-requirements.md` | DOCUMENTATION | Markdown | NOT_PROVEN | UNKNOWN_AUTHORITY | NOT_PROVEN | N/A | N/A |
| SRC-0180 | 4 | `docs/clinical/rules/rule-04-owner-decisions-DRAFT.md` | DOCUMENTATION | Markdown | Rule 4 Potency owner decisions (DRAFT path) | NORMATIVE_CANDIDATE | NOT_CONNECTED | N/A | SAC-003 |
| SRC-0181 | 4 | `docs/clinical/rules/rule-04-potency-engine-DRAFT.md` | DOCUMENTATION | Markdown | Rule 4 Potency engine (DRAFT path) | NORMATIVE_CANDIDATE | NOT_CONNECTED | N/A | SAC-003 |
| SRC-0182 | 4 | `docs/clinical/rules/rule-04-unresolved-clinical-questions-DRAFT.md` | DOCUMENTATION | Markdown | Rule 4 unresolved questions (DRAFT path) | NORMATIVE_CANDIDATE | NOT_CONNECTED | N/A | SAC-003 |
| SRC-0183 | ALL | `docs/clinical/tablet-full-pool-reconstruction.md` | DOCUMENTATION | Markdown | NOT_PROVEN | UNKNOWN_AUTHORITY | NOT_PROVEN | N/A | N/A |
| SRC-0184 | 4 | `fixtures/rule4/candidate-eligibility-scenarios.v1.json` | FIXTURE | JSON | NOT_PROVEN | SYNTHETIC_VALIDATION_ONLY | SYNTHETIC_VALIDATION_ONLY | rule4 unit/integration tests | N/A |
| SRC-0185 | 4 | `fixtures/rule4/doctor-review-issuance-scenarios.v1.json` | FIXTURE | JSON | NOT_PROVEN | SYNTHETIC_VALIDATION_ONLY | SYNTHETIC_VALIDATION_ONLY | rule4 unit/integration tests | N/A |
| SRC-0186 | 4 | `fixtures/rule4/evidence-adapter-scenarios.v1.json` | FIXTURE | JSON | NOT_PROVEN | SYNTHETIC_VALIDATION_ONLY | SYNTHETIC_VALIDATION_ONLY | rule4 unit/integration tests | N/A |
| SRC-0187 | 4 | `fixtures/rule4/numeric-selection-scenarios.v1.json` | FIXTURE | JSON | NOT_PROVEN | SYNTHETIC_VALIDATION_ONLY | SYNTHETIC_VALIDATION_ONLY | rule4 unit/integration tests | N/A |
| SRC-0188 | 4 | `fixtures/rule4/pediatric-overlay-scenarios.v1.json` | FIXTURE | JSON | NOT_PROVEN | SYNTHETIC_VALIDATION_ONLY | SYNTHETIC_VALIDATION_ONLY | rule4 unit/integration tests | N/A |
| SRC-0189 | 4 | `fixtures/rule4/phase2-allowed-critical-codes.v1.json` | FIXTURE | JSON | NOT_PROVEN | SYNTHETIC_VALIDATION_ONLY | SYNTHETIC_VALIDATION_ONLY | rule4 unit/integration tests | N/A |
| SRC-0190 | 4 | `fixtures/rule4/phase-resolution-scenarios.v1.json` | FIXTURE | JSON | NOT_PROVEN | SYNTHETIC_VALIDATION_ONLY | SYNTHETIC_VALIDATION_ONLY | rule4 unit/integration tests | N/A |
| SRC-0191 | 2 | `fixtures/rule4/polarity-routing-scenarios.v1.json` | FIXTURE | JSON | Rule 2 polarity (Rule 4 adapter) | SYNTHETIC_VALIDATION_ONLY | SYNTHETIC_VALIDATION_ONLY | rule4 unit/integration tests | N/A |
| SRC-0192 | 4 | `fixtures/rule4/reason-code-registry.phase10-doctor-review-issuance-subset.v1.json` | FIXTURE | JSON | NOT_PROVEN | SYNTHETIC_VALIDATION_ONLY | SYNTHETIC_VALIDATION_ONLY | rule4 unit/integration tests | N/A |
| SRC-0193 | 4 | `fixtures/rule4/reason-code-registry.phase1-foundation-subset.v1.json` | FIXTURE | JSON | NOT_PROVEN | SYNTHETIC_VALIDATION_ONLY | SYNTHETIC_VALIDATION_ONLY | rule4 unit/integration tests | N/A |
| SRC-0194 | 4 | `fixtures/rule4/reason-code-registry.phase2-safety-subset.v1.json` | FIXTURE | JSON | NOT_PROVEN | SYNTHETIC_VALIDATION_ONLY | SYNTHETIC_VALIDATION_ONLY | rule4 unit/integration tests | N/A |
| SRC-0195 | 4 | `fixtures/rule4/reason-code-registry.phase3-evidence-subset.v1.json` | FIXTURE | JSON | NOT_PROVEN | SYNTHETIC_VALIDATION_ONLY | SYNTHETIC_VALIDATION_ONLY | rule4 unit/integration tests | N/A |
| SRC-0196 | 2 | `fixtures/rule4/reason-code-registry.phase4-polarity-subset.v1.json` | FIXTURE | JSON | Rule 2 polarity (Rule 4 adapter) | SYNTHETIC_VALIDATION_ONLY | SYNTHETIC_VALIDATION_ONLY | rule4 unit/integration tests | N/A |
| SRC-0197 | 4 | `fixtures/rule4/reason-code-registry.phase5-structured-phase-subset.v1.json` | FIXTURE | JSON | NOT_PROVEN | SYNTHETIC_VALIDATION_ONLY | SYNTHETIC_VALIDATION_ONLY | rule4 unit/integration tests | N/A |
| SRC-0198 | 4 | `fixtures/rule4/reason-code-registry.phase6-structured-severity-subset.v1.json` | FIXTURE | JSON | NOT_PROVEN | SYNTHETIC_VALIDATION_ONLY | SYNTHETIC_VALIDATION_ONLY | rule4 unit/integration tests | N/A |
| SRC-0199 | 4 | `fixtures/rule4/reason-code-registry.phase7-candidate-eligibility-subset.v1.json` | FIXTURE | JSON | NOT_PROVEN | SYNTHETIC_VALIDATION_ONLY | SYNTHETIC_VALIDATION_ONLY | rule4 unit/integration tests | N/A |
| SRC-0200 | 4 | `fixtures/rule4/reason-code-registry.phase8-numeric-selection-subset.v1.json` | FIXTURE | JSON | NOT_PROVEN | SYNTHETIC_VALIDATION_ONLY | SYNTHETIC_VALIDATION_ONLY | rule4 unit/integration tests | N/A |
| SRC-0201 | 4 | `fixtures/rule4/reason-code-registry.phase9-pediatric-overlay-subset.v1.json` | FIXTURE | JSON | NOT_PROVEN | SYNTHETIC_VALIDATION_ONLY | SYNTHETIC_VALIDATION_ONLY | rule4 unit/integration tests | N/A |
| SRC-0202 | 4 | `fixtures/rule4/rule4-contract-baseline.v1.json` | FIXTURE | JSON | NOT_PROVEN | SYNTHETIC_VALIDATION_ONLY | SYNTHETIC_VALIDATION_ONLY | rule4 unit/integration tests | N/A |
| SRC-0203 | 4 | `fixtures/rule4/safety-gate-scenarios.v1.json` | FIXTURE | JSON | NOT_PROVEN | SYNTHETIC_VALIDATION_ONLY | SYNTHETIC_VALIDATION_ONLY | rule4 unit/integration tests | N/A |
| SRC-0204 | 4 | `fixtures/rule4/severity-resolution-scenarios.v1.json` | FIXTURE | JSON | NOT_PROVEN | SYNTHETIC_VALIDATION_ONLY | SYNTHETIC_VALIDATION_ONLY | rule4 unit/integration tests | N/A |
| SRC-0205 | ALL | `packages/clinical-contracts/package.json` | CONTRACT_IMPLEMENTATION | JSON | NOT_PROVEN | UNKNOWN_AUTHORITY | NOT_PROVEN | NOT_PROVEN | N/A |
| SRC-0206 | ALL | `packages/clinical-contracts/src/analyze.ts` | CONTRACT_IMPLEMENTATION | TypeScript | NOT_PROVEN | UNKNOWN_AUTHORITY | NOT_PROVEN | NOT_PROVEN | N/A |
| SRC-0207 | ALL | `packages/clinical-contracts/src/constitution.ts` | CONTRACT_IMPLEMENTATION | TypeScript | NOT_PROVEN | UNKNOWN_AUTHORITY | NOT_PROVEN | NOT_PROVEN | SAC-005 |
| SRC-0208 | ALL | `packages/clinical-contracts/src/index.ts` | CONTRACT_IMPLEMENTATION | TypeScript | NOT_PROVEN | UNKNOWN_AUTHORITY | NOT_PROVEN | NOT_PROVEN | N/A |
| SRC-0209 | 9 | `packages/clinical-contracts/src/nineRules.ts` | CONTRACT_IMPLEMENTATION | TypeScript | Nine-rule registry/orchestration | IMPLEMENTATION_CURRENT | SHADOW_ONLY | NOT_PROVEN | N/A |
| SRC-0210 | 4 | `packages/clinical-contracts/src/rule4/canonicalJson.ts` | CONTRACT_IMPLEMENTATION | TypeScript | Rule 4 contract surface (Potency) | IMPLEMENTATION_CURRENT | SHADOW_ONLY | unit tests rule4*; shadow adapters | N/A |
| SRC-0211 | 4 | `packages/clinical-contracts/src/rule4/doctorReview/auditEvents.ts` | CONTRACT_IMPLEMENTATION | TypeScript | Rule 4 contract surface (Potency) | IMPLEMENTATION_CURRENT | SHADOW_ONLY | unit tests rule4*; shadow adapters | N/A |
| SRC-0212 | 4 | `packages/clinical-contracts/src/rule4/doctorReview/buildShadowAuditEvents.ts` | CONTRACT_IMPLEMENTATION | TypeScript | Rule 4 contract surface (Potency) | IMPLEMENTATION_CURRENT | SHADOW_ONLY | unit tests rule4*; shadow adapters | N/A |
| SRC-0213 | 4 | `packages/clinical-contracts/src/rule4/doctorReview/doctorReviewFingerprintV1.ts` | CONTRACT_IMPLEMENTATION | TypeScript | Rule 4 contract surface (Potency) | IMPLEMENTATION_CURRENT | SHADOW_ONLY | unit tests rule4*; shadow adapters | N/A |
| SRC-0214 | 4 | `packages/clinical-contracts/src/rule4/doctorReview/evaluateDoctorReviewAdapter.ts` | CONTRACT_IMPLEMENTATION | TypeScript | Rule 4 contract surface (Potency) | IMPLEMENTATION_CURRENT | SHADOW_ONLY | unit tests rule4*; shadow adapters | N/A |
| SRC-0215 | 4 | `packages/clinical-contracts/src/rule4/doctorReview/expectedAuthenticityAuthority.ts` | CONTRACT_IMPLEMENTATION | TypeScript | Rule 4 contract surface (Potency) | IMPLEMENTATION_CURRENT | SHADOW_ONLY | unit tests rule4*; shadow adapters | N/A |
| SRC-0216 | 4 | `packages/clinical-contracts/src/rule4/doctorReview/gateLedger.ts` | CONTRACT_IMPLEMENTATION | TypeScript | Rule 4 contract surface (Potency) | IMPLEMENTATION_CURRENT | SHADOW_ONLY | unit tests rule4*; shadow adapters | N/A |
| SRC-0217 | 4 | `packages/clinical-contracts/src/rule4/doctorReview/index.ts` | CONTRACT_IMPLEMENTATION | TypeScript | Rule 4 contract surface (Potency) | IMPLEMENTATION_CURRENT | SHADOW_ONLY | unit tests rule4*; shadow adapters | N/A |
| SRC-0218 | 4 | `packages/clinical-contracts/src/rule4/doctorReview/reviewCodeValidation.ts` | CONTRACT_IMPLEMENTATION | TypeScript | Rule 4 contract surface (Potency) | IMPLEMENTATION_CURRENT | SHADOW_ONLY | unit tests rule4*; shadow adapters | N/A |
| SRC-0219 | 4 | `packages/clinical-contracts/src/rule4/doctorReview/types.ts` | CONTRACT_IMPLEMENTATION | TypeScript | Rule 4 contract surface (Potency) | IMPLEMENTATION_CURRENT | SHADOW_ONLY | unit tests rule4*; shadow adapters | N/A |
| SRC-0220 | 4 | `packages/clinical-contracts/src/rule4/eligibility/eligibilityCodeValidation.ts` | CONTRACT_IMPLEMENTATION | TypeScript | Rule 4 contract surface (Potency) | IMPLEMENTATION_CURRENT | SHADOW_ONLY | unit tests rule4*; shadow adapters | N/A |
| SRC-0221 | 4 | `packages/clinical-contracts/src/rule4/eligibility/eligibilityFingerprintV1.ts` | CONTRACT_IMPLEMENTATION | TypeScript | Rule 4 contract surface (Potency) | IMPLEMENTATION_CURRENT | SHADOW_ONLY | unit tests rule4*; shadow adapters | N/A |
| SRC-0222 | 4 | `packages/clinical-contracts/src/rule4/eligibility/evaluateEligibilityAdapter.ts` | CONTRACT_IMPLEMENTATION | TypeScript | Rule 4 contract surface (Potency) | IMPLEMENTATION_CURRENT | SHADOW_ONLY | unit tests rule4*; shadow adapters | N/A |
| SRC-0223 | 4 | `packages/clinical-contracts/src/rule4/eligibility/formulaBpGate.ts` | CONTRACT_IMPLEMENTATION | TypeScript | Rule 4 contract surface (Potency) | IMPLEMENTATION_CURRENT | SHADOW_ONLY | unit tests rule4*; shadow adapters | N/A |
| SRC-0224 | 4 | `packages/clinical-contracts/src/rule4/eligibility/gateLedger.ts` | CONTRACT_IMPLEMENTATION | TypeScript | Rule 4 contract surface (Potency) | IMPLEMENTATION_CURRENT | SHADOW_ONLY | unit tests rule4*; shadow adapters | N/A |
| SRC-0225 | 4 | `packages/clinical-contracts/src/rule4/eligibility/index.ts` | CONTRACT_IMPLEMENTATION | TypeScript | Rule 4 contract surface (Potency) | IMPLEMENTATION_CURRENT | SHADOW_ONLY | unit tests rule4*; shadow adapters | N/A |
| SRC-0226 | 4 | `packages/clinical-contracts/src/rule4/eligibility/resolveSlotEligibility.ts` | CONTRACT_IMPLEMENTATION | TypeScript | Rule 4 contract surface (Potency) | IMPLEMENTATION_CURRENT | SHADOW_ONLY | unit tests rule4*; shadow adapters | N/A |
| SRC-0227 | 4 | `packages/clinical-contracts/src/rule4/eligibility/types.ts` | CONTRACT_IMPLEMENTATION | TypeScript | Rule 4 contract surface (Potency) | IMPLEMENTATION_CURRENT | SHADOW_ONLY | unit tests rule4*; shadow adapters | N/A |
| SRC-0228 | 4 | `packages/clinical-contracts/src/rule4/emptyResultFingerprintV1.ts` | CONTRACT_IMPLEMENTATION | TypeScript | Rule 4 contract surface (Potency) | IMPLEMENTATION_CURRENT | SHADOW_ONLY | unit tests rule4*; shadow adapters | N/A |
| SRC-0229 | 4 | `packages/clinical-contracts/src/rule4/evaluator.ts` | CONTRACT_IMPLEMENTATION | TypeScript | Rule 4 contract surface (Potency) | IMPLEMENTATION_CURRENT | SHADOW_ONLY | unit tests rule4*; shadow adapters | N/A |
| SRC-0230 | 4 | `packages/clinical-contracts/src/rule4/evidence/assertionValidator.ts` | CONTRACT_IMPLEMENTATION | TypeScript | Rule 4 contract surface (Potency) | IMPLEMENTATION_CURRENT | SHADOW_ONLY | unit tests rule4*; shadow adapters | N/A |
| SRC-0231 | 4 | `packages/clinical-contracts/src/rule4/evidence/contradictionResolver.ts` | CONTRACT_IMPLEMENTATION | TypeScript | Rule 4 contract surface (Potency) | IMPLEMENTATION_CURRENT | SHADOW_ONLY | unit tests rule4*; shadow adapters | N/A |
| SRC-0232 | 4 | `packages/clinical-contracts/src/rule4/evidence/dedupe.ts` | CONTRACT_IMPLEMENTATION | TypeScript | Rule 4 contract surface (Potency) | IMPLEMENTATION_CURRENT | SHADOW_ONLY | unit tests rule4*; shadow adapters | N/A |
| SRC-0233 | 4 | `packages/clinical-contracts/src/rule4/evidence/documentGate.ts` | CONTRACT_IMPLEMENTATION | TypeScript | Rule 4 contract surface (Potency) | IMPLEMENTATION_CURRENT | SHADOW_ONLY | unit tests rule4*; shadow adapters | N/A |
| SRC-0234 | 4 | `packages/clinical-contracts/src/rule4/evidence/evaluateEvidenceAdapter.ts` | CONTRACT_IMPLEMENTATION | TypeScript | Rule 4 contract surface (Potency) | IMPLEMENTATION_CURRENT | SHADOW_ONLY | unit tests rule4*; shadow adapters | N/A |
| SRC-0235 | 4 | `packages/clinical-contracts/src/rule4/evidence/evidenceFingerprintV1.ts` | CONTRACT_IMPLEMENTATION | TypeScript | Rule 4 contract surface (Potency) | IMPLEMENTATION_CURRENT | SHADOW_ONLY | unit tests rule4*; shadow adapters | N/A |
| SRC-0236 | 4 | `packages/clinical-contracts/src/rule4/evidence/index.ts` | CONTRACT_IMPLEMENTATION | TypeScript | Rule 4 contract surface (Potency) | IMPLEMENTATION_CURRENT | SHADOW_ONLY | unit tests rule4*; shadow adapters | N/A |
| SRC-0237 | 4 | `packages/clinical-contracts/src/rule4/evidence/itemGate.ts` | CONTRACT_IMPLEMENTATION | TypeScript | Rule 4 contract surface (Potency) | IMPLEMENTATION_CURRENT | SHADOW_ONLY | unit tests rule4*; shadow adapters | N/A |
| SRC-0238 | 4 | `packages/clinical-contracts/src/rule4/evidence/quarantine.ts` | CONTRACT_IMPLEMENTATION | TypeScript | Rule 4 contract surface (Potency) | IMPLEMENTATION_CURRENT | SHADOW_ONLY | unit tests rule4*; shadow adapters | N/A |
| SRC-0239 | 4 | `packages/clinical-contracts/src/rule4/evidence/rule3BindingPort.ts` | CONTRACT_IMPLEMENTATION | TypeScript | Rule 4 contract surface (Potency) | IMPLEMENTATION_CURRENT | SHADOW_ONLY | unit tests rule4*; shadow adapters | N/A |
| SRC-0240 | 4 | `packages/clinical-contracts/src/rule4/evidence/sourceComparabilityTier.ts` | CONTRACT_IMPLEMENTATION | TypeScript | Rule 4 contract surface (Potency) | IMPLEMENTATION_CURRENT | SHADOW_ONLY | unit tests rule4*; shadow adapters | N/A |
| SRC-0241 | 4 | `packages/clinical-contracts/src/rule4/evidence/supersession.ts` | CONTRACT_IMPLEMENTATION | TypeScript | Rule 4 contract surface (Potency) | IMPLEMENTATION_CURRENT | SHADOW_ONLY | unit tests rule4*; shadow adapters | N/A |
| SRC-0242 | 4 | `packages/clinical-contracts/src/rule4/evidence/types.ts` | CONTRACT_IMPLEMENTATION | TypeScript | Rule 4 contract surface (Potency) | IMPLEMENTATION_CURRENT | SHADOW_ONLY | unit tests rule4*; shadow adapters | N/A |
| SRC-0243 | 4 | `packages/clinical-contracts/src/rule4/fingerprint.ts` | CONTRACT_IMPLEMENTATION | TypeScript | Rule 4 contract surface (Potency) | IMPLEMENTATION_CURRENT | SHADOW_ONLY | unit tests rule4*; shadow adapters | N/A |
| SRC-0244 | 4 | `packages/clinical-contracts/src/rule4/index.ts` | CONTRACT_IMPLEMENTATION | TypeScript | Rule 4 contract surface (Potency) | IMPLEMENTATION_CURRENT | SHADOW_ONLY | unit tests rule4*; shadow adapters | N/A |
| SRC-0245 | 4 | `packages/clinical-contracts/src/rule4/input.ts` | CONTRACT_IMPLEMENTATION | TypeScript | Rule 4 contract surface (Potency) | IMPLEMENTATION_CURRENT | SHADOW_ONLY | unit tests rule4*; shadow adapters | N/A |
| SRC-0246 | 4 | `packages/clinical-contracts/src/rule4/output.ts` | CONTRACT_IMPLEMENTATION | TypeScript | Rule 4 contract surface (Potency) | IMPLEMENTATION_CURRENT | SHADOW_ONLY | unit tests rule4*; shadow adapters | N/A |
| SRC-0247 | 4 | `packages/clinical-contracts/src/rule4/outputCodeValidation.ts` | CONTRACT_IMPLEMENTATION | TypeScript | Rule 4 contract surface (Potency) | IMPLEMENTATION_CURRENT | SHADOW_ONLY | unit tests rule4*; shadow adapters | N/A |
| SRC-0248 | 4 | `packages/clinical-contracts/src/rule4/pediatricOverlay/evaluatePediatricOverlayAdapter.ts` | CONTRACT_IMPLEMENTATION | TypeScript | Rule 4 contract surface (Potency) | IMPLEMENTATION_CURRENT | SHADOW_ONLY | unit tests rule4*; shadow adapters | N/A |
| SRC-0249 | 4 | `packages/clinical-contracts/src/rule4/pediatricOverlay/index.ts` | CONTRACT_IMPLEMENTATION | TypeScript | Rule 4 contract surface (Potency) | IMPLEMENTATION_CURRENT | SHADOW_ONLY | unit tests rule4*; shadow adapters | N/A |
| SRC-0250 | 4 | `packages/clinical-contracts/src/rule4/pediatricOverlay/overlayCodeValidation.ts` | CONTRACT_IMPLEMENTATION | TypeScript | Rule 4 contract surface (Potency) | IMPLEMENTATION_CURRENT | SHADOW_ONLY | unit tests rule4*; shadow adapters | N/A |
| SRC-0251 | 4 | `packages/clinical-contracts/src/rule4/pediatricOverlay/overlayMatrix.ts` | CONTRACT_IMPLEMENTATION | TypeScript | Rule 4 contract surface (Potency) | IMPLEMENTATION_CURRENT | SHADOW_ONLY | unit tests rule4*; shadow adapters | N/A |
| SRC-0252 | 4 | `packages/clinical-contracts/src/rule4/pediatricOverlay/pediatricOverlayFingerprintV1.ts` | CONTRACT_IMPLEMENTATION | TypeScript | Rule 4 contract surface (Potency) | IMPLEMENTATION_CURRENT | SHADOW_ONLY | unit tests rule4*; shadow adapters | N/A |
| SRC-0253 | 4 | `packages/clinical-contracts/src/rule4/pediatricOverlay/resolveSlotPediatricOverlay.ts` | CONTRACT_IMPLEMENTATION | TypeScript | Rule 4 contract surface (Potency) | IMPLEMENTATION_CURRENT | SHADOW_ONLY | unit tests rule4*; shadow adapters | N/A |
| SRC-0254 | 4 | `packages/clinical-contracts/src/rule4/pediatricOverlay/types.ts` | CONTRACT_IMPLEMENTATION | TypeScript | Rule 4 contract surface (Potency) | IMPLEMENTATION_CURRENT | SHADOW_ONLY | unit tests rule4*; shadow adapters | N/A |
| SRC-0255 | 4 | `packages/clinical-contracts/src/rule4/phase/bindingGate.ts` | CONTRACT_IMPLEMENTATION | TypeScript | Rule 4 contract surface (Potency) | IMPLEMENTATION_CURRENT | SHADOW_ONLY | unit tests rule4*; shadow adapters | N/A |
| SRC-0256 | 4 | `packages/clinical-contracts/src/rule4/phase/dayBands.ts` | CONTRACT_IMPLEMENTATION | TypeScript | Rule 4 contract surface (Potency) | IMPLEMENTATION_CURRENT | SHADOW_ONLY | unit tests rule4*; shadow adapters | N/A |
| SRC-0257 | 4 | `packages/clinical-contracts/src/rule4/phase/durationCalendar.ts` | CONTRACT_IMPLEMENTATION | TypeScript | Rule 4 contract surface (Potency) | IMPLEMENTATION_CURRENT | SHADOW_ONLY | unit tests rule4*; shadow adapters | N/A |
| SRC-0258 | 4 | `packages/clinical-contracts/src/rule4/phase/evaluatePhaseAdapter.ts` | CONTRACT_IMPLEMENTATION | TypeScript | Rule 4 contract surface (Potency) | IMPLEMENTATION_CURRENT | SHADOW_ONLY | unit tests rule4*; shadow adapters | N/A |
| SRC-0259 | 4 | `packages/clinical-contracts/src/rule4/phase/index.ts` | CONTRACT_IMPLEMENTATION | TypeScript | Rule 4 contract surface (Potency) | IMPLEMENTATION_CURRENT | SHADOW_ONLY | unit tests rule4*; shadow adapters | N/A |
| SRC-0260 | 4 | `packages/clinical-contracts/src/rule4/phase/phaseCodeValidation.ts` | CONTRACT_IMPLEMENTATION | TypeScript | Rule 4 contract surface (Potency) | IMPLEMENTATION_CURRENT | SHADOW_ONLY | unit tests rule4*; shadow adapters | N/A |
| SRC-0261 | 4 | `packages/clinical-contracts/src/rule4/phase/phaseFingerprintV1.ts` | CONTRACT_IMPLEMENTATION | TypeScript | Rule 4 contract surface (Potency) | IMPLEMENTATION_CURRENT | SHADOW_ONLY | unit tests rule4*; shadow adapters | N/A |
| SRC-0262 | 4 | `packages/clinical-contracts/src/rule4/phase/resolveSlotPhase.ts` | CONTRACT_IMPLEMENTATION | TypeScript | Rule 4 contract surface (Potency) | IMPLEMENTATION_CURRENT | SHADOW_ONLY | unit tests rule4*; shadow adapters | N/A |
| SRC-0263 | 4 | `packages/clinical-contracts/src/rule4/phase/types.ts` | CONTRACT_IMPLEMENTATION | TypeScript | Rule 4 contract surface (Potency) | IMPLEMENTATION_CURRENT | SHADOW_ONLY | unit tests rule4*; shadow adapters | N/A |
| SRC-0264 | 2 | `packages/clinical-contracts/src/rule4/polarity/bindingGate.ts` | CONTRACT_IMPLEMENTATION | TypeScript | Rule 2 polarity (Rule 4 adapter) | IMPLEMENTATION_CURRENT | SHADOW_ONLY | unit tests rule4*; shadow adapters | N/A |
| SRC-0265 | 2 | `packages/clinical-contracts/src/rule4/polarity/evaluatePolarityAdapter.ts` | CONTRACT_IMPLEMENTATION | TypeScript | Rule 2 polarity (Rule 4 adapter) | IMPLEMENTATION_CURRENT | SHADOW_ONLY | unit tests rule4*; shadow adapters | N/A |
| SRC-0266 | 2 | `packages/clinical-contracts/src/rule4/polarity/index.ts` | CONTRACT_IMPLEMENTATION | TypeScript | Rule 2 polarity (Rule 4 adapter) | IMPLEMENTATION_CURRENT | SHADOW_ONLY | unit tests rule4*; shadow adapters | N/A |
| SRC-0267 | 2 | `packages/clinical-contracts/src/rule4/polarity/pathwayRouter.ts` | CONTRACT_IMPLEMENTATION | TypeScript | Rule 2 polarity (Rule 4 adapter) | IMPLEMENTATION_CURRENT | SHADOW_ONLY | unit tests rule4*; shadow adapters | N/A |
| SRC-0268 | 2 | `packages/clinical-contracts/src/rule4/polarity/polarityCodeValidation.ts` | CONTRACT_IMPLEMENTATION | TypeScript | Rule 2 polarity (Rule 4 adapter) | IMPLEMENTATION_CURRENT | SHADOW_ONLY | unit tests rule4*; shadow adapters | N/A |
| SRC-0269 | 2 | `packages/clinical-contracts/src/rule4/polarity/polarityFingerprintV1.ts` | CONTRACT_IMPLEMENTATION | TypeScript | Rule 2 polarity (Rule 4 adapter) | IMPLEMENTATION_CURRENT | SHADOW_ONLY | unit tests rule4*; shadow adapters | N/A |
| SRC-0270 | 2 | `packages/clinical-contracts/src/rule4/polarity/rule2Validate.ts` | CONTRACT_IMPLEMENTATION | TypeScript | Rule 2 polarity (Rule 4 adapter) | IMPLEMENTATION_CURRENT | SHADOW_ONLY | unit tests rule4*; shadow adapters | N/A |
| SRC-0271 | 2 | `packages/clinical-contracts/src/rule4/polarity/types.ts` | CONTRACT_IMPLEMENTATION | TypeScript | Rule 2 polarity (Rule 4 adapter) | IMPLEMENTATION_CURRENT | SHADOW_ONLY | unit tests rule4*; shadow adapters | N/A |
| SRC-0272 | 4 | `packages/clinical-contracts/src/rule4/reasonCodes.ts` | CONTRACT_IMPLEMENTATION | TypeScript | Rule 4 contract surface (Potency) | IMPLEMENTATION_CURRENT | SHADOW_ONLY | unit tests rule4*; shadow adapters | N/A |
| SRC-0273 | 4 | `packages/clinical-contracts/src/rule4/reasonCodesPhase10.ts` | CONTRACT_IMPLEMENTATION | TypeScript | Rule 4 contract surface (Potency) | IMPLEMENTATION_CURRENT | SHADOW_ONLY | unit tests rule4*; shadow adapters | N/A |
| SRC-0274 | 4 | `packages/clinical-contracts/src/rule4/reasonCodesPhase2.ts` | CONTRACT_IMPLEMENTATION | TypeScript | Rule 4 contract surface (Potency) | IMPLEMENTATION_CURRENT | SHADOW_ONLY | unit tests rule4*; shadow adapters | N/A |
| SRC-0275 | 4 | `packages/clinical-contracts/src/rule4/reasonCodesPhase3.ts` | CONTRACT_IMPLEMENTATION | TypeScript | Rule 4 contract surface (Potency) | IMPLEMENTATION_CURRENT | SHADOW_ONLY | unit tests rule4*; shadow adapters | N/A |
| SRC-0276 | 4 | `packages/clinical-contracts/src/rule4/reasonCodesPhase4.ts` | CONTRACT_IMPLEMENTATION | TypeScript | Rule 4 contract surface (Potency) | IMPLEMENTATION_CURRENT | SHADOW_ONLY | unit tests rule4*; shadow adapters | N/A |
| SRC-0277 | 4 | `packages/clinical-contracts/src/rule4/reasonCodesPhase5.ts` | CONTRACT_IMPLEMENTATION | TypeScript | Rule 4 contract surface (Potency) | IMPLEMENTATION_CURRENT | SHADOW_ONLY | unit tests rule4*; shadow adapters | N/A |
| SRC-0278 | 4 | `packages/clinical-contracts/src/rule4/reasonCodesPhase6.ts` | CONTRACT_IMPLEMENTATION | TypeScript | Rule 4 contract surface (Potency) | IMPLEMENTATION_CURRENT | SHADOW_ONLY | unit tests rule4*; shadow adapters | N/A |
| SRC-0279 | 4 | `packages/clinical-contracts/src/rule4/reasonCodesPhase7.ts` | CONTRACT_IMPLEMENTATION | TypeScript | Rule 4 contract surface (Potency) | IMPLEMENTATION_CURRENT | SHADOW_ONLY | unit tests rule4*; shadow adapters | N/A |
| SRC-0280 | 4 | `packages/clinical-contracts/src/rule4/reasonCodesPhase8.ts` | CONTRACT_IMPLEMENTATION | TypeScript | Rule 4 contract surface (Potency) | IMPLEMENTATION_CURRENT | SHADOW_ONLY | unit tests rule4*; shadow adapters | N/A |
| SRC-0281 | 4 | `packages/clinical-contracts/src/rule4/reasonCodesPhase9.ts` | CONTRACT_IMPLEMENTATION | TypeScript | Rule 4 contract surface (Potency) | IMPLEMENTATION_CURRENT | SHADOW_ONLY | unit tests rule4*; shadow adapters | N/A |
| SRC-0282 | 4 | `packages/clinical-contracts/src/rule4/registryMerge.ts` | CONTRACT_IMPLEMENTATION | TypeScript | Rule 4 contract surface (Potency) | IMPLEMENTATION_CURRENT | SHADOW_ONLY | unit tests rule4*; shadow adapters | N/A |
| SRC-0283 | 4 | `packages/clinical-contracts/src/rule4/safety/ageValidator.ts` | CONTRACT_IMPLEMENTATION | TypeScript | Rule 4 contract surface (Potency) | IMPLEMENTATION_CURRENT | SHADOW_ONLY | unit tests rule4*; shadow adapters | N/A |
| SRC-0284 | 4 | `packages/clinical-contracts/src/rule4/safety/bpCrisis.ts` | CONTRACT_IMPLEMENTATION | TypeScript | Rule 4 contract surface (Potency) | IMPLEMENTATION_CURRENT | SHADOW_ONLY | unit tests rule4*; shadow adapters | N/A |
| SRC-0285 | 4 | `packages/clinical-contracts/src/rule4/safety/dateCalendar.ts` | CONTRACT_IMPLEMENTATION | TypeScript | Rule 4 contract surface (Potency) | IMPLEMENTATION_CURRENT | SHADOW_ONLY | unit tests rule4*; shadow adapters | N/A |
| SRC-0286 | 4 | `packages/clinical-contracts/src/rule4/safety/evaluateSafetyGate.ts` | CONTRACT_IMPLEMENTATION | TypeScript | Rule 4 contract surface (Potency) | IMPLEMENTATION_CURRENT | SHADOW_ONLY | unit tests rule4*; shadow adapters | N/A |
| SRC-0287 | 4 | `packages/clinical-contracts/src/rule4/safety/holdAggregator.ts` | CONTRACT_IMPLEMENTATION | TypeScript | Rule 4 contract surface (Potency) | IMPLEMENTATION_CURRENT | SHADOW_ONLY | unit tests rule4*; shadow adapters | N/A |
| SRC-0288 | 4 | `packages/clinical-contracts/src/rule4/safety/index.ts` | CONTRACT_IMPLEMENTATION | TypeScript | Rule 4 contract surface (Potency) | IMPLEMENTATION_CURRENT | SHADOW_ONLY | unit tests rule4*; shadow adapters | N/A |
| SRC-0289 | 4 | `packages/clinical-contracts/src/rule4/safety/structuredCritical.ts` | CONTRACT_IMPLEMENTATION | TypeScript | Rule 4 contract surface (Potency) | IMPLEMENTATION_CURRENT | SHADOW_ONLY | unit tests rule4*; shadow adapters | N/A |
| SRC-0290 | 4 | `packages/clinical-contracts/src/rule4/safety/types.ts` | CONTRACT_IMPLEMENTATION | TypeScript | Rule 4 contract surface (Potency) | IMPLEMENTATION_CURRENT | SHADOW_ONLY | unit tests rule4*; shadow adapters | N/A |
| SRC-0291 | 4 | `packages/clinical-contracts/src/rule4/safetyFingerprintV1.ts` | CONTRACT_IMPLEMENTATION | TypeScript | Rule 4 contract surface (Potency) | IMPLEMENTATION_CURRENT | SHADOW_ONLY | unit tests rule4*; shadow adapters | N/A |
| SRC-0292 | 4 | `packages/clinical-contracts/src/rule4/selection/d3D5DiscriminatorFingerprintV1.ts` | CONTRACT_IMPLEMENTATION | TypeScript | Rule 4 contract surface (Potency) | IMPLEMENTATION_CURRENT | SHADOW_ONLY | unit tests rule4*; shadow adapters | N/A |
| SRC-0293 | 4 | `packages/clinical-contracts/src/rule4/selection/d3D5EvidenceProvenance.ts` | CONTRACT_IMPLEMENTATION | TypeScript | Rule 4 contract surface (Potency) | IMPLEMENTATION_CURRENT | SHADOW_ONLY | unit tests rule4*; shadow adapters | N/A |
| SRC-0294 | 4 | `packages/clinical-contracts/src/rule4/selection/evaluateSelectionAdapter.ts` | CONTRACT_IMPLEMENTATION | TypeScript | Rule 4 contract surface (Potency) | IMPLEMENTATION_CURRENT | SHADOW_ONLY | unit tests rule4*; shadow adapters | N/A |
| SRC-0295 | 4 | `packages/clinical-contracts/src/rule4/selection/index.ts` | CONTRACT_IMPLEMENTATION | TypeScript | Rule 4 contract surface (Potency) | IMPLEMENTATION_CURRENT | SHADOW_ONLY | unit tests rule4*; shadow adapters | N/A |
| SRC-0296 | 4 | `packages/clinical-contracts/src/rule4/selection/q7bfGateIds.ts` | CONTRACT_IMPLEMENTATION | TypeScript | Rule 4 contract surface (Potency) | IMPLEMENTATION_CURRENT | SHADOW_ONLY | unit tests rule4*; shadow adapters | N/A |
| SRC-0297 | 4 | `packages/clinical-contracts/src/rule4/selection/resolveSlotSelection.ts` | CONTRACT_IMPLEMENTATION | TypeScript | Rule 4 contract surface (Potency) | IMPLEMENTATION_CURRENT | SHADOW_ONLY | unit tests rule4*; shadow adapters | N/A |
| SRC-0298 | 4 | `packages/clinical-contracts/src/rule4/selection/selectionCodeValidation.ts` | CONTRACT_IMPLEMENTATION | TypeScript | Rule 4 contract surface (Potency) | IMPLEMENTATION_CURRENT | SHADOW_ONLY | unit tests rule4*; shadow adapters | N/A |
| SRC-0299 | 4 | `packages/clinical-contracts/src/rule4/selection/selectionFingerprintV1.ts` | CONTRACT_IMPLEMENTATION | TypeScript | Rule 4 contract surface (Potency) | IMPLEMENTATION_CURRENT | SHADOW_ONLY | unit tests rule4*; shadow adapters | N/A |
| SRC-0300 | 4 | `packages/clinical-contracts/src/rule4/selection/types.ts` | CONTRACT_IMPLEMENTATION | TypeScript | Rule 4 contract surface (Potency) | IMPLEMENTATION_CURRENT | SHADOW_ONLY | unit tests rule4*; shadow adapters | N/A |
| SRC-0301 | 4 | `packages/clinical-contracts/src/rule4/selection/validateD3D5Discriminator.ts` | CONTRACT_IMPLEMENTATION | TypeScript | Rule 4 contract surface (Potency) | IMPLEMENTATION_CURRENT | SHADOW_ONLY | unit tests rule4*; shadow adapters | N/A |
| SRC-0302 | 4 | `packages/clinical-contracts/src/rule4/severity/assertionBinding.ts` | CONTRACT_IMPLEMENTATION | TypeScript | Rule 4 contract surface (Potency) | IMPLEMENTATION_CURRENT | SHADOW_ONLY | unit tests rule4*; shadow adapters | N/A |
| SRC-0303 | 4 | `packages/clinical-contracts/src/rule4/severity/bindingGate.ts` | CONTRACT_IMPLEMENTATION | TypeScript | Rule 4 contract surface (Potency) | IMPLEMENTATION_CURRENT | SHADOW_ONLY | unit tests rule4*; shadow adapters | N/A |
| SRC-0304 | 4 | `packages/clinical-contracts/src/rule4/severity/crossRoleLeakageGuard.ts` | CONTRACT_IMPLEMENTATION | TypeScript | Rule 4 contract surface (Potency) | IMPLEMENTATION_CURRENT | SHADOW_ONLY | unit tests rule4*; shadow adapters | N/A |
| SRC-0305 | 4 | `packages/clinical-contracts/src/rule4/severity/evaluateSeverityAdapter.ts` | CONTRACT_IMPLEMENTATION | TypeScript | Rule 4 contract surface (Potency) | IMPLEMENTATION_CURRENT | SHADOW_ONLY | unit tests rule4*; shadow adapters | N/A |
| SRC-0306 | 4 | `packages/clinical-contracts/src/rule4/severity/index.ts` | CONTRACT_IMPLEMENTATION | TypeScript | Rule 4 contract surface (Potency) | IMPLEMENTATION_CURRENT | SHADOW_ONLY | unit tests rule4*; shadow adapters | N/A |
| SRC-0307 | 4 | `packages/clinical-contracts/src/rule4/severity/resolveSlotSeverity.ts` | CONTRACT_IMPLEMENTATION | TypeScript | Rule 4 contract surface (Potency) | IMPLEMENTATION_CURRENT | SHADOW_ONLY | unit tests rule4*; shadow adapters | N/A |
| SRC-0308 | 4 | `packages/clinical-contracts/src/rule4/severity/severityCodeValidation.ts` | CONTRACT_IMPLEMENTATION | TypeScript | Rule 4 contract surface (Potency) | IMPLEMENTATION_CURRENT | SHADOW_ONLY | unit tests rule4*; shadow adapters | N/A |
| SRC-0309 | 4 | `packages/clinical-contracts/src/rule4/severity/severityFingerprintV1.ts` | CONTRACT_IMPLEMENTATION | TypeScript | Rule 4 contract surface (Potency) | IMPLEMENTATION_CURRENT | SHADOW_ONLY | unit tests rule4*; shadow adapters | N/A |
| SRC-0310 | 4 | `packages/clinical-contracts/src/rule4/severity/severityScale.ts` | CONTRACT_IMPLEMENTATION | TypeScript | Rule 4 contract surface (Potency) | IMPLEMENTATION_CURRENT | SHADOW_ONLY | unit tests rule4*; shadow adapters | N/A |
| SRC-0311 | 4 | `packages/clinical-contracts/src/rule4/severity/types.ts` | CONTRACT_IMPLEMENTATION | TypeScript | Rule 4 contract surface (Potency) | IMPLEMENTATION_CURRENT | SHADOW_ONLY | unit tests rule4*; shadow adapters | N/A |
| SRC-0312 | 4 | `packages/clinical-contracts/src/rule4/severity/upstreamContextBoundary.ts` | CONTRACT_IMPLEMENTATION | TypeScript | Rule 4 contract surface (Potency) | IMPLEMENTATION_CURRENT | SHADOW_ONLY | unit tests rule4*; shadow adapters | N/A |
| SRC-0313 | 4 | `packages/clinical-contracts/src/rule4/version.ts` | CONTRACT_IMPLEMENTATION | TypeScript | Rule 4 contract surface (Potency) | IMPLEMENTATION_CURRENT | SHADOW_ONLY | unit tests rule4*; shadow adapters | N/A |
| SRC-0314 | ALL | `packages/clinical-contracts/tsconfig.json` | CONTRACT_IMPLEMENTATION | JSON | NOT_PROVEN | UNKNOWN_AUTHORITY | NOT_PROVEN | NOT_PROVEN | N/A |
| SRC-0315 | ALL | `packages/clinical-data-manifest/package.json` | DATA_PACKAGE | JSON | NOT_PROVEN | UNKNOWN_AUTHORITY | NOT_PROVEN | NOT_PROVEN | N/A |
| SRC-0316 | ALL | `packages/clinical-data-manifest/src/index.ts` | DATA_PACKAGE | TypeScript | NOT_PROVEN | UNKNOWN_AUTHORITY | NOT_PROVEN | NOT_PROVEN | N/A |
| SRC-0317 | ALL | `packages/clinical-data-manifest/tsconfig.json` | DATA_PACKAGE | JSON | NOT_PROVEN | UNKNOWN_AUTHORITY | NOT_PROVEN | NOT_PROVEN | N/A |
| SRC-0318 | ALL | `packages/engine-adapter/package.json` | API_ADAPTER | JSON | NOT_PROVEN | IMPLEMENTATION_CURRENT | SHADOW_ONLY | NOT_PROVEN | N/A |
| SRC-0319 | ALL | `packages/engine-adapter/src/index.ts` | API_ADAPTER | TypeScript | NOT_PROVEN | IMPLEMENTATION_CURRENT | SHADOW_ONLY | NOT_PROVEN | N/A |
| SRC-0320 | ALL | `packages/engine-adapter/tsconfig.json` | API_ADAPTER | JSON | NOT_PROVEN | IMPLEMENTATION_CURRENT | SHADOW_ONLY | NOT_PROVEN | N/A |
| SRC-0321 | ALL | `packages/medicine-registry/package.json` | DATA_PACKAGE | JSON | NOT_PROVEN | UNKNOWN_AUTHORITY | NOT_PROVEN | NOT_PROVEN | N/A |
| SRC-0322 | ALL | `packages/medicine-registry/src/index.ts` | DATA_PACKAGE | TypeScript | NOT_PROVEN | UNKNOWN_AUTHORITY | NOT_PROVEN | NOT_PROVEN | N/A |
| SRC-0323 | ALL | `packages/medicine-registry/src/medicines.v1.json` | DATA_PACKAGE | JSON | NOT_PROVEN | UNKNOWN_AUTHORITY | NOT_PROVEN | NOT_PROVEN | N/A |
| SRC-0324 | ALL | `packages/medicine-registry/src/registry.manifest.json` | DATA_PACKAGE | JSON | NOT_PROVEN | UNKNOWN_AUTHORITY | NOT_PROVEN | NOT_PROVEN | N/A |
| SRC-0325 | ALL | `packages/medicine-registry/tsconfig.json` | DATA_PACKAGE | JSON | NOT_PROVEN | UNKNOWN_AUTHORITY | NOT_PROVEN | NOT_PROVEN | N/A |
| SRC-0326 | 9 | `tests/unit/phase5c-nine-rule-orchestration.test.ts` | TEST | TypeScript | Nine-rule registry/orchestration | SYNTHETIC_VALIDATION_ONLY | SYNTHETIC_VALIDATION_ONLY | npm test / pytest | N/A |

## Inventory schema verification (micro-correction)

| Check | Result |
|-------|--------|
| Unique IDs SRC-0001 … SRC-0326 | **Pass** (326 IDs) |
| Missing ID in sequence | **None** |
| Duplicate ID | **None** |
| Duplicate path | **None** |
| Required columns on every row | **Pass** (10 columns) |
| Rule 4 contract paths in manifest | **104** rows under `packages/clinical-contracts/src/rule4/` (expected **104**) |
| Tracked baseline sources only | **Yes** (from Stage A discovery set on `658f3fd`) |
