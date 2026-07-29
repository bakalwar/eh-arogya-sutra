# Engineering phases — E.H. AROGYA SUTRA 2

## Current status

| Phase | Name | Status |
|-------|------|--------|
| 1A | Engineering foundation | Complete (basic) |
| **1A-H** | **Dependency hardening + Super Admin architecture/contracts** | **This gate** |
| 1B | Jupiter UI shell | **Not started — requires owner approval** |

## Explicit non-claims

This repository is an **engineering foundation only**:

- No clinical engine is integrated
- No disease/medicine package is installed
- No authentication is active (including Super Admin)
- No patient database exists
- No payment is active
- No production deployment exists
- No live monitoring, WAF, or production alerts

Do **not** claim production readiness or “unhackable” security after Phase 1A-H.

## Super Admin / security roadmap

| Phase | Security / ops capability |
|-------|---------------------------|
| **1A-H** | Architecture, ADRs, typed contracts, NOT_IMPLEMENTED shells, foundation tests |
| **2** | Identity, MFA/passkeys, role foundations |
| **3** | Audit event persistence and secure data model |
| **7** | Clinical/report operational telemetry |
| **9** | Super Admin operational UI foundations |
| **10** | Security hardening, WAF/rate-limit/provider integrations |
| **12** | Load / anomaly / capacity testing |
| **13** | Incident and disaster-recovery drills |
| **14** | Production monitoring and alert activation |

No security capability may be marked **live** before its implementation phase passes.

## Phase 1A-H gates

1. Dependency hardening + risk register  
2. Boundary / secret / patient-data scans  
3. Super Admin control-plane docs + contracts  
4. Format, lint, typecheck, test, build  
5. Local Git checkpoint (no remote/push)

## Next (only after owner approval)

**Phase 1B** — Jupiter design tokens, logo extraction, responsive AppShell (doctor UI — **no** Super Admin nav).
