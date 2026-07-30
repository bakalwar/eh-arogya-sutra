# Clinic profile and membership

## Clinic profile

ClinicAdmin may update permitted clinic fields and replace weekly operating hours. Ordinary Doctor may read current clinic profile/hours/memberships but cannot mutate clinic ownership or settings.

## Membership display

`MembershipQueryService.listAuthorizedForActor` returns memberships for the current actor filtered to the active organization/clinic. Self-service membership creation and cross-tenant creates are denied.

## Tenancy

All clinic mutations run inside `withTenantTransaction` with PostgreSQL RLS as defence in depth.
