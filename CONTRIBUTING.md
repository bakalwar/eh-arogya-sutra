# Contributing — E.H. AROGYA SUTRA 2

This repository is an **engineering / UI foundation** until later phases.

## Runtime

- Use **Node.js 20.x** (see `.nvmrc` / `.node-version`; validated **20.20.2**)
- npm **>= 10**
- Lifecycle install scripts are deny-by-default; see `docs/security/npm-lifecycle-script-policy.md`

## Rules

1. Follow phase gates in `docs/architecture/engineering-phases.md`.
2. Never import, symlink, or write into the legacy application tree.
3. Run `npm run verify:boundary` before every PR.
4. Clinical-engine changes require golden tests + owner approval (Phase 6+).
5. No patient data in fixtures — use `fixtures/synthetic/` only (label: SYNTHETIC_FIXTURE).
6. No secrets in source; use `EHAS2_*` environment variables.
7. Do not use `npm audit fix --force`.
8. Do not use wildcard `allowScripts` approvals.

## Local quality gates

```bash
npm run verify:boundary
npm run format:check
npm run lint
npm run typecheck
npm run test
npm run build
```

## Not claimed live

- Clinical engine / disease / medicine packages
- Authentication / payments
- Live Super Admin monitoring / WAF / production alerts
- Production deployment
