# Feedback moderation policy

## Forbidden rule

Do **not** implement `positive feedback = accept` / `negative feedback = reject`.

Valid positive, neutral, and negative feedback is accepted **privately**.

## Outcomes

`ACCEPTED_PRIVATE`, `NEEDS_REVIEW`, `SPAM_REJECTED`, `DUPLICATE_LINKED`, `ABUSIVE_QUARANTINED`, `SECURITY_ESCALATED`, `SUPPORT_TICKET_CREATED`, `PUBLICATION_CONSENT_REQUIRED`, `PUBLISHED_TESTIMONIAL`, `REJECTED_WITH_REASON`.

## Automatic rejection (high confidence only)

- empty/meaningless submission
- automated spam
- exact duplicate flood
- malicious payload/link
- prohibited executable content

## Abuse / threats

Do **not** discard. Quarantine (`ABUSIVE_QUARANTINED`) and escalate for safety review when appropriate.

## Low confidence

Send to `NEEDS_REVIEW` — never auto-reject.

## Automation requirements (future providers)

Every automated decision must include reason code, confidence, rules/model version, audit event, human-review path, and appeal/reconsideration path.

Phase 2A-M implements **deterministic** interfaces only — no AI moderation provider.
