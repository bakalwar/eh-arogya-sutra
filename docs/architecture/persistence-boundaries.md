# Persistence boundaries

- Route handlers never execute raw SQL  
- Repositories require trusted `TenantContext` + transaction context  
- No `findAllPatients()` or other unscoped PHI listing  
- Engine, OCR, OTP, and payments remain outside this package  
- Absence of `EHAS2_DATABASE_URL` → readiness reports `DATABASE_NOT_INSTALLED` (503), never fake success  
- Access layer: `pg` + checksum-tracked SQL migrations (ADR 014)
