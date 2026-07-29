# PHASE 1C-A — Privacy boundary

## Guarantees in this phase

- No OTP / mobile values logged
- No credential storage (localStorage/session/cookies for auth)
- No real sessions or JWTs issued by the UI preview
- Problem report submit disabled (`NOT_CONNECTED`); no persistence / transmission
- Problem report does **not** auto-attach patient names, symptoms, reports, prescriptions, phone numbers, browser storage, or tokens
- Local preview support IDs only (`SUP-PREV-…`)
- Demo doctor name only: `Demo Doctor`, session labelled `UI PREVIEW`
- No Irfaz Khan / production clinic records / consultation IDs in fixtures
- Super Admin internals never shown to doctors
- No analytics / unapproved third-party tracking scripts

## Truthful dashboard statuses

- Today’s Patients: **0**
- Pending Analyses: **0**
- Recent patients / activity: empty states
- Clinical Engine: Not Connected
- Disease / Medicine Data: Not Installed
- Authentication: Preview Only
- Payment / Monitoring: Not Active
