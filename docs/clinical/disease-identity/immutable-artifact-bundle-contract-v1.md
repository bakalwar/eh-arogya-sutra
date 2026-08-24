# R2-DATA-P2B — Immutable External Ledger Bundle Contract (v1)

**Bundle schema version:** `ehas2-disease-identity-bundle-v1`  
**Policy gate:** R2-DATA-P2B-ID-02 (hybrid in-repo control plane + immutable external bundle)

## In repository (this PR)

- Specifications and schemas
- `@ehas2/disease-identity` shared package (non-runtime)
- Synthetic fixtures and tests
- Generator/validator tooling (bounded, explicit I/O)
- Manifest/evidence templates
- Owner-approved aggregate count declarations

## External bundle (NOT created in P2B PR)

Future immutable bundle artifacts (outside Git):

- Full canonical disease identity ledger JSONL
- Mapped index JSONL
- Optional relationship JSONL
- Bundle manifest with artifact SHA-256, byte counts, aggregate fingerprint
- Pinned input evidence hashes (mapped.json SHA, DB SHA, bridge SHA)

## Manifest template fields

| Field | Purpose |
|-------|---------|
| `bundleSchemaVersion` | Bundle contract version |
| `datasetVersion` | Engineering dataset version |
| `authorityClassification` | `ENGINEERING_IDENTITY_ONLY` |
| `licensingClassification` | Declares licensing posture |
| `canonicalIdAlgorithms` | Allowed ID algorithms |
| `inputEvidenceHashes` | Pinned upstream evidence (external) |
| `generatorVersion` | Tooling version |
| `artifacts[]` | `{ name, rowCount, sha256, bytes }` |
| `aggregateFingerprint` | SHA-256 over ordered artifact hashes |
| `reconciliation` | Owner-approved aggregate counts |

## Immutability rules

- Published bundle manifests are append-only; corrections require new bundle generation with new manifest.
- Canonical disease IDs MUST NOT change when bundle version or evidence hashes change.
- Artifact bytes MUST match declared SHA-256 at verification time.

## Authority / exclusion declarations

- No raw SQLite DB, mapped.json, WAL/SHM, PHI/PII, or copyrighted source prose in Git.
- No real full ledger or unresolved queues in Git.
- Full corpus generation requires explicit owner authorization flag; blocked in P2B v1 implementation task.

## Generator CLI

`tools/disease-identity-generator/cli.mjs`

Commands:

- `synthetic --input <file.jsonl> --output <dir>` — bounded synthetic processing
- `validate --input <file.jsonl>` — fail-closed validation
- `manifest-template --output <file.json>` — reconciliation template

Full corpus mode requires `--authorize-full-corpus` and remains disabled in P2B v1.
