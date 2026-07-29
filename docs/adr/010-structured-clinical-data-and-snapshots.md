# ADR 010 — Structured clinical data and snapshots

## Status

Accepted (Phase 2A-D)

## Decision

Persist structured typed clinical records plus immutable human-readable snapshots. Never store consultations as a single plain-text blob. Never reconstruct historical prescriptions with future engine rules.

## Consequences

Search/history/versioning become feasible; clinical audit retains exact reviewed text.
