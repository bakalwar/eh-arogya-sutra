# Phase 4C-V — Final manifest

## Starting point

- **HEAD:** `cd5833776162ef0e035718257a266f0c94b0ad19`
- **Branch:** `master`
- **Tree:** clean at start
- **Node:** v20.20.2

## Delivered

- Root `npm run dev` → `eh-arogya-sutra-2-web` (`next dev -p 4101`)
- `/preview` gallery + management/super-admin preview entries
- Preview gate + middleware production block
- Playwright `@playwright/test@1.62.0` + `npm run test:browser`
- Unit isolation tests (`phase4c-v-preview`, `phase4c-v-production-preview`)
- Responsive viewport suite (9 sizes)
- Docs: browser strategy, responsive QA, preview isolation, performance baseline
- Reviewed screenshots directory `docs/phase-reports/qa-screenshots-4c-v/`
- Root `tsconfig.json` stub + `tsconfig.solution.json` (Playwright path-with-space fix)

## Counts

| Suite | Count |
|-------|-------|
| Unit/integration (`npm run test`) | 188 |
| Browser (`npm run test:browser`) | 20 |
| Vulnerabilities | 0 |

## Forbidden (confirmed absent)

- Fake OTP / fixed login success / auth bypass
- Hardcoded doctor Principal / provider credentials / `.env`
- Real session issuance from preview
- Clinical engine / disease / medicine / OCR / payment activation
- Push / deploy / Phase 4B start

## Old project protection

- Path: `C:\Users\zero error\Desktop\EH_Arogya_Sutra_App`
- HEAD: `b9ec3f6986c402afee13241673b954fe3564f169`
- DB SHA-256: `C3FF59F862EAD2559E116CF6A4F629B7259BBD12D73385F299B780F25C4D1154`
- Preserved worktree: `EH_AROGYA_SUTRA_2_wt_phase3b` untouched

## Commit message

`feat(ehas2): add isolated browser preview and visual QA`
