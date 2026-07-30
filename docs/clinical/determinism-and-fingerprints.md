# Determinism and fingerprints (Phase 5C)

Every synthetic analysis result includes:

- `input_fingerprint`  
- `normalized_evidence_fingerprint`  
- `dataset_version`  
- `rule_set_version`  
- `engine_version` / `orchestrator_version`  
- `medicine_registry_version`  
- per-rule status / evidence / confidence / fingerprint  
- warnings / unresolved reasons  
- final non-prescription clinical interpretation  
- `output_fingerprint`  

## Exclusions from clinical fingerprints

- Timestamps  
- Random IDs / request IDs  

## Proof

Golden harness runs each case ≥3 times; identical `output_fingerprint` required.
