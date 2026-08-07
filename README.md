# E.H. AROGYA SUTRA 2

Separate clinical SaaS platform — **not** the legacy application tree.

## Status

**Engineering + UI foundation.** This is **not** production-ready.

Confirmed **absent / not active**:

- No clinical engine integrated
- No disease/medicine data package installed
- No real OTP provider configured — login truthfully returns **OTP_PROVIDER_NOT_CONFIGURED**; production authentication is **not** active
- Passkeys **PASSKEY_NOT_CONNECTED**
- Phase **4B** real OTP provider: **HOLD** (no provider account)
- Local `/preview` gallery is development-only (blocked in production)
- Phase **5A** clinical migration audit is documentation-only (engine still NOT_CONNECTED)
- Phase **5B** sanitized disease extract tooling + **38-medicine** registry package (CQ-001A v2; historical v1 preserved); analyze remains **NOT_CONNECTED**
- Phase **5C** isolated nine-rule **validation** orchestration exists; production AnalyzeComplete remains **NOT_CONNECTED**; Rule 8 **NOT_IMPLEMENTED**; no medicines issued
- No production patient database deployment
- No payment integration
- No production deployment
- No live monitoring / WAF / production alerts
- No profile photo / logo / signature uploads (NOT_IMPLEMENTED)

Phase **3A–4A** persistence/auth core, Phase **4C-V** local browser preview, Phase **5A** audit, Phase **5B** packages, and Phase **5C** synthetic nine-rule validation are present. See `docs/architecture/engineering-phases.md` and `docs/phase-reports/PHASE_5C_NINE_RULE_VALIDATION_REPORT.md`.

## Requirements

- **Node.js 20.x** (project baseline; validated on **v20.20.2**)
- **npm >= 10** (validated with npm 10.8.2 under Node 20.20.2)
- See `.nvmrc` / `.node-version` / `package.json` `engines`

Local machines may still have other Node versions installed; **do not** treat that as the project baseline. CI uses Node **20.20.2**.

## Commands

```bash
npm ci
npm run dev
npm run verify:boundary
npm run format:check
npm run lint
npm run typecheck
npm run test
npm run test:browser
npm run build
npm audit
```

Local web (after `npm run dev`): **http://127.0.0.1:4101/**  
Preview gallery (development only): **http://127.0.0.1:4101/preview**  
Clinical integration status (development only): **http://127.0.0.1:4101/preview/clinical-integration-status**  
Clinical validation (development only): **http://127.0.0.1:4101/preview/clinical-validation**

## API namespace (shell)

`/api/eh-as-2/v1/`

- `/health` — process liveness only
- `/ready` — **503 / ready:false** until services exist
- `/api/eh-as-2/v1/auth/*` — Phase 4A session core (OTP provider **NOT_CONFIGURED**; passkeys **PASSKEY_NOT_CONNECTED**)
- `/api/eh-as-2/v1/me/*` and `/clinics/current*` — Phase 3D profile APIs (fail closed without session)
- `/api/eh-as-2/v1/system/data-version` — **503 DATA_PACKAGE_NOT_INSTALLED**
- `/api/eh-as-2/v1/analysis` — **501 NOT_IMPLEMENTED**
- `/api/eh-as-2/v1/ops` — **501 NOT_IMPLEMENTED** (Super Admin control plane)

## Super Admin Security and Operations Center

Architecture and typed contracts exist (`docs/architecture/super-admin-control-plane.md`, `@ehas2/ops-contracts`).

**Not live:** no Super Admin login, no monitoring dashboard, no production alerts, no WAF. Doctor UI has no Super Admin navigation.

## License

Proprietary — E.H. Arogya Sutra 2.
