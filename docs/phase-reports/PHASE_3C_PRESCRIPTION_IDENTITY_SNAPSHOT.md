# PHASE 3C PRESCRIPTION IDENTITY SNAPSHOT

## Problem
Finalized prescriptions must keep historical doctor/clinic identity if live profiles change later.

## Mechanism
- Column: `prescription_versions.prescriber_identity_snapshot jsonb NULL`
- Builder: `buildPrescriberIdentitySnapshot` / `DoctorProfileService.captureIdentitySnapshot`
- Schema: `ehas2.prescriber_identity.v1` (names, qualifications, registrations with `verificationClaimed: false`, clinic address/contact)
- Stored at prescription create time when provided; not updated by later profile edits
- Clinical engine / medicine generation unchanged

## Evidence
Phase 3C integration test renames prescription_name after create and asserts snapshot retains original name.
