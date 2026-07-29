# Tenant RLS

Defense in depth: application authorization, tenant-scoped repositories, FK ownership, and PostgreSQL RLS.

Session GUCs (transaction-local):

- `ehas2.tenant_id`
- `ehas2.clinic_id`
- `ehas2.actor_id`
- `ehas2.actor_role`

Policies deny by default. Management Admin and Super Admin have **no** default patient-PHI bypass. Client-supplied tenant IDs are never trusted alone.
