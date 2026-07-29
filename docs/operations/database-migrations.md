# Database migrations

- Ordered deterministic SQL files in `packages/database/migrations`  
- Checksums recorded in `migration_runs`  
- Duplicate application skipped when checksum matches; mismatch fails  
- Down scripts provided for safe reverse steps  
- No migration UI button in Phase 3A  
- Test from empty database before claiming PASS
