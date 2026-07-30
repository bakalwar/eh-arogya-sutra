# Engineering phases — E.H. AROGYA SUTRA 2

## Current status

| Phase | Name | Status |
|-------|------|--------|
| 1A | Engineering foundation | Complete (basic) |
| **1A-H** | Dependency hardening + Super Admin architecture/contracts | Complete |
| **1B** | Jupiter design system + responsive AppShell | Complete |
| **1C-A** | Splash, login, OTP, doctor dashboard UX | Complete (local) |
| **1C-B** | Patient / New Case / Report Upload UX | Complete (local) |
| **1C-C** | Prescription / Clinical Summary / History / Print UX | Complete (local) |
| **2A** | Identity contracts, roles, permissions, TenantContext, authz middleware | **Complete (local)** |
| **2A-M** | Management Admin roles/policies, feedback foundation, `/management` shells | **Complete (local)** |
| **2A-D** | Patient/consultation contracts, report non-retention, migration foundation | **Complete (local)** |
| **2B-A** | Authentication provider decision audit (PROPOSED ADR) | **Complete (local audit)** |
| 2B | Authentication implementation (after owner approval) | Not started — requires owner approval |
| **3A** | PostgreSQL persistence foundation | **Complete (local)** |
| **3B** | Patient and consultation persistence services | **Complete (local)** |
| **3C** | Doctor and clinic profile persistence | **Complete (local)** |
| **3C-II** | Fast-forward integration of 3C onto canonical main | **Complete (local)** |
| **3D** | Doctor/clinic profile API + UI connection | **Complete (local)** |
| **4A** | Secure authentication core + session foundation | **Complete (local)** — OTP provider **NOT_CONFIGURED**; passkeys **PASSKEY_NOT_CONNECTED**; production auth **not** active |
| **4B** | Real OTP-provider connection | **HOLD** — no provider account; do not start without owner approval |
| **4C-V** | Local browser preview + Playwright visual QA | **Complete (local)** — `/preview` local-only; synthetic data; no auth bypass |
| **5A** | Clinical engine + data migration forensic audit | **Complete (audit-only)** — docs + status preview; **no** clinical code/data copied |
| **5B** | Sanitized clinical data packages + isolated engine foundation | **Complete (non-live)** — disease extract tool, 39-medicine registry, contracts, Python scaffold; engine **NOT_CONNECTED** |


## Explicit non-claims

This repository is an **engineering foundation only**:

- No clinical engine is integrated / analyze remains NOT_CONNECTED
- Disease package may be generated locally but is **not** installed live
- Medicine registry package exists (39) but does not prescribe
- No real OTP provider is configured; production authentication is not active
- Passkeys are not connected
- Phase 4B is on HOLD
- Local `/preview` is not production and is blocked when `NODE_ENV=production`
- No production patient database is deployed
- No payment is active
- No production deployment exists
- No live monitoring, WAF, or production alerts
- Profile uploads are not active
- Phase 5A audited old clinical assets only — migration extraction is offline tooling only

Do **not** claim production readiness or “unhackable” security after Phase 5B.

## Next (only after owner approval)

**Do not start Phase 4B** until a real OTP provider account is approved.  
**Phase 5C** nine-rule orchestration reconstruction and golden validation — only after owner approval.  
Do not activate clinical analysis.
