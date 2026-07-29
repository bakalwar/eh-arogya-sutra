# Migration runbook

See `docs/architecture/free-to-paid-migration.md`.

## High-risk gates

- Super Admin only
- Strongest authentication assurance + re-authentication
- Explicit reason + owner confirmation
- Backup verified + rollback tested
- Audit trail + progress visibility
- Resumable/idempotent steps
- No patient data in logs

Working migration button: **not implemented** (Phase 2A-D contracts only).
