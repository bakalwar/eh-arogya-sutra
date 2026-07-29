# Contributing — E.H. AROGYA SUTRA 2

This repository is an **engineering foundation only** until later phases.

## Rules

1. Follow phase gates in `docs/architecture/engineering-phases.md`.
2. Never import, symlink, or write into the legacy application tree.
3. Run `npm run verify:boundary` before every PR.
4. Clinical-engine changes require golden tests + owner approval (Phase 6+).
5. No patient data in fixtures — use `fixtures/synthetic/` only (label: SYNTHETIC_FIXTURE).
6. No secrets in source; use `EHAS2_*` environment variables.
7. Do not start Phase 1B (Jupiter UI) without owner approval.
8. Do not use `npm audit fix --force`.

## Local quality gates

```bash
npm run verify:boundary
npm run format:check
npm run lint
npm run typecheck
npm run test
npm run build
```

## Not in this phase

- Clinical engine integration
- Disease/medicine packages
- Authentication
- Patient database
- Payments
- Production deployment
