# Monitoring and observability (foundation)

**Status:** Architecture only. Live vendor integrations are **Phase 14**. Telemetry wiring for clinical/report paths is **Phase 7**.

## Monitoring domains

A. Frontend — JS errors, failed loads, hydration, assets, performance, release correlation  
B. API — rates, status codes, latency percentiles, authn/authz failures, timeouts  
C. Clinical engine — start/complete/fail, versions, fallback rates (**no identifiable clinical content**)  
D. Database — pool, slow queries, locks, backups, migrations  
E. Background jobs — depth, age, retries, dead letters, worker health  
F. File storage — upload failures, malware-scan status, capacity, retention  
G. Security — stuffing, brute force, OTP anomalies, cross-tenant attempts, WAF events  
H. Infrastructure — CPU/memory/disk, restarts, cert/DNS, dependency health  

## Leading indicators (not guaranteed prediction)

Rising error/latency rates, queue backlog, pool saturation, disk thresholds, memory pressure, worker restarts, OCR timeouts, backup age, certificate windows, traffic anomalies, failed-login spikes, clinical fallback rate, new-release regression.

Use baselines, thresholds, trends, anomaly detection, SLOs, and error budgets — without claiming perfect foresight.

## Health vs readiness

- **Health** = process liveness only  
- **Readiness** = dependencies and data packages available  

Confusing the two is a design defect. See `@ehas2/ops-contracts`.

## Privacy

Default ops views use event/request/trace IDs, tenant IDs where needed, error codes, counts, and redacted metadata. Patient names, phones, reports, prescriptions, OCR text, and secrets must not appear by default.
