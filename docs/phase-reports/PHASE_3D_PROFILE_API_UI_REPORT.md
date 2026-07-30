# Phase 3D — Profile API + UI report

## Summary

Phase 3D connects Phase 3C doctor/clinic persistence to versioned HTTP APIs and Jupiter doctor UI shells.

**Canonical repository:** `C:\Users\zero error\Desktop\EH_AROGYA_SUTRA_2`  
**Starting HEAD:** `47ade868245bf08cf300381314b1981a6368ed04`

## Delivered

- Versioned routes under `/api/eh-as-2/v1/` for profile, qualifications, registrations, clinic, hours, memberships, prescriber preview, profile completion
- Permission grants: `doctor.profile.*`, `clinic.profile.*`, `clinic.hours.write`, `membership.list_own`
- Fail-closed without Principal (`AUTH_NOT_CONNECTED`) and without TenantContext (`TENANT_CONTEXT_REQUIRED`)
- Mutation rate-limit foundation + `Cache-Control: no-store` on private profile responses
- Upload endpoints return `NOT_IMPLEMENTED`
- Doctor UI: `/profile*`, `/clinic/*` with truthful NOT_CONNECTED / SYNTHETIC_DEMO labels
- Navigation: My Profile + Clinic Settings (no Management/Super Admin)

## Explicit non-claims

- Real authentication is **not** active
- Protected APIs fail closed without Principal
- Profile/photo/signature uploads are **not** active
- No clinical engine, disease/medicine datasets, report OCR, or payments
- No production database deployment
- No real doctor/patient data
- Demo data is labelled `SYNTHETIC_DEMO` and is never written to PostgreSQL
- No insecure header/query identity bypass

## CSRF note (future session activation)

When Phase 4 cookie sessions activate, CSRF tokens (or SameSite=strict + custom header) must be required on mutating profile routes. Documented in `docs/architecture/session-architecture.md`; not implemented here.

## Test evidence

See `PHASE_3D_FINAL_MANIFEST.md` and `%TEMP%\ehas2_phase3d_audit\`.
