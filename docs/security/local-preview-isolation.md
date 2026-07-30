# Local preview isolation (Phase 4C-V)

## Purpose

`/preview` is a **local development / automated-test gallery** for visual inspection of completed UI. It is not an authentication bypass and must never be available in production.

## Gate

`isLocalPreviewAllowed(env)` returns true only when `NODE_ENV` or `EHAS2_NODE_ENV` is `development` or `test`.

If `NODE_ENV=production` or `EHAS2_NODE_ENV=production` → **false**.

Query parameters (`?preview=1`, `?enablePreview=true`) **cannot** enable preview.

## Enforcement

1. `apps/web/src/middleware.ts` — production `/preview` → 404 `PREVIEW_NOT_AVAILABLE`
2. Preview layouts/pages call `notFound()` when gate fails
3. Unit tests assert gate + DoctorShell isolation

## Forbidden preview capabilities

| Capability | Allowed? |
|------------|----------|
| Create Principal | No |
| Create TenantContext | No |
| Issue session cookie | No |
| Write PostgreSQL | No |
| Request OTP | No |
| Call clinical engine | No |
| Upload reports | No |
| Call payment | No |
| Persist clinical demo records in localStorage | No |

## Navigation

DoctorShell / `DOCTOR_NAV_ITEMS` must not link to `/preview`, Management Admin, or Super Admin control plane.
Management and Super Admin previews are opened only from the local gallery (`/preview/management`, `/preview/super-admin`).
