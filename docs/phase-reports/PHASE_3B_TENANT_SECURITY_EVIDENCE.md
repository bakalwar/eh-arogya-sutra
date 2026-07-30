# PHASE 3B TENANT SECURITY EVIDENCE

- TenantContext from trusted app layer only
- `withTenantTransaction` sets GUCs + `SET LOCAL ROLE ehas2_app`
- Repository predicates include organization_id + clinic_id
- RLS FORCE on patient/clinical tables
- Management/Super Admin default PHI denied (`allowPatientPhi=false`)
- Cross-tenant get returns ResourceNotFoundError (non-disclosing)
- Unscoped `findAllPatients` remains forbidden
