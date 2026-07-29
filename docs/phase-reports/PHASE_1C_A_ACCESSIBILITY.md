# PHASE 1C-A — Accessibility

## Automated / foundation smoke

- Semantic forms with visible labels (`Mobile number`, OTP digits, problem-report fields)
- `autocomplete="tel"` / `one-time-code` where applicable
- Visible errors via `role="alert"`; splash status via `role="status"`
- Skip link on auth layouts
- Touch targets ≥44×44 via design tokens / CSS
- `prefers-reduced-motion` short-circuits splash delay and loader animation
- Hindi subtitle uses Noto Sans Devanagari stack
- Problem-report dialog: `aria-modal`, labelled title, focus to first field on open
- Playwright a11y smoke: login label + focus; dialog labels present at 390×844 and 1440×900

## Manual checks (documented; not full audit)

| Check | Result |
|-------|--------|
| Keyboard path splash→login→OTP→dashboard | PASS (UI preview) |
| Visible focus on primary controls | PASS (smoke) |
| Zoom 200% layout usable | PARTIAL — checked at responsive widths; full zoom pass deferred |
| Contrast on Space Blue splash | PASS (visual) |
| No focus trap when dialog closed | PASS |
| Full WCAG 2.2 AA claim | **Not claimed** |

**Accessibility verdict for Phase 1C-A:** PARTIAL (foundation + smoke only).
