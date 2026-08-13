# Nine-rule interface status (Phase 5B)

Orchestration: **NOT_CONNECTED**

> **R5-M1a:** Documentation alignment only. Current v1 contract, synthetic orchestration, dashboard, and test surfaces retain pre-migration Rule 5 metadata until separately authorized **R5-M1b**. No runtime or clinical behavior changes in R5-M1a.

| # | Name | Phase 5B status |
|---|------|-----------------|
| 1 | Temperament (Prakriti) | READY_FOR_VALIDATION |
| 2 | Polarity | READY_FOR_VALIDATION |
| 3 | Organ / System Affinity | READY_FOR_VALIDATION |
| 4 | Potency | READY_FOR_VALIDATION |
| 5 | Monitoring, Follow-up & Post-Release Safety Surveillance | **NOT_IMPLEMENTED** |
| 6 | Multi-Disease / Organ-System Triad | READY_FOR_VALIDATION |
| 7 | External Use Routes | **IDENTITY/SCOPE OWNER_LOCKED** · contract documented · evaluator **NOT_IMPLEMENTED** (historical Phase 5B `READY_FOR_VALIDATION` label superseded for current EHAS2 Rule 7 posture) |
| 8 | Disease-level Prakruti Inference | **NOT_IMPLEMENTED** (historically unwired) |
| 9 | Master Pipeline | NOT_CONNECTED |

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
