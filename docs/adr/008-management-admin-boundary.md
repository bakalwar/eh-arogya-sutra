# ADR 008 — Management Admin boundary

## Status

Accepted (Phase 2A-M)

## Context

The platform needs business operators to manage doctors, billing, support, and feedback without granting Super Admin technical controls or default patient PHI.

## Decision

Introduce a separate **Management Admin** plane with least-privilege roles and permissions, distinct from Clinic Admin and Super Admin. Dual membership requires an audited workspace switch. Client role claims and production test principals are rejected.

## Consequences

- `/management` shells are reserved and policy-protected.
- Doctor UI shows Feedback & Support, not Management Admin.
- Live login/persistence remain later phases.
