# Management Admin permissions

## Roles (least privilege)

- `ManagementAdmin` — broad management bundle (still no Super Admin / PHI)
- `DoctorVerificationAdmin` — doctor list/safe profile + verification/status
- `BillingAdmin` — subscriptions/payments/refunds request/earnings (not verification)
- `SupportAdmin` — tickets + feedback moderation (not raw security logs)
- `FinanceViewer` — read-only finance/report views (no payment mutation)
- `PlatformOperationsManager` — referrals/plans/coupons/reports/safe analytics
- `ManagementReadOnlyAuditor` — read-only management audit/reporting

## Domains

See `docs/phase-reports/PHASE_2A_M_PERMISSION_MATRIX.md` for the full matrix.

## Explicit denials (all management roles)

- server shell access
- secret access / WAF controls / database credentials
- raw security logs
- unrestricted patient data
- clinical prescription modification
- Super Admin control plane (unless separately membershipped via audited workspace)

## Enforcement

`@ehas2/security` role maps + `evaluateAuthorization`. API middleware returns `AUTH_NOT_CONNECTED` or `PERMISSION_DENIED`.
