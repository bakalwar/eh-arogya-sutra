# Authentication cost model

Access date: **2026-07-30**. Exact India SMS totals often require sales confirmation.

## Assumptions (explicit)

| Assumption | Pilot | Growth |
|------------|-------|--------|
| Registered doctors | 50 / 100 / 500 | 1k / 10k / 50k / 100k |
| Monthly active doctors (MAD) | 70% of registered | 50–70% of registered |
| Daily active | ~25% of MAD | ~20–30% of MAD |
| Logins / MAD / month | 20 | 15–25 |
| OTP onboarding per new doctor | 1–2 SMS | 1–2 SMS |
| OTP retry rate | 15% | 10–20% |
| Passkey adoption (repeat login) | 20% pilot → 60% later | reduces OTP logins |
| Universal OTP | Forbidden | Forbidden |

## Official base fees used

| Fee | Source | Value | Uncertainty |
|-----|--------|-------|-------------|
| Twilio Verify successful verification | twilio.com/en-us/verify/pricing | USD 0.05 + channel fee | India SMS channel fee variable — YES sales confirm |
| MSG91 India OTP calculator display | msg91.com/in/pricing/otp | ~₹0.18–₹0.25/SMS by volume (+GST on examples) | Personalized plans — YES |
| Auth0 Free MAU | auth0.com/pricing.md | 25,000 MAU | Paid tiers for higher MFA/org needs — YES |
| Cognito Essentials free MAU | aws.amazon.com/cognito/pricing | 10,000 MAU Lite/Essentials | SNS SMS separate — YES |
| Cognito Essentials example rate | same page example | USD 0.015 / MAU above free (example) | Confirm current tier table — YES |
| Firebase Phone Auth | firebase.google.com/pricing | Per SMS; see current rates | India rate UNKNOWN without console/sales — YES |
| Firebase Identity Platform MAU | firebase.google.com/docs/auth | 50K MAU no-cost then 0.0025–0.0055 (email/social/custom) | Phone SMS separate — YES |

## Approximate monthly ranges (Hybrid E1 — proposed)

Ranges are **illustrative bands** combining MSG91 OTP calculator bands + infra UNKNOWN. Not exact quotes.

| Scale | OTP SMS estimate (assumptions) | Hybrid OTP spend band | Notes |
|-------|--------------------------------|------------------------|-------|
| 50 doctors | ~80–200 SMS/mo | ₹20–₹80 + GST / UNKNOWN ops | Free-pilot friendly |
| 100 doctors | ~150–400 SMS/mo | ₹40–₹150 + GST | Still low |
| 500 doctors | ~800–2,500 SMS/mo | ₹150–₹700 + GST | Watch abuse |
| 1,000 | ~1.5k–5k SMS/mo | ₹300–₹1,500 + GST | Passkey reduces repeat OTP |
| 10,000 | ~10k–40k SMS/mo | ₹2k–₹12k + GST | Strong passkey push |
| 50,000 | ~40k–150k SMS/mo | ₹8k–₹45k + GST | Confirm volume contract |
| 100,000 | ~80k–300k SMS/mo | ₹15k–₹90k + GST | Sales confirmation required |

### Twilio Verify fallback cost note

If all successful verifications used Twilio Verify at USD 0.05 **plus** India SMS channel fee (UNKNOWN publicly as a single fixed India OTP price on Verify page):  
100k successful verifications ≈ USD 5,000 Verify fee alone **before** SMS channel fees — typically worse than MSG91 India rates for high volume.

### Managed IdP overlays (if chosen instead of hybrid)

| Scale MAD | Auth0 | Cognito Essentials (example) |
|-----------|-------|------------------------------|
| ≤25k | Free plan possible for MAU | Free to 10k then ~$0.015/MAU example |
| 50k–100k | Paid / Contact us | Material MAU bill + SNS SMS |

## Free-tier boundaries

- Auth0 Free: 25k MAU  
- Cognito Lite/Essentials: 10k MAU (direct/social)  
- Firebase Identity Platform: 50k MAU no-cost (non-phone providers per docs)  
- Hybrid: OTP prepaid/postpaid wallet; no MAU fee from identity vendor  

## Paid-tier / migration triggers

- OTP monthly spend exceeds owner budget threshold  
- Need for contracted SLA / enterprise audit export  
- Abuse volume requiring managed bot protection at scale  
- Free Cognito/Auth0 MAU ceiling approached if those platforms used  
