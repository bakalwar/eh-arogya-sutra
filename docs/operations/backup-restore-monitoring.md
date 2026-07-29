# Backup and restore monitoring

**Status:** Policy foundation. Live backup monitoring Phase 14; drills Phase 13.

## Signals

- Last successful backup timestamp / age  
- Backup job failure  
- Restore-test status (`passed` / `failed` / `not_run`)  
- Storage capacity for backup targets  

## Contract

`BackupStatus` in `@ehas2/ops-contracts` — shells return `NOT_IMPLEMENTED` until implemented.

## Alerts

Aging backups and failed restore tests map to SEV-4 (warning) or higher if RPO is breached (policy TBD).

## Residual risk

Untested backups may fail when needed. Scheduled restore tests are mandatory before claiming DR readiness.
