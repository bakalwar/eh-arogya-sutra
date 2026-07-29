# Management Admin vs Super Admin

## Separation

| Concern | Management Admin | Super Admin Security & Operations |
|---------|------------------|-----------------------------------|
| Primary users | Business / support / finance operators | Security & platform engineers |
| Entry | `/management` (shell) | `/ops` (control plane) |
| Doctors / subscriptions | Yes (safe profiles) | No by default |
| Payments / earnings views | Yes (provider-evidence rules) | No by default |
| Support & feedback | Yes | Escalation intake only |
| Raw security logs / WAF / secrets | **No** | Yes (later phases) |
| Server shell / DB credentials | **No** | Privileged technical controls only |
| Default patient PHI | **No** | **No** (break-glass only) |

## Inheritance

- Holding `ManagementAdmin` does **not** grant `SuperAdminControlPlane`.
- Holding `SuperAdmin` does **not** automatically enter Management through a doctor session.
- Workspaces must not silently mix Doctor, Management, and Super Admin navigation.

## Phase 2A-M

Both planes remain non-live for authentication. Policies deny by default until trusted principals exist.
