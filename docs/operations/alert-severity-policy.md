# Alert severity policy

**Status:** Policy only. Production alerts **not** activated (Phase 14).

## Severities

| Severity | Meaning | Examples |
|----------|---------|----------|
| SEV-1 | Critical outage / security breach | Cross-tenant exposure; privileged compromise; clinical/DB unavailable; widespread Rx failure |
| SEV-2 | Major degradation | High error rate; major latency; broad analysis failure; threatening queue backlog |
| SEV-3 | Limited incident | One endpoint/worker; isolated tenant; repeated suspicious activity |
| SEV-4 | Warning / maintenance | Cert expiry approaching; backup aging; dependency vuln; storage trend |

## Required alert fields

severity; timestamp; service; environment; release/version; error code; request/trace ID; affected scope; safe redacted context; runbook link; acknowledgement status; owner; escalation timer.

Contract: `Alert` in `@ehas2/ops-contracts`.

## Delivery (provider-independent)

Dashboard; email; SMS/phone for SEV-1 where configured; approved messaging/incident tools; on-call escalation.

**Do not** hardcode recipient phones/emails in source.

Prevent alert storms, PHI in notifications, unauthenticated alert links, and silent delivery failure. Track created → delivered → acknowledged → escalated → resolved.
