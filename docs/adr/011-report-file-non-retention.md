# ADR 011 — Report file non-retention

## Status

Accepted (Phase 2A-D)

## Decision

Original report files and patient photographs are never permanently stored. Temporary processing uses short TTL, cleanup on all exit paths, and deletion verification. Only verified structured findings and safe metadata may persist.

## Consequences

Backups exclude temporary report objects. Deletion failures escalate safely without exposing report contents.
