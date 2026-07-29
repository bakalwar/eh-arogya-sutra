# PHASE 2B-A — Official sources

Access date for all entries: **2026-07-30**.

| Provider | Official URL | Page title / topic | Relevant plan/version | Fact used | Uncertainty | Sales confirmation |
|----------|--------------|-------------------|-----------------------|-----------|-------------|--------------------|
| Auth0 | https://auth0.com/pricing.md | Auth0 Pricing | Free / Essentials / Professional | Free up to 25,000 MAU; passkeys included; B2C Essentials from $35/mo at 500 MAU | Phone OTP channel costs | YES for phone/SMS production |
| Auth0 | https://auth0.com/docs/authenticate/database-connections/passkeys | Passkey Authentication | Docs current | Passkeys for database connections; limit 20 passkeys/user | Plan gating for some MFA | NO for basic passkey existence |
| Auth0 | https://auth0.com/docs/secure/multi-factor-authentication/multi-factor-authentication-factors | MFA factors | Docs current | SMS/Voice/WebAuthn security keys among factors | Plan-dependent availability | YES for enterprise MFA |
| Auth0 | https://auth0.com/docs/secure/multi-factor-authentication/fido-authentication-with-webauthn/configure-webauthn-security-keys-for-mfa | WebAuthn security keys MFA | Docs current | FIDO security keys for MFA; RP ID rules | Browser support caveats | NO |
| Amazon Cognito | https://aws.amazon.com/cognito/pricing/ | Amazon Cognito pricing | Lite/Essentials/Plus | 10,000 MAU free Lite/Essentials; Plus no free tier; SMS via SNS separate; example Essentials $0.015/MAU above free | Exact tier table for all bands | YES for large quotes |
| Amazon Cognito | https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-sign-in-feature-plans.html | Feature plans | Docs current | Passkeys require Essentials or Plus | — | NO |
| Amazon Cognito | https://docs.aws.amazon.com/cognito/latest/developerguide/amazon-cognito-user-pools-authentication-flow-methods.html | Auth flow methods | Docs current | Passkey / OTP / MFA interactions | — | NO |
| Firebase | https://firebase.google.com/pricing/ | Firebase Pricing | Spark/Blaze | Phone Auth billed per SMS; see current rates; Identity Platform MAU tiers | India SMS rate not listed as fixed public cell | YES |
| Firebase | https://firebase.google.com/docs/auth/limits | Authentication Limits | Docs current | Phone SMS limits e.g. 3000/day base Auth; IP limits | Project-specific | NO |
| Firebase | https://firebase.google.com/docs/auth/web/phone-auth | Phone auth web | Docs current | SMS phone sign-in; reCAPTCHA; region policy | — | NO |
| Firebase | https://firebase.google.com/docs/auth | Firebase Authentication | Docs current | Identity Platform MAU pricing notes | — | YES for production billing |
| Twilio | https://www.twilio.com/en-us/verify/pricing | Verify Pricing | Pay-as-you-go | $0.05 per successful verification + channel fees | India SMS channel fee | YES |
| Twilio | https://www.twilio.com/docs/verify/api | Verify API | Docs current | Managed verification API capabilities | — | NO |
| MSG91 | https://msg91.com/in/pricing/otp | OTP Pricing India | India site calculator | Volume price points displayed (e.g. ₹0.18–₹0.25) + GST examples; talk to sales | Personalized plans | YES |
| MSG91 | https://msg91.com/help/all-service-deductions- | Pricing guidelines | Help center | Failed/delivered charge rules; blacklisted not charged | — | NO |
| MSG91 | https://msg91.com/in/pricing/sms | SMS Pricing India | India site | SMS volume price points | Distinct from OTP widget dial plan | YES |
| Keycloak | https://www.keycloak.org/2025/09/keycloak-2640-released | 26.4.0 release | 26.4.0 | Official passkeys support | Ops cost not a product fee | NO |
| Keycloak | https://www.keycloak.org/docs/latest/server_admin/ | Server Administration Guide | Latest docs | Passkey/WebAuthn/orgs overview | Self-host SLA = operator | NO |
| Keycloak | https://www.keycloak.org/docs/latest/release_notes/ | Release Notes | Latest | Passkeys integration notes | — | NO |

No unofficial blogs or comparison sites were used as factual pricing sources.
