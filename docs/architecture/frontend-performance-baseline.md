# Frontend performance baseline (Phase 4C-V)

## Status

Foundation baseline only. **Does not** prove capacity for 100,000 simultaneous doctors.
Do **not** render 100,000 doctor/patient records in the browser.
Do **not** activate a service worker that caches PHI or protected API responses.

## Observed (local `next build`, Phase 4C-V)

From production web build output (approximate First Load JS shared ~103 kB):

- Shared JS chunks dominate initial load
- Many doctor/clinical routes are static or lightly dynamic
- Logo uses optimized public asset with explicit dimensions (reduces layout shift)

Exact sizes vary by commit; re-record after significant UI changes via `npm run build -w eh-arogya-sutra-2-web`.

## Strategies in place

| Area | Approach |
|------|----------|
| Large lists | Synthetic patient list is small + filter/pagination-ready UI; no mass fetch |
| Images | `next/image` / optimized brand PNG |
| Navigation | Client shells with route-level code splitting via App Router |
| Offline / API failure | Truthful NOT_CONNECTED / unreachable messaging on auth/profile |
| Error boundaries | Route-level error/empty states; no stack traces to doctors |
| Memory smoke | Browser suite opens key routes without retaining traces/videos |

## Follow-ups (non-blocking)

- Measure LCP/CLS in a dedicated performance lab after clinical engine exists
- Add route-level bundle budgets in CI when auth+engine are live
