# Nine-rule interface status (Phase 5B)

Orchestration: **NOT_CONNECTED**

> **R5-M1a:** Documentation alignment only. Current v1 contract, synthetic orchestration, dashboard, and test surfaces retain pre-migration Rule 5 metadata until separately authorized **R5-M1b**. No runtime or clinical behavior changes in R5-M1a.

| # | Name | Phase 5B status |
|---|------|-----------------|
| 1 | Temperament Engine (`TEMPERAMENT_ENGINE`) | **IDENTITY/SCOPE OWNER_LOCKED** · canonical contract documented · synthetic shadow evaluator **IMPLEMENTED** (`@ehas2/rule1`; `evaluateRule1Shadow`; technical `READY_FOR_VALIDATION`; `affectsClinicalSelection: false`) · mappings **0** · catalog **NOT_CREATED** · registry empty/fail-closed · medicine influence **NONE** · orch **NOT_CONNECTED** · activation **NONE** · Rx effect **NONE** (historical Phase 5B/dashboard display alias “Temperament (Prakriti)” does not override canonical identity or prove production readiness — see [rules/rule-01-temperament-engine-implementation-evidence.md](./rules/rule-01-temperament-engine-implementation-evidence.md)) |
| 2 | Polarity Engine (`POLARITY_ENGINE`) | **IDENTITY/SCOPE OWNER_LOCKED** · canonical contract documented · synthetic shadow evaluator **IMPLEMENTED** (`@ehas2/rule2`; `evaluateRule2Shadow`; technical `READY_FOR_VALIDATION`; `affectsClinicalSelection: false`) · mappings **0** · catalog **NOT_CREATED** · registry empty/fail-closed · formula mutation **NONE** · medicine influence **NONE** · Rule 4 **not** connected · orch **NOT_CONNECTED** · activation **NONE** · Rx effect **NONE** (historical Phase 5B/EH_9/dashboard short alias “Polarity” and pre-PR #101 stub `affectsClinicalSelection: true` do not override canonical identity or authorize selection — see [rules/rule-02-polarity-engine-implementation-evidence.md](./rules/rule-02-polarity-engine-implementation-evidence.md)) |
| 3 | Organ-System Affinity Engine (`ORGAN_SYSTEM_AFFINITY`) | **IDENTITY/SCOPE OWNER_LOCKED** · canonical contract documented · evaluator **NOT_IMPLEMENTED** / **NOT_AUTHORIZED** · package absent · mappings **0** · catalog **NOT_CREATED** · no closed real organ-system catalog · registry empty/fail-closed · medicine influence **NONE** · formula mutation **NONE** · Rule 4 **not** connected · orch **NOT_CONNECTED** · activation **NONE** · Rx effect **NONE** (historical Phase 5B/EH_9/dashboard short alias “Organ / System Affinity”, approved UI “Rule 3 — Active Organ Systems”, and stub `affectsClinicalSelection: true` do not override canonical identity or authorize selection — see [rules/rule-03-organ-system-affinity-contract.md](./rules/rule-03-organ-system-affinity-contract.md)) |
| 4 | Potency | READY_FOR_VALIDATION |
| 5 | Monitoring, Follow-up & Post-Release Safety Surveillance | **NOT_IMPLEMENTED** |
| 6 | Multi-Disease / Organ-System Triad | READY_FOR_VALIDATION |
| 7 | External Use Routes | **IDENTITY/SCOPE OWNER_LOCKED** · contract documented · shadow evaluator **IMPLEMENTED** (`@ehas2/rule7`; `affectsClinicalSelection: false`) · orchestration **NOT_CONNECTED** · clinical activation **NONE** (historical Phase 5B `READY_FOR_VALIDATION` / pre-PR #88 evaluator **NOT_IMPLEMENTED** wording superseded for current EHAS2 Rule 7 posture — see [rules/rule-07-external-use-routes-implementation-evidence.md](./rules/rule-07-external-use-routes-implementation-evidence.md)) |
| 8 | Disease-level Prakruti Inference | **IDENTITY/SCOPE OWNER_LOCKED** · contract documented · shadow evaluator **IMPLEMENTED** (`@ehas2/rule8`; `affectsClinicalSelection: false`; technical `READY_FOR_VALIDATION`) · orchestration **NOT_CONNECTED** · clinical activation **NONE** · medicine-selection influence **NONE** · real mappings **0** · clinical dashboard remains **`NOT_IMPLEMENTED`** (historical pre-PR #92 evaluator **NOT_IMPLEMENTED** / “**no** impl” wording superseded for package posture — see [rules/rule-08-disease-level-prakruti-inference-implementation-evidence.md](./rules/rule-08-disease-level-prakruti-inference-implementation-evidence.md)) |
| 9 | Master Pipeline | **IDENTITY/SCOPE OWNER_LOCKED** · contract documented · shadow validator/packager **IMPLEMENTED** (`@ehas2/rule9`; `evaluateRule9Shadow`; technical `READY_FOR_VALIDATION`) · orchestration **NOT_CONNECTED** · clinical activation **NONE** · medicine-selection influence **NONE** · prescription effect **NONE** · real clinical data/mappings **0** · validate/reject/package-only · `affectsClinicalSelection: false` (historical Phase 5B `NOT_CONNECTED` / Phase 5C synthetic wrapper / pre-PR #95 evaluator **NOT_IMPLEMENTED** wording superseded for current EHAS2 Rule 9 **package** posture — see [rules/rule-09-master-pipeline-implementation-evidence.md](./rules/rule-09-master-pipeline-implementation-evidence.md)) |

### Rule 5 notes (R5-M1a)

| Field | Value |
|-------|--------|
| **Specification authority** | [rules/rule-05-owner-decisions-R5-M0.md](./rules/rule-05-owner-decisions-R5-M0.md) |
| **Implementation** | **NOT_IMPLEMENTED** |
| **Runtime** | **NOT_CONNECTED** |
| **Clinical selection** | Prohibited — Rule 5 must not select or change medicine, mixture, potency, or dosage |
| **Dosage** | **`DOSAGE_ENGINE_AUDIT_PENDING`** (separate, unnumbered track) |
| **v1 metadata mismatch** | Phase 5B contract helpers may still list legacy **Dosage** / **READY_FOR_VALIDATION** for rule 5 until **R5-M1b** |

No rule may invent a fallback prescription while status is NOT_CONNECTED / NOT_IMPLEMENTED.
