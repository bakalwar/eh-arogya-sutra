# Nine-rule orchestration (Phase 5C)

Isolated, deterministic nine-rule clinical orchestration for **synthetic validation only**.

## Canonical names (EH_9 — do not invent)

1. Temperament (Prakriti)  
2. Polarity  
3. Organ / System Affinity  
4. Potency  
5. Dosage  
6. Multi-Disease / Organ-System Triad  
7. External Use Routes  
8. Disease-level Prakruti Inference  
9. Master Pipeline  

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
