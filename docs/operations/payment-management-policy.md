# Payment management policy

## Principles

- Management Admin cannot manually mark a payment successful without verified provider evidence.
- Manual adjustments require permission, reason, and audit.
- Refunds require a controlled workflow (`refund:request` vs `refund:approve`).
- Gross, net, fees, and refunds remain separate fields.
- Currencies are explicit.
- No fake revenue.

## Phase 2A-M

Read-model contracts only (`SubscriptionSummary`, `PaymentSummary`, `RevenueSummary`, …). Values are `NOT_CONNECTED` / null — no provider integration.
