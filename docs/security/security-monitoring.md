# Security monitoring

**Status:** Design only. Not activated in production (Phase 14).

## Goals

Prevent → detect → contain → investigate → recover → learn.

Do not claim complete detection of every attack.

## Event categories

authentication; authorization; tenant access; admin actions; API security; upload security; clinical-engine integrity; configuration changes; deployment; backup; incident response.

## Required identifiers

Every security event: event ID, type, timestamp, environment, actor ID/role, tenant ID where applicable, IP classification, device/session ID, action, target, result, risk score, request ID, trace ID, release version. Sensitive values redacted.

## Attack protection layers (defense in depth)

CDN/DDoS; WAF; rate limiting; bot protection; API gateway; secure headers; input validation; output encoding; MFA; least-privilege authZ; tenant isolation; private storage; encryption; secret manager; network segmentation; dependency/image scanning; runtime detection; immutable audit logs; backups; incident response.

No single product is sufficient. **WAF and providers are not configured in Phase 1A-H.**

## Residual risks (honest)

1. Novel attacks may evade signatures and baselines  
2. Misconfiguration can weaken controls  
3. Insider misuse requires process + audit, not only tooling  
4. Detection lag can leave a window of exposure  
5. Third-party dependencies introduce supply-chain risk  
