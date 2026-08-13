# Rule-by-rule implementation status

**Production EHAS2 clinical engine:** NOT_CONNECTED · **Prescription engine:** NOT_CONNECTED

> **R5-M1a:** Documentation alignment only. Current v1 contract, synthetic orchestration, dashboard, and test surfaces retain pre-migration Rule 5 metadata until separately authorized **R5-M1b**. No runtime or clinical behavior changes in R5-M1a.

Legend: **OWNER-APPROVED** spec frozen · **IMPLEMENTATION-PENDING** · **LEGACY-PROVEN** (old app only) · Phase 5C isolated orchestrator = synthetic validation only (not production).

| # | Canonical name | EHAS2 status | Clinical effect (production) | Notes |
|---|----------------|--------------|------------------------------|-------|
| 1 | Temperament Engine | **NOT_IMPLEMENTED** (spec **OWNER-APPROVED** 5R-1F) | None until wired | [rules/rule-01-temperament-engine.md](./rules/rule-01-temperament-engine.md) |
| 2 | Polarity Engine | **NOT_IMPLEMENTED** (spec **OWNER-APPROVED** 5R-2F) | None until wired | [rules/rule-02-polarity-engine.md](./rules/rule-02-polarity-engine.md). Legacy LIVE_BUT_PARTIAL. Phase 5C synthetic ≠ this spec. |
| 3 | Organ-System Affinity Engine | **NOT_IMPLEMENTED** (spec **OWNER-APPROVED** 5R-3F) | None until wired | [rules/rule-03-organ-system-affinity.md](./rules/rule-03-organ-system-affinity.md). Legacy LIVE_AND_AUTHORITATIVE_BUT_CONFLICTED. Phase 5C synthetic ≠ this spec. Organ-System **Triad** rule number **AUDIT_PENDING**. |
| 4 | Potency | **DOCUMENTATION FROZEN** (5R-4D `4c35469`) · **Phase 1 foundation** (contracts / subset registry / fail-closed codes / empty evaluator / shadow → request-local injected validation collector only; no public response, persistence, or global retention) · **clinical evaluator NOT_IMPLEMENTED** · runtime **inactive** (`RULE4_ENGINE_MODE=off`) | **Not issued** | Prescription boundary · frozen spec: [rules/rule-04-potency-engine-DRAFT.md](./rules/rule-04-potency-engine-DRAFT.md) · SAC-003 clarification (pointer only): [rules/rule-04-SAC-003-freeze-clarification.md](./rules/rule-04-SAC-003-freeze-clarification.md) · Phase 1 report: [../phase-reports/PHASE_5R_4_RULE4_PHASE1_IMPLEMENTATION_REPORT.md](../phase-reports/PHASE_5R_4_RULE4_PHASE1_IMPLEMENTATION_REPORT.md) |
| 5 | Monitoring, Follow-up & Post-Release Safety Surveillance | **NOT_IMPLEMENTED** (decisions **OWNER-APPROVED** R5-M0) · production **NOT_CONNECTED** | **Not issued** | Post-release monitoring / safety governance only — **not** Dosage. Authority: [rules/rule-05-owner-decisions-R5-M0.md](./rules/rule-05-owner-decisions-R5-M0.md). Dosage remains **`DOSAGE_ENGINE_AUDIT_PENDING`**. R5-M1a = documentation only; v1 implementation metadata (contracts / synthetic orchestrator / dashboard / tests) pending **R5-M1b**. |
| 6 | Multi-Disease / Organ-System Triad | **IDENTITY/SCOPE OWNER_LOCKED** · canonical contract documented · shadow evaluator **IMPLEMENTED** (`@ehas2/rule6`) · orchestration **NOT_CONNECTED** · clinical activation **NONE** · real medicine relationships **0** (Phase 5C synthetic interface status remains historical only) | **None** (shadow package only; no production Rx effect) | Authority: [rules/rule-06-multi-disease-organ-system-triad-contract.md](./rules/rule-06-multi-disease-organ-system-triad-contract.md). Post-merge evidence: [rules/rule-06-multi-disease-organ-system-triad-implementation-evidence.md](./rules/rule-06-multi-disease-organ-system-triad-implementation-evidence.md) (PR #84). Mixture count = Rule 9 / §F. Electricity excluded. `RULE6_VALIDATED_RELATIONSHIP_DATA_PENDING`. Independent of Rule 5 C3E. Owner clinical authority: `ELECTROHOMEOPATHY_CLINICAL_RULES_REQUIRE_OWNER_APPROVAL_TECHNICAL_ENGINEERING_DELEGATED`. |
| 7 | External Use Routes | READY_FOR_VALIDATION | **Not issued** | Prescription boundary |
| 8 | Disease-level Prakruti Inference | **NOT_IMPLEMENTED** | None | Separate from Rule 1 |
| 9 | Master Pipeline | EXECUTED (5C validation wrapper) | None in production | AnalyzeComplete NOT_CONNECTED |

For every rule the future production orchestrator must record: name, number, evidence, confidence, warnings, unresolved reason, fingerprint, clinical effect, safety stop.

Rule 1, Rule 2, and Rule 3 contract fields are **IMPLEMENTATION-PENDING** in runtime until wired.
