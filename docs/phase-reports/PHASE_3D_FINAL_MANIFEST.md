# Phase 3D — Final manifest

## API routes (`/api/eh-as-2/v1`)

| Method | Path | Permission |
|--------|------|------------|
| GET/PATCH | `/me/profile` | DoctorProfileRead/Write |
| GET/POST | `/me/qualifications` | DoctorProfileRead/Write |
| PATCH/DELETE | `/me/qualifications/:id` | DoctorProfileWrite |
| GET/POST | `/me/registrations` | DoctorProfileRead/Write |
| PATCH/DELETE | `/me/registrations/:id` | DoctorProfileWrite |
| GET | `/me/prescriber-identity-preview` | DoctorProfileRead |
| GET | `/me/profile-completion` | DoctorProfileRead |
| GET/PATCH | `/clinics/current` | ClinicProfileRead / ClinicProfileWrite |
| GET/PUT | `/clinics/current/hours` | ClinicProfileRead / ClinicHoursWrite |
| GET | `/clinics/current/memberships` | MembershipListOwn |
| POST | `/me/profile/photo`, `/me/signature`, `/clinics/current/logo` | NOT_IMPLEMENTED |

## UI routes

`/profile`, `/profile/edit`, `/profile/qualifications`, `/profile/registrations`, `/profile/prescriber-preview`, `/clinic/settings`, `/clinic/hours`, `/clinic/team`

## Key source files

- `apps/api/src/createApp.ts`, `apps/api/src/routes/profiles.ts`
- `apps/api/src/middleware/tenantBridge.ts`, `rateLimit.ts`
- `packages/database/src/services/profileServices.ts`
- `apps/web/src/components/profile/*`, `apps/web/src/config/navigation.ts`
- `tests/integration/phase3d-profile-api.test.ts`, `tests/unit/phase3d-profile-ui.test.ts`

## Package status

`@ehas2/database` → `0.1.0-phase3d` / `PROFILE_API_READY`
