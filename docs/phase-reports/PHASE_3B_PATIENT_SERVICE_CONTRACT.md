# PHASE 3B PATIENT SERVICE CONTRACT

Trusted `TenantContext` required (`allowPatientPhi=true`, active membership).

Operations:

- `create(displayName, optional demographics/masked contacts, idempotencyKey?)`
- `getById(patientId)` → NOT_FOUND if missing/cross-tenant
- `list({cursor, limit, status?, displayNamePrefix?})` tenant-scoped, ordered by id ASC
- `update` allowed fields only; rejects organizationId/clinicId/id/status/actor fields
- `archive` → status ARCHIVED (not hard delete); LEGAL_HOLD blocked

Ownership fields are server-assigned from TenantContext.
