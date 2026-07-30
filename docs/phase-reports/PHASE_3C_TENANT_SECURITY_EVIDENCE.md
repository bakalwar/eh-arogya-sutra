# PHASE 3C TENANT SECURITY EVIDENCE

- Application scoping via trusted `TenantContext` + `withTenantTransaction` GUCs
- FORCE RLS on new profile tables; app role `ehas2_app`
- Doctor profiles owner-scoped by actor GUC
- Clinic hours/settings tenant-scoped
- Cross-tenant clinic SELECT returns 0 rows under peer tenant GUC
- Cross-tenant membership create denied
- ManagementAdmin / SuperAdmin profile access denied by default (`allowPatientPhi` false still blocks patient APIs)
- No public profile API routes added
