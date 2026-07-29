# Super Admin Security and Operations Center — Control Plane

**Status:** Architecture only (Phase 1A-H). **Not live.**

## Purpose

A private, separately authenticated **Super Admin Security and Operations Center** helps authorized system owners **prevent, detect, contain, investigate, recover, and learn** from failures and security incidents.

It must **not** be visible or accessible to ordinary doctors. **Route hiding alone is not security.**

## Honest security principle

Do **not** claim: unhackable, 100% secure, every attack always detected, or every future failure predicted.

Residual risk always remains. Continuous improvement is required.

## Separate control plane (preferred production design)

| Control | Requirement |
|---------|-------------|
| Hostname | Separate admin host (conceptual: `ops.<approved-domain>` — **domain not finalized** in Phase 1A-H) |
| Auth policy | Separate Super Admin identity; phishing-resistant MFA/passkeys preferred |
| Session | Separate cookie/session scope; no shared doctor session |
| Authorization | Backend deny-by-default on every request |
| Audit | Separate immutable audit trail |
| Network | Optional VPN / identity-aware proxy; IP/device restrictions where appropriate |
| Discovery | No doctor-app navigation link; no discoverable doctor menu entry |

## Planned dashboard modules (Phase 9+ UI)

Global System Status; Active Incidents; Security Events; Doctor-Reported Problems; Frontend Errors; API Health; Clinical Engine Health; OCR/Report Processing; Database Health; Background Jobs; Storage Health; Performance; Deployments; Backups; Certificate/Domain Expiry; Dependency Vulnerabilities; Audit Logs; Feature Flags; Tenant/Clinic Health; Runbooks; Maintenance Mode; Status History.

## Phase placement

| Capability | Phase |
|------------|-------|
| Architecture / contracts | **1A-H (this document)** |
| Identity, MFA, roles | 2 |
| Audit persistence | 3 |
| Clinical/report telemetry | 7 |
| Super Admin UI foundations | 9 |
| WAF / rate-limit / providers | 10 |
| Load / anomaly / capacity | 12 |
| Incident / DR drills | 13 |
| Production monitoring & alerts | 14 |

No security capability may be marked **live** before its implementation phase passes.

## Explicit non-claims (Phase 1A-H)

- No real Super Admin login
- No live monitoring dashboard
- No production alerts
- No WAF or automatic blocking
- No patient-data surveillance UI
