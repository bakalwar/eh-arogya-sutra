# PHASE 2B-A — Cost matrix

Access date: 2026-07-30.

## Hybrid E1 OTP spend bands (MSG91 India calculator-informed)

| Registered doctors | Illustrative monthly OTP band | Free-tier IdP MAU fee |
|--------------------|-------------------------------|------------------------|
| 50 | ₹20–₹80 + GST (low volume) | ₹0 (EHAS2 sessions) |
| 100 | ₹40–₹150 + GST | ₹0 |
| 500 | ₹150–₹700 + GST | ₹0 |
| 1,000 | ₹300–₹1,500 + GST | ₹0 |
| 10,000 | ₹2,000–₹12,000 + GST | ₹0 |
| 50,000 | ₹8,000–₹45,000 + GST | ₹0 |
| 100,000 | ₹15,000–₹90,000 + GST | ₹0 — **sales confirmation required** |

## Twilio Verify fallback (successful verification fee only)

| Successful verifications / month | Verify fee @ USD 0.05 | SMS channel |
|----------------------------------|-----------------------|-------------|
| 1,000 | ~USD 50 | India fee UNKNOWN (confirm) |
| 10,000 | ~USD 500 | UNKNOWN |
| 100,000 | ~USD 5,000 | UNKNOWN |

## Cognito Essentials overlay (if used as managed IdP)

| MAD | MAU fee (using published free 10k + example $0.015) | SMS |
|-----|-----------------------------------------------------|-----|
| 5,000 | ~USD 0 (under free tier) | SNS separate |
| 50,000 | ~USD 600 (example) | SNS separate |
| 100,000 | ~USD 1,350 (example) | SNS separate |

## Auth0 overlay

| MAD | Plan note |
|-----|-----------|
| ≤25,000 | Free plan possible for MAU |
| >25,000 / advanced MFA/org | Paid Essentials+ / Contact us |

All totals exclude hosting, support, GST where not stated, and negotiated discounts.
