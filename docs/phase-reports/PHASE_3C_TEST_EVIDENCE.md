# PHASE 3C TEST EVIDENCE

## Suites
- `tests/integration/phase3c-profile-persistence.test.ts`
- Existing Phase 3A / 3B integration suites updated for migration 008
- Unit boundary status → `PROFILE_PERSISTENCE`

## Covered behaviours
Doctor own profile upsert/get; protected fields; qualifications/registrations ordering; invalid registration dates; ClinicAdmin clinic update; Doctor denied clinic mutate; hours validation; clinical display setting rejection; RLS cross-tenant clinic/profile; Management/SuperAdmin denied; membership cross-tenant deny; transactional rollback; identity snapshot stability; migration 008 down/up.

## Fixtures
Synthetic names only (`Synthetic Doctor/Clinic/Patient…`). Isolated DB `ehas2_phase3c_test` on TEMP Postgres port 55432 (new DB; no restart of shared live services).
