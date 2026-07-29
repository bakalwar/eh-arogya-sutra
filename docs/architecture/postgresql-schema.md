# PostgreSQL schema (Phase 3A)

Application persistence uses PostgreSQL with versioned SQL migrations under `packages/database/migrations`.

## Domains

1. **Identity / tenancy** — users, external_identity_mappings, organizations, clinics, memberships, roles, permissions, membership_roles  
2. **Patient / clinical** — patients through clinical_summary_snapshots (structured findings only)  
3. **Operations** — audit_events, support_tickets, doctor_feedback, data_versions, engine_versions, backup_metadata, migration_runs  

## Non-retention

Schema must not contain original PDF/image bytes, base64 report payloads, thumbnails, OCR source images, temporary object URLs, permanent report storage paths, or patient-identifying original filenames.

## Identifiers

See ADR 015. Internal UUIDs; public_id for URL-safe exposure; phone is never a primary key.
