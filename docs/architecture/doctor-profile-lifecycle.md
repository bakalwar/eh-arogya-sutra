# Doctor profile lifecycle

Doctor professional profiles are owned by the authenticated actor (`user_id = actorId`).

## Lifecycle

1. **Draft / Active / Inactive** profile status on `doctor_professional_profiles`
2. Qualifications and registrations are soft-deactivated (`INACTIVE`), not hard-deleted
3. Prescriber identity preview builds an `ehas2.prescriber_identity.v1` snapshot from ACTIVE rows only
4. Issued prescription snapshots (when prescriptions exist) remain immutable — later renames do not rewrite history

## Phase 3D HTTP

- Self-service only via `/me/*` with `DoctorProfileRead` / `DoctorProfileWrite`
- Fail closed when authentication is not connected
- No invented default registration
- No verificationClaimed=true self-assertion

## Out of scope

OTP login, uploads, clinical engine, payments.
