# Clinical data sanitization (Phase 5B)

## Allowlist / denylist

Extraction uses explicit approved disease fields and denylist tables (`consultations`, `api_keys`, …).

## Controls

- Read-only SQLite open + write probe failure required
- Source checksum fail-closed
- Output scan for prohibited field names
- Full artifact gitignored under `data/clinical-artifacts/`
- Runtime packages must not embed old-project paths or `eh_arogya.db`
- Offline extraction only via explicit CLI

## Patient data

Patient/consultation/report/prescription data must never enter the sanitized disease package.
