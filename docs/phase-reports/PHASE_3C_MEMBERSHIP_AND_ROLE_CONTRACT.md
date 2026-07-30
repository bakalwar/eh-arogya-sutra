# PHASE 3C MEMBERSHIP AND ROLE CONTRACT

## Reused model
`memberships(user_id, organization_id, clinic_id, status)` + `membership_roles` + `roles`

## Seeded roles (008)
- `Doctor`
- `ClinicAdmin`

## Service behaviour
- `MembershipQueryService.listAuthorizedForActor` — returns actor memberships filtered to current tenant
- `denyCrossTenantCreate` — always denies self-service / cross-tenant membership creation
- Repository `assignRole` used by trusted bootstrap/admin paths only (tests via admin client)

## Multi-clinic
Unique `(user_id, organization_id, clinic_id)` allows multiple clinics; session still uses one active clinic context.
