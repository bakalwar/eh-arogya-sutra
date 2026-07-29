# PHASE 2A-M — Feedback tests

Deterministic suite: `tests/unit/phase2am-management.test.ts`

| # | Assertion | Expected |
|---|-----------|----------|
| 14 | Valid negative feedback | `ACCEPTED_PRIVATE` / `NEGATIVE_ACCEPTED_PRIVATE` |
| 15 | Positive feedback auto-published | `publishTestimonial === false` |
| 16 | Spam rejection | `SPAM_REJECTED` + reason code |
| 17 | Low confidence | `NEEDS_REVIEW` |
| 18 | Security feedback | `SECURITY_ESCALATED` + safe status only |
| 19 | Testimonial consent | Required + manual approval |
| 20 | Patient content default | `patientContentPresent === false` |

Transmission remains `NOT_CONNECTED` for built records.
