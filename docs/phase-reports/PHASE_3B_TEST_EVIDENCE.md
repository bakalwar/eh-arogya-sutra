# PHASE 3B TEST EVIDENCE

- Existing Phase 3A integration/unit tests retained
- New: `tests/integration/phase3b-persistence-services.test.ts`
- Covers patient CRUD/archive, cross-tenant denial, idempotency, consultation transitions, findings, immutable revisions, full migration rollback 001–007, RLS null read
- Synthetic identifiers/names only
