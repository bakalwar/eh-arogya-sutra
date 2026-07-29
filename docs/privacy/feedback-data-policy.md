# Feedback data policy

## Collect (doctor form)

- category, optional rating, title, description
- affected feature/page (route template preferred)
- problem vs suggestion, reproducibility
- optional screenshot consent, contact permission
- public-testimonial consent (separate, **off by default**)

## Do not automatically collect

- patient names, symptoms, prescription contents, uploaded medical reports
- phone number, OTP, cookies/tokens, browser storage
- complete URLs containing sensitive IDs

## Safe diagnostics (later phases)

- app version, route template, timestamp
- browser/device class, safe error code, request ID
- tenant ID where authorized

## Phase 2A-M

Transmission and persistence are **NOT_CONNECTED**. Client-side validation may run locally; nothing is sent.
