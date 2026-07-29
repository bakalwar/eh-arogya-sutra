# E.H. AROGYA SUTRA 2

Separate clinical SaaS platform — **not** the legacy application tree.

## Status (Phase 1A-H)

**Engineering foundation only.** This is **not** production-ready.

Confirmed **absent / not active**:

- No clinical engine integrated
- No disease/medicine data package installed
- No authentication active (including Super Admin)
- No patient database
- No payment integration
- No production deployment
- No live monitoring / WAF / production alerts

## Requirements

- Node.js 20+ (tested: Node 24.16.0 / also CI Node 20)
- npm 10+ (tested: npm 11.17.0)

## Commands

```bash
npm ci
npm run verify:boundary
npm run format:check
npm run lint
npm run typecheck
npm run test
npm run build
npm audit
```

## API namespace (shell)

`/api/eh-as-2/v1/`

- `/health` — process liveness only
- `/ready` — **503 / ready:false** until services exist
- `/api/eh-as-2/v1/system/data-version` — **503 DATA_PACKAGE_NOT_INSTALLED**
- `/api/eh-as-2/v1/analysis` — **501 NOT_IMPLEMENTED**
- `/api/eh-as-2/v1/ops` — **501 NOT_IMPLEMENTED** (Super Admin control plane)

## Super Admin Security and Operations Center

Architecture and typed contracts exist (`docs/architecture/super-admin-control-plane.md`, `@ehas2/ops-contracts`).

**Not live:** no Super Admin login, no monitoring dashboard, no production alerts, no WAF. Doctor UI has no Super Admin navigation.

## License

Proprietary — E.H. Arogya Sutra 2.
