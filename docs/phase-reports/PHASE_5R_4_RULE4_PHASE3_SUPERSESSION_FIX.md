# Rule 4 Phase 3 — Supersession correction (read-only note)

## Dedupe vs supersession

- **Dedupe** (`buildDedupeGroupKey`): includes `parentSourceId` — collapses same-parent duplicate/OCR-native copies.
- **Supersession** (`supersessionGroupKey`): **excludes** `parentSourceId` — cross-parent newer strictly-newer timestamps supersede older usable items within the same comparability bucket (target, organ, site, laterality, pathology, test identity, source tier class).

## Timestamps

- Supersession requires **strictly greater** comparable ISO timestamps.
- **Same timestamp**: no clinical winner; identical signatures corroborate; conflicting value/unit → slot contradiction.
- **Invalid/missing timestamp**: no supersession; `SUPERSESSION_TIMESTAMP_NOT_COMPARABLE` / `SUPERSESSION_SKIPPED_INVALID_TIMESTAMP`.

## Quarantine probe

- `quarantineProbe` is **audit-only** (boolean flags). It does not invalidate independently structured evidence items.
- Top-level forbidden Rule 4 orchestrator fields remain fail-closed via `validateRule4InputContract`.

## Golden fixture

- `fixtures/rule4/evidence-adapter-scenarios.v1.json` is read-only in tests (no `writeFileSync` / regeneration in Vitest).
- Per-scenario `expected` holds clinical fields only; fixed hashes live in `fingerprintV1References`.

## Tier-1 source-type isolation

- Supersession comparability uses exact `DOCTOR_STRUCTURED_ENTRY` vs `DOCTOR_STRUCTURED_PHOTO_OBSERVATION` — no cross-type silent supersession.
