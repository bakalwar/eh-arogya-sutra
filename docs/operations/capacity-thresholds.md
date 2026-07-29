# Capacity thresholds

Free/low-cost pilot limits (documented; not 100,000-doctor ready):

| Limit | Default pilot value |
|-------|---------------------|
| Max invited doctors | 25 |
| Max concurrent users | 50 |
| Daily case limit | 200 |
| Report-processing concurrency | 2 |
| Database/storage | 5 GB |
| Request timeout | 30s |
| Backup capability | limited |
| Cold start / sleep | possible |
| Monitoring | basic only |

Thresholds that trigger migration planning are defined in `@ehas2/data-lifecycle-contracts` (`DEFAULT_CAPACITY_THRESHOLDS`).
