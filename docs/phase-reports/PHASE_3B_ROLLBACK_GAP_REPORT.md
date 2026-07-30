# PHASE 3B ROLLBACK GAP REPORT

## Phase 3A gap

Only migration 006 RLS down/up was verified.

## Phase 3B resolution

Against isolated TEMP database `ehas2_phase3b_test`:

1. migrate up 001–007
2. migrateDownLast × 7 in reverse order
3. confirm public base tables = 0
4. migrate up again
5. continue service tests

`migrateDownLast` records down markers when `migration_runs` still exists; for `001` the down script drops `migration_runs`, so the down insert is skipped safely after deleting the up marker.

No accepted Phase 3A migration SQL bodies were rewritten for convenience.
