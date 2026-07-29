# PHASE 1C-B — Form validation

Frontend-only validation in `apps/web/src/lib/case/validation.ts`:

- Required fields per step
- Numeric ranges (BP, pulse, temperature, SpO₂, weight, age, severity 1–10)
- Systolic > diastolic
- Negative values rejected
- Empty / whitespace-only symptoms rejected
- Emergency acknowledgement required when red flags selected
- Error summary + focus first invalid field

Does **not** validate diagnosis, medicines, potency, or clinical-engine rules.
