# E.H. AROGYA SUTRA 2

Separate clinical SaaS platform — **not** the legacy application tree.

## Status

**Engineering + UI foundation.** This is **not** production-ready.

Confirmed **absent / not active**:

- No clinical engine integrated
- No disease/medicine data package installed
- No authentication active (including Super Admin) — profile APIs return **AUTH_NOT_CONNECTED**
- No production patient database deployment
- No payment integration
- No production deployment
- No live monitoring / WAF / production alerts
- No profile photo / logo / signature uploads (NOT_IMPLEMENTED)

Phase **3A–3D** local persistence + doctor/clinic profile API/UI shells are present. See `docs/architecture/engineering-phases.md` and `docs/phase-reports/PHASE_3D_PROFILE_API_UI_REPORT.md`.

## Requirements

- **Node.js 20.x** (project baseline; validated on **v20.20.2**)
- **npm >= 10** (validated with npm 10.8.2 under Node 20.20.2)
- See `.nvmrc` / `.node-version` / `package.json` `engines`

Local machines may still have other Node versions installed; **do not** treat that as the project baseline. CI uses Node **20.20.2**.

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
- `/api/eh-as-2/v1/me/*` and `/clinics/current*` — Phase 3D profile APIs (fail closed without auth)
- `/api/eh-as-2/v1/system/data-version` — **503 DATA_PACKAGE_NOT_INSTALLED**
- `/api/eh-as-2/v1/analysis` — **501 NOT_IMPLEMENTED**
- `/api/eh-as-2/v1/ops` — **501 NOT_IMPLEMENTED** (Super Admin control plane)

## Super Admin Security and Operations Center

Architecture and typed contracts exist (`docs/architecture/super-admin-control-plane.md`, `@ehas2/ops-contracts`).

**Not live:** no Super Admin login, no monitoring dashboard, no production alerts, no WAF. Doctor UI has no Super Admin navigation.

## License

Proprietary — E.H. Arogya Sutra 2.
