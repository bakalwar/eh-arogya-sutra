# PHASE 3C CLINIC PROFILE CONTRACT

Service: `ClinicProfileService`

## Operations
- `getCurrent` — clinic row + hours + display settings for tenant clinic
- `updateCurrent` — ClinicAdmin only; cannot change ids/org
- `replaceHours` — day windows / closed days
- `upsertDisplaySettings` — non-clinical display flags + header/footer only

## Rejected clinical settings
medicines, formulaCount, potency, polarity, electricity, tablets, externalApplications, diseaseMapping

## Access
- Read: Doctor or ClinicAdmin via profile access context
- Mutate: ClinicAdmin only (`assertClinicAdminRole`)
- RLS: `ehas2_tenant_ok(organization_id, clinic_id)` on hours/settings; clinics policy by org tenant
