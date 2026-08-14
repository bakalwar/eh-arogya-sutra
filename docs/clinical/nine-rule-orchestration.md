# Nine-rule orchestration (Phase 5C)

Isolated, deterministic nine-rule clinical orchestration for **synthetic validation only**.

> **R5-M1a:** Documentation alignment only. Current v1 contract, synthetic orchestration, dashboard, and test surfaces retain pre-migration Rule 5 metadata until separately authorized **R5-M1b**. No runtime or clinical behavior changes in R5-M1a.

## Canonical names (EH_9 — do not invent)

1. Temperament (Prakriti)  
2. Polarity  
3. Organ / System Affinity  
4. Potency  
5. Monitoring, Follow-up & Post-Release Safety Surveillance
6. Multi-Disease / Organ-System Triad  
7. External Use Routes  
8. Disease-level Prakruti Inference  
9. Master Pipeline — EHAS2 owner-locked identity `MASTER_PIPELINE`; canonical contract: [rules/rule-09-master-pipeline-contract.md](./rules/rule-09-master-pipeline-contract.md); post-merge shadow evidence: [rules/rule-09-master-pipeline-implementation-evidence.md](./rules/rule-09-master-pipeline-implementation-evidence.md) (`RULE9_SHADOW_VALIDATOR_IMPLEMENTED`; orchestration **NOT_CONNECTED**; clinical activation **NONE**). Phase 5C synthetic Rule 9 wrapper remains validation-only and is **not** the owner-locked clinical implementation or production orchestration.

## Rule 5 — documentation identity (R5-M0)

| Field | Value |
|-------|--------|
| **Canonical name** | Monitoring, Follow-up & Post-Release Safety Surveillance |
| **Responsibility** | Post-release monitoring, follow-up, adverse-event processing, treatment-state tracking, and safety surveillance (governance — not selection or issuance) |
| **EHAS2 implementation** | **NOT_IMPLEMENTED** |
| **Production / orchestration** | **NOT_CONNECTED** (validation orchestrator only; no Rule 5 clinical evaluator) |
| **Clinical selection** | Rule 5 must **not** perform dosage, potency, medicine, or mixture selection or change them |
| **Dosage engine** | Separate **`DOSAGE_ENGINE_AUDIT_PENDING`** (unnumbered, non-authoritative pending its own audit) |
| **Authority** | [rules/rule-05-owner-decisions-R5-M0.md](./rules/rule-05-owner-decisions-R5-M0.md) |

**Implementation metadata (unchanged in R5-M1a):** v1 contracts and the Phase 5C synthetic orchestrator still expose pre–R5-M1b **Dosage** labels and prescription-boundary stubs for rule number 5. Correcting those surfaces requires separately authorized **R5-M1b** (not started in R5-M1a).

## Display vs live execution order

| Kind | Order |
|------|--------|
| Display / contract | 1 → 9 |
| Live legacy / EHAS2 validation execution | R3 → R1 → R2 → R6 → R4 → R5 → R7 → R8 → R9 |

## State machine

`NOT_CONNECTED` · `NOT_IMPLEMENTED` · `READY_FOR_VALIDATION` · `EXECUTING` · `EXECUTED` · `UNRESOLVED` · `BLOCKED_BY_SAFETY` · `BLOCKED_BY_POLICY_CONFLICT` · `FAILED`

Rules:

- No hidden fallback marks a failed rule successful  
- Missing upstream evidence → `UNRESOLVED`  
- Safety block stops dependent selection  
- Failure does not generate a prescription  
- Frozen rule results are immutable  
- Timeout / cancellation supported  
- Identical input + versions → identical fingerprint  

## Production vs validation

| Surface | Status |
|---------|--------|
| `POST /v1/analyze-complete` | `CLINICAL_ENGINE_NOT_CONNECTED` (501) |
| `POST /v1/validation/orchestrate` | Synthetic label required; non-prescription |
| Clinical readiness | `FALSE` |
| Prescription engine | `PRESCRIPTION_ENGINE_NOT_CONNECTED` |

## Implementation location

`apps/clinical-engine/src/ehas2_clinical_engine/orchestrator.py`
