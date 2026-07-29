# ADR 016 — Tenant RLS strategy

## Status

Accepted (Phase 3A)

## Decision

Defense in depth:

1. Application authorization (`@ehas2/security`)  
2. Tenant-scoped repositories (mandatory `TenantContext`)  
3. Foreign-key ownership  
4. PostgreSQL Row-Level Security on patient/clinical tables  

Session GUCs set per transaction:

- `ehas2.tenant_id`
- `ehas2.clinic_id`
- `ehas2.actor_id`
- `ehas2.actor_role`

Policies deny by default. Missing tenant GUC yields no rows / write denial. Management Admin and Super Admin do **not** receive default PHI bypass policies.
