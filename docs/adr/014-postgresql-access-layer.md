# ADR 014 — PostgreSQL access layer

## Status

Accepted (Phase 3A)

## Decision

Use **PostgreSQL** with:

1. **`pg` (node-postgres)** for parameterized queries and pooling  
2. **Versioned SQL migrations** run by a small EHAS2 migration runner (checksum-tracked)  
3. No hosted-provider-specific SDK (no Neon/Supabase/RDS-only clients)  
4. No Prisma/Drizzle in Phase 3A (reduces ORM lock-in while schema stabilizes)

## Why `pg`

- Maintained TypeScript-compatible driver  
- Direct SQL control for RLS, FKs, indexes  
- Low lock-in; SQL remains portable  
- Works with any PostgreSQL-compatible connection string  

## Security / maintenance

- Dependencies must pass `npm audit` with 0 vulnerabilities before commit  
- Connection settings via validated env vars only  
- Production must fail closed without secure DB settings  

## Consequences

Repositories use explicit tenant + transaction contexts. Route handlers never run raw SQL.
