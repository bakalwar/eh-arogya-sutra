# Browser testing strategy (Phase 4C-V)

## Tools

- **Unit / integration:** Vitest (existing)
- **Browser E2E:** Playwright Test **1.62.0** (Chromium)
- **Command:** `npm run test:browser`
- **Config:** `playwright.config.ts`
- **Artifacts:** `%TEMP%\ehas2_phase4c_v_audit\` (not committed)

## Scope

Local Next.js web on `http://127.0.0.1:4101` only.

Must **not** connect to:

- old project / old database
- production database
- OTP provider
- clinical engine
- payment provider
- external analytics

## Isolation rules under test

- `/preview` available only when `NODE_ENV` / `EHAS2_NODE_ENV` is development or test
- Production returns `PREVIEW_NOT_AVAILABLE` / 404
- Query parameters cannot enable preview
- Preview creates no Principal, TenantContext, or session cookie
- No PostgreSQL writes from preview flows
- Doctor navigation excludes Management Admin and Super Admin

## Lifecycle / dependency notes

`@playwright/test@1.62.0` requires Node ≥20 (project baseline v20.20.2).
Browser binaries are installed locally via `npx playwright install chromium` and are **not** committed.
`npm audit fix --force` was not used.
