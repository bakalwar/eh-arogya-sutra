# Audit log policy

**Status:** Policy foundation (Phase 1A-H). Persistence Phase 3.

## Privileged actions to audit

- Super Admin login/logout; MFA changes; role changes  
- Doctor suspension/reactivation  
- Tenant access; patient-data support access  
- Configuration / feature-flag / maintenance-mode changes  
- Secret rotation; deployment approval  
- Backup/restore; incident status changes; security-event closure  

## Integrity

- Actors must **not** silently erase their own audit trail  
- Prefer append-only / WORM-style storage in later phases  
- Access to audit logs is itself privileged and audited  

## Retention

Define environment-specific retention in Phase 3+. Legal/compliance review required before production.

## Contract

See `AuditEvent` in `@ehas2/ops-contracts` (`immutable: true`).
