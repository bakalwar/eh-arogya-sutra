# Patient and consultation data

## Rule

Do not store a consultation only as one long plain-text blob.

Use:

1. **Structured typed clinical records** for search, filtering, history, follow-up, reporting, validation, versioning, and migration.
2. **Immutable human-readable snapshots** for exact historical summary/prescription, print/review, and clinical audit.

The structured record is the machine-readable source of truth. Snapshots preserve exactly what the doctor reviewed. Do not reconstruct old prescriptions with future engine rules.

## Ownership

Every protected clinical record includes trusted ownership:

- organization/tenant ID, clinic ID, patient ID, consultation ID
- responsible doctor ID, created-by / updated-by principals, timestamps

Client-provided tenant/doctor IDs are not trusted alone.

## Status (Phase 2A-D)

Contracts only. Persistence belongs to Phase 3. Clinical engine belongs to Phase 6+.
