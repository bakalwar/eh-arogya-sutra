# PHASE 3C EXISTING PROFILE AUDIT

## Baseline
- Worktree: `EH_AROGYA_SUTRA_2_wt_phase3b`
- Parent: `0f20c1b876d2bfbe668f221c26079d018ce75ef1`
- Branch: `phase-3c/doctor-clinic-profile-persistence`

## Existing concepts (Phase 3A/3B)

| Concept | Status | Tables / fields | Gaps before 3C |
|---------|--------|-----------------|----------------|
| Auth identity | Present | `users`, `external_identity_mappings` | No OTP/secrets (correct) |
| Doctor professional profile | Missing | — | Added `doctor_professional_profiles` |
| Clinic/org profile | Partial | `organizations.name/status`; `clinics.name/status/timezone` | Address/contact/hours/display missing → extended |
| Membership | Present | `memberships`, `membership_roles`, `roles` | Roles not seeded; list/assign incomplete → completed |
| Tenant ownership | Present | org+clinic FKs + RLS | Reused |
| Qualifications | Missing | — | Added `doctor_qualifications` |
| Registrations | Missing | — | Added `doctor_registrations` |
| Clinic hours | Missing | — | Added `clinic_operating_hours` |
| Rx display settings | Missing | — | Added `clinic_prescription_display_settings` |
| Prescription identity snapshot | Partial | `readable_snapshot` / jsonb clinical payload | Added `prescriber_identity_snapshot` |
| Uploads / assets | Absent | — | Documented out of scope |

## Duplicate model decision
No duplicate doctor/clinic/org/membership tables. Extended `clinics` and reused `users` + `memberships`.
