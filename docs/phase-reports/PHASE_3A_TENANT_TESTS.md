# PHASE 3A TENANT TESTS

Covered in `tests/integration/phase3a-persistence.test.ts` and repository asserts:

- Missing TenantContext denied  
- Doctor A cannot read Clinic B patient  
- Clinic Admin cannot read another clinic  
- Management Admin default PHI denied  
- Super Admin default PHI denied  
- Unscoped `findAllPatients` absent  
- Cross-tenant consultation relation rejected  
- Background job without tenant denied  
- Inactive membership denied  
