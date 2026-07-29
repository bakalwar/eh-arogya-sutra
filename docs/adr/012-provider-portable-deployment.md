# ADR 012 — Provider-portable deployment

## Status

Accepted (Phase 2A-D)

## Decision

Use provider-neutral abstractions for database, temp object store, queue, email, SMS, monitoring, secrets, backup, and deployment. Free pilot environments have explicit capacity limits and must not claim 100,000-doctor readiness. Free-to-paid migration is a gated Super Admin workflow.

## Consequences

No provider SDK/credentials in this phase. PostgreSQL persistence is Phase 3.
