# Clinical engine scaling (Phase 5C foundation)

## Measured locally (isolated)

- Disease package load (synthetic CI vs full local artifact)  
- Normalization + retrieval + per-rule + full non-Rx orchestration  
- Repeated-run stability (determinism harness)  
- Cancellation / timeout  

Do **not** claim support for 100,000 simultaneous doctors.

## Capacity assumptions (planning only — not SLAs)

| Dimension | Assumption |
|-----------|------------|
| Registered doctors | Product growth variable |
| Monthly active doctors | Subset of registered |
| Concurrent doctors | Engine worker pool bound |
| Requests per second | Horizontal workers + queue |
| Clinical-engine worker capacity | Stateless request handlers; package memory resident |

## Future boundaries

- Cache **immutable disease package indexes** (versioned), not patient clinical results across tenants  
- Horizontal scale behind queue; cancel/timeout per request  
- No shared cross-tenant clinical-result cache keyed by patient identity  
- Full artifact memory footprint must be sized per worker before production readiness  

Phase 5C establishes measurement hooks only; production capacity is **not** certified.
