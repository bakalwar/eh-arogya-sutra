# Management Admin architecture

## Purpose

Platform **Management Admin** is the business operations plane for doctor lifecycle, subscriptions, payments (read/workflow), support, feedback, referrals, and privacy-safe analytics.

It is **not** Clinic Admin (tenant-scoped clinic settings) and **not** Super Admin Security and Operations (`/ops`).

## Scopes

| Scope | Responsibility |
|-------|----------------|
| Clinic Admin | Own clinic staff/memberships and clinic settings only |
| Management Admin | Platform doctor management, verification, billing, support, feedback, referrals, reports |
| Super Admin | System health, security incidents, deployments, backups, privileged technical controls |

## Rules

- Management Admin does **not** inherit Super Admin permissions by default.
- Super Admin does **not** receive default unrestricted patient PHI.
- Frontend Management navigation is UX only; API authorization remains mandatory.
- Dual Doctor + Management membership requires an **explicit audited workspace switch**.
- Production rejects test-principal injection.
- Client-supplied role claims cannot elevate access.

## Status (Phase 2A-M)

- Contracts, roles, permissions, moderation interfaces: **active as policies**
- Live Management login, persistence, payments, feedback transmission: **NOT_CONNECTED / NOT_IMPLEMENTED**
