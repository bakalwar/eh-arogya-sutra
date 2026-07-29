# Threat model (Phase 1A draft)

| Threat | Mitigation phase |
|--------|------------------|
| Cross-tenant data leak | Phase 3 authZ + DB RLS/policy |
| Upload malware | Phase 11 scanning hook |
| OTP abuse | Phase 2 rate limits |
| Secret leak | CI secret scan, no secrets in repo |
| Legacy path import | verify-boundary script |
