# R2-DATA-P2B — Authority and Exclusion Declarations

**Classification:** `ENGINEERING_IDENTITY_ONLY`  
**Clinical activation:** NONE  
**Runtime wiring:** NONE in P2B v1

## In-repo authority (this control plane)

| Artifact | Authority |
|----------|-----------|
| Canonical disease ID algorithm | Owner gate ID-01 (`NEW_EHAS2_DISEASE_ID_v1`) |
| Hybrid bundle policy | Owner gate ID-02 |
| Fail-closed ambiguity policy | Owner gate ID-03 |
| DB-only first-class identity | Owner gate ID-04 |
| Shared ledger reference contract | Owner gate ID-05 |
| Legacy provenance anchor | `EHAS2_PINNED_LEGACY_DISEASE_DB_V1` (integer row ID only) |
| P2A engineering freeze | PR #140 pinned evidence hashes (external to Git) |

## Explicit exclusions (must not enter Git)

- Raw SQLite DB, WAL/SHM, `mapped.json`
- PHI/PII, patient/consultation payloads
- Real full ledger (116k rows) or real unresolved/quarantine queues
- Copyrighted legacy source prose
- Temporary build artifacts, credentials, absolute local paths, production URLs
- External immutable bundle bytes (declared by manifest only)

## Non-runtime exclusions (must not be modified/wired)

- `ehas2-disease-schema-v1` runtime loader
- Rule 1 / Rule 2 evaluator or registry
- Rules 6 / 8
- Disease search, API, UI, worker, orchestration
- Database migrations (including migration 019)
- Production/deployment configuration

## Full corpus gate

Full legacy corpus generation requires explicit `--authorize-full-corpus` and separate owner authorization. P2B v1 implements synthetic/bounded tooling only.

## Semantic inference exclusion

No automatic clinical suitability, noise, or keyword-based quarantine is authorized in P2B v1.
