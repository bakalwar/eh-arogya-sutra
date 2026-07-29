# PHASE 2B-A — Provider evaluation matrix

Access date: 2026-07-30. Scores are weighted engineering judgments on top of official facts (not marketing claims).

Weights (sum 100): India OTP 12, OTP cost 10, Passkeys/MFA 10, Super Admin security 10, Tenant/membership 6, Session security 6, Portability/exit 10, Pilot suitability 8, 100k suitability 8, Ops complexity 8, Next.js/Node 4, Audit/webhooks 4, Privacy/data location 4.

| Criterion (weight) | Auth0 A1 | Cognito B1 | Firebase B2 | Hybrid E1 | Keycloak D1 |
|--------------------|----------|------------|-------------|-----------|-------------|
| India mobile OTP | 6 | 6 | 7 | 10 | 5 |
| OTP/SMS cost | 4 | 5 | 4 | 9 | 7 |
| Passkeys | 9 | 9 | 6 | 8 | 9 |
| MFA | 9 | 8 | 6 | 8 | 9 |
| Super Admin security | 8 | 8 | 5 | 9 | 9 |
| Tenant/org | 9 | 7 | 5 | 9 | 8 |
| Session security | 8 | 8 | 7 | 9 | 8 |
| Portability/exit | 4 | 5 | 4 | 10 | 9 |
| Free-pilot | 8 | 9 | 6 | 9 | 5 |
| 100k doctors | 6 | 8 | 6 | 9 | 7 |
| Ops complexity (higher=easier) | 8 | 7 | 7 | 5 | 3 |
| Next.js/Node | 9 | 8 | 8 | 9 | 7 |
| Audit/webhooks | 9 | 7 | 6 | 7 | 7 |
| Privacy/data location | 6 | 6 | 6 | 7 | 8 |
| **Weighted total (approx)** | **70** | **72** | **60** | **84** | **68** |

Raw facts remain in official sources + cost model. Hybrid wins on India OTP cost control + authorization portability.
