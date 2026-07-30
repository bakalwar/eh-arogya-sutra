# Phase 4C-V — Local browser preview and end-to-end UI QA

## Summary

Phase 4C-V adds a local-only `/preview` gallery, root `npm run dev` forwarding to `eh-arogya-sutra-2-web`, Playwright browser tests, responsive viewport checks, and documentation. Phase 4B real OTP-provider integration remains **HOLD**.

## Explicit non-claims

- Phase 4B is **HOLD** — no OTP provider account
- Real OTP provider is **NOT_CONFIGURED**
- Authentication is **not** live
- Preview is **local development / test only**
- Preview data is **synthetic and not saved**
- Clinical engine is **not connected**
- Disease / medicine packages are **not installed**
- OCR / report processing is **inactive**
- Payment is **inactive**
- No production deployment

## Local URL

```bash
cd "C:\Users\zero error\Desktop\EH_AROGYA_SUTRA_2"
npm run dev
```

Open: **http://127.0.0.1:4101/preview**

## Isolation

| Control | Result |
|---------|--------|
| Production `/preview` | 404 `PREVIEW_NOT_AVAILABLE` (middleware + layout `notFound`) |
| Query enable (`?enablePreview=1`) | Cannot enable (still 404 in production) |
| Principal / TenantContext / session | Not created by preview |
| PostgreSQL writes | 0 by design |
| OTP / engine / upload / payment | 0 by design |

## Validation commands (Node v20.20.2)

| Command | Exit |
|---------|------|
| `npm run verify:boundary` | 0 |
| `npm run format:check` | 0 |
| `npm run lint` | 0 |
| `npm run typecheck` | 0 |
| `npm run test` | 0 (188 tests) |
| `npm run build` | 0 |
| `npm audit` | 0 (0 vulnerabilities) |
| `npm run test:browser` | 0 (20 tests) |
| Clean TEMP `npm ci` | 0 |
| Clean TEMP format/lint/typecheck/test/build/audit | 0 |
| Dev smoke `GET /preview` | 200 + watermark |
| Prod smoke `GET /preview` (port 4102) | 404 `PREVIEW_NOT_AVAILABLE` |
| Heuristic secret scan | PASS |
| Heuristic patient-data scan | PASS |

## Accessibility

Reported as **PARTIAL** — skip links, landmarks, labels, and focus styles exist; full WCAG audit is not claimed.

## Screenshots

Reviewed copies under `docs/phase-reports/qa-screenshots-4c-v/`.

- `mobile-390.png`
- `tablet-768.png`
- `laptop-1440.png`
- `desktop-1920.png`
- `print-preview.png`

Raw artifacts under `%TEMP%\ehas2_phase4c_v_audit\`.

## Performance baseline

See `docs/architecture/frontend-performance-baseline.md`. Bundle sizes recorded from production build; no claim of 100,000 concurrent doctors; no PHI-caching service worker.
