# Profile access and privacy

## Fail-closed defaults

| Condition | API code |
|-----------|----------|
| No Principal | `AUTH_NOT_CONNECTED` (401) |
| No TenantContext | `TENANT_CONTEXT_REQUIRED` (403) |
| Inactive membership | `ACCESS_DENIED` (403) |
| Missing permission | `PERMISSION_DENIED` (403) |
| Cross-tenant / missing row | `NOT_FOUND` (404) — no existence leak |

## Role denials

- Management Admin: no `doctor.profile.write` / `clinic.profile.write` by default; DB `assertProfileAccessContext` also denies
- Super Admin: same — no default profile-edit privilege
- Guessed UUIDs return NOT_FOUND

## Privacy controls

- Private responses use `Cache-Control: no-store`
- Audit events store metadata keys only (status, counts) — not full bios
- Logs must not include phone/email/registration numbers
- No localStorage persistence of professional/clinic sensitive fields in UI
- HTML/script markup rejected in free-text validators

## Uploads

Photo/logo/signature endpoints return `NOT_IMPLEMENTED` in Phase 3D.
