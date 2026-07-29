# PHASE 1C-A — Route matrix

| Route | Purpose | Auth | Notes |
|-------|---------|------|-------|
| `/` | Splash / loading | None | Auto-continues to `/login` (UI only); reduced-motion aware |
| `/login` | Doctor login UI | None | Shows `Authentication service is not connected.` |
| `/verify-otp` | OTP UI | None | Preview continue only; rejects universal OTP patterns |
| `/dashboard` | Doctor dashboard | None (**future Phase 2 guard**) | Zero/empty states; Demo Doctor + UI PREVIEW |
| `/dashboard/coming/[section]` | Coming soon | None | Phase 1C-B/C placeholders for quick actions |
| `/ui-foundation` | Design system preview | None | Retained from Phase 1B |
| `/app` | Compatibility | None | Redirects to `/dashboard` |
| `not-found` / `global-error` | Error UI | None | Safe copy; no stack traces |

## Future authentication guard boundary

- **Today:** all doctor routes are openly reachable for UI preview.  
- **Phase 2+:** `/dashboard` and nested clinical routes must require authenticated Doctor session.  
- **Never in doctor UI:** `/ops`, Super Admin control plane, security-event feeds.

No `/ops` or Super Admin routes are linked from doctor navigation.
