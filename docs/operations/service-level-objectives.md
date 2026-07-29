# Service level objectives (foundation)

**Status:** Design placeholders. Not production-enforced in Phase 1A-H.

## Intent

Use SLOs and error budgets to guide reliability work. Leading indicators may warn before failure; they do **not** guarantee prediction.

## Example draft SLOs (to be ratified later)

| Service | Indicator | Draft target |
|---------|-----------|--------------|
| API | Availability (non-maintenance) | TBD |
| API | p95 latency | TBD |
| Clinical analysis | Success rate (non-fallback) | TBD |
| Report OCR | Success within timeout | TBD |
| Backups | Max age of successful backup | TBD |

## Error budgets

Burn-rate alerts (Phase 14) should page on rapid budget consumption (SEV-2/1 as defined), not on every single error.
