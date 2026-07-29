# Engineering phases — E.H. AROGYA SUTRA 2

## Current status

| Phase | Name | Status |
|-------|------|--------|
| 1A | Engineering foundation | Complete (basic) |
| **1A-H** | **Dependency hardening + local checkpoint** | **In progress / this gate** |
| 1B | Jupiter UI shell | **Not started — requires owner approval** |

## Explicit non-claims

This repository is an **engineering foundation only**:

- No clinical engine is integrated
- No disease/medicine package is installed
- No authentication is active
- No patient database exists
- No payment is active
- No production deployment exists

Do **not** claim production readiness after Phase 1A-H.

## Phase 1A-H gates (required)

1. Forensic npm audit + risk register
2. Safe compatible dependency fixes only (no `--force`)
3. Boundary verification hardened
4. Secret / patient-data scan
5. Format, lint, typecheck, test, build
6. Clean lockfile install path verified
7. Local Git checkpoint (no remote/push)

## Next (only after owner approval)

**Phase 1B** — Jupiter design tokens completion, logo asset extraction, responsive AppShell.
