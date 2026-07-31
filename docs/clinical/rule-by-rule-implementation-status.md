# Rule-by-rule implementation status

**Production EHAS2 clinical engine:** NOT_CONNECTED · **Prescription engine:** NOT_CONNECTED

Legend: **OWNER-APPROVED** spec frozen · **IMPLEMENTATION-PENDING** · **LEGACY-PROVEN** (old app only) · Phase 5C isolated orchestrator = synthetic validation only (not production).

| # | Canonical name | EHAS2 status | Clinical effect (production) | Notes |
|---|----------------|--------------|------------------------------|-------|
| 1 | Temperament Engine | **NOT_IMPLEMENTED** (spec **OWNER-APPROVED** 5R-1F) | None until wired | [rules/rule-01-temperament-engine.md](./rules/rule-01-temperament-engine.md) |
| 2 | Polarity Engine | **NOT_IMPLEMENTED** (spec **OWNER-APPROVED** 5R-2F) | None until wired | [rules/rule-02-polarity-engine.md](./rules/rule-02-polarity-engine.md). Legacy LIVE_BUT_PARTIAL. Phase 5C synthetic ≠ this spec. |
| 3 | Organ-System Affinity Engine | **NOT_IMPLEMENTED** (spec **OWNER-APPROVED** 5R-3F) | None until wired | [rules/rule-03-organ-system-affinity.md](./rules/rule-03-organ-system-affinity.md). Legacy LIVE_AND_AUTHORITATIVE_BUT_CONFLICTED. Phase 5C synthetic ≠ this spec. Organ-System **Triad** rule number **AUDIT_PENDING**. |
| 4 | Potency | READY_FOR_VALIDATION | **Not issued** | Prescription boundary · **AUDIT_PENDING** |
| 5 | Dosage | READY_FOR_VALIDATION | **Not issued** | Prescription boundary |
| 6 | Multi-Disease / Triad | EXECUTED / UNRESOLVED (5C) | Ranked candidates in 5C only | No production mixture / formula |
| 7 | External Use Routes | READY_FOR_VALIDATION | **Not issued** | Prescription boundary |
| 8 | Disease-level Prakruti Inference | **NOT_IMPLEMENTED** | None | Separate from Rule 1 |
| 9 | Master Pipeline | EXECUTED (5C validation wrapper) | None in production | AnalyzeComplete NOT_CONNECTED |

For every rule the future production orchestrator must record: name, number, evidence, confidence, warnings, unresolved reason, fingerprint, clinical effect, safety stop.

Rule 1, Rule 2, and Rule 3 contract fields are **IMPLEMENTATION-PENDING** in runtime until wired.
