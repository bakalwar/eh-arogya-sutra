# Rule-by-rule implementation status (Phase 5C)

| # | Canonical name | Status | Clinical effect in 5C | Notes |
|---|----------------|--------|----------------------|-------|
| 1 | Temperament (Prakriti) | EXECUTED / UNRESOLVED | Interpretation only | UNKNOWN valid |
| 2 | Polarity | EXECUTED / UNRESOLVED | Interpretation only | MIXED / UNKNOWN valid |
| 3 | Organ / System Affinity | EXECUTED / UNRESOLVED | Ranked systems; no silent 5-cap | Beyond-five retained |
| 4 | Potency | READY_FOR_VALIDATION | **Not issued** | Prescription boundary |
| 5 | Dosage | READY_FOR_VALIDATION | **Not issued** | Prescription boundary |
| 6 | Multi-Disease / Triad | EXECUTED / UNRESOLVED / BLOCKED_BY_SAFETY | Ranked candidates only | No mixture / formula |
| 7 | External Use Routes | READY_FOR_VALIDATION | **Not issued** | Prescription boundary |
| 8 | Disease-level Prakruti Inference | **NOT_IMPLEMENTED** | None | Historically unwired; no dummy |
| 9 | Master Pipeline | EXECUTED (validation) | Orchestration wrapper | Production AnalyzeComplete still NOT_CONNECTED |

For every rule the orchestrator records: name, number, evidence, confidence, warnings, unresolved reason, fingerprint, clinical effect, safety stop.
