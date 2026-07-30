# PHASE 3C DOCTOR PROFILE CONTRACT

Service: `DoctorProfileService`

## Operations
- `getOwn` — read profile + qualifications + registrations for `tenant.actorId`
- `upsertOwn` — create/update professional fields for own actor only
- `addQualification` / `deactivateQualification`
- `addRegistration` (verificationClaimed forced false) / deactivate via repository
- `captureIdentitySnapshot` — build immutable-ready identity payload

## Protected fields (rejected)
`userId`, `id`, `organizationId`, `clinicId`, `verificationClaimed`, `createdByActorId`

## Access
- Requires `assertProfileAccessContext` (ACTIVE membership; Doctor/ClinicAdmin)
- Management Admin / Super Admin denied by default
- RLS: `user_id::text = ehas2.actor_id`
