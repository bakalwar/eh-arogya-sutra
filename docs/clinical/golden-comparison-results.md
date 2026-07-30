# Golden comparison results (Phase 5C)

Legacy comparison mode: **NOT_COMPARABLE** for all synthetic golden cases.

## Reason

Isolated Phase 5C does not execute protected legacy servers or mutate the old project. Weakening safety to force live legacy calls is forbidden. Read-only forensic evidence from Phase 5A remains documentary only.

## Classification used

| Class | Applied |
|-------|---------|
| EXACT_MATCH | 0 |
| CLINICALLY_EQUIVALENT | 0 |
| INTENTIONAL_SAFETY_DIFFERENCE | Documented in Rule 4–7 / safety (no Rx) |
| OWNER_RULE_CORRECTION | Rule 8 truthful NOT_IMPLEMENTED |
| LEGACY_DEFECT_NOT_COPIED | Silent fallbacks / forced top-1 avoided |
| DIVERGENT_REQUIRES_REVIEW | 0 |
| NOT_COMPARABLE | 26 |

Harness result: **26 / 26 passed** against EHAS2 synthetic expectations; determinism **PASS**.
