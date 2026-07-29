# Security Policy — E.H. AROGYA SUTRA 2

Report vulnerabilities to the project owner through approved channels only.

## Prohibited in repository

- Production credentials, API keys, OTP bypass
- Real patient files or consultation exports
- Symlinks into the legacy application tree
- Copied legacy `.env` or database files

## Phase 1A-H

- Threat model: `docs/security/threat-model.md`
- Dependency risk register: `docs/security/dependency-risk-register.md`
- Privileged access: `docs/security/privileged-access-model.md`
- Super Admin control plane: `docs/architecture/super-admin-control-plane.md`
- Foundation only: no clinical engine, no patient DB, no auth, no payments, no live Super Admin monitoring, no production deployment

Do not claim the platform is unhackable or that every attack will be detected.

## Dependency policy

- Compatible patch/minor upgrades and documented `overrides` after compatibility testing are allowed
- `npm audit fix --force` is forbidden
- Runtime-reachable critical vulnerabilities block Phase 1B
- Runtime-reachable high vulnerabilities require a safe fix or explicit owner approval
