# R2-DATA-P2C-A — Full-corpus generator tooling

**Authority:** `R2-DATA-P2C-A: AUTHORIZE_FULL_CORPUS_GENERATOR_TOOLING_PR`  
**Classification:** `ENGINEERING_IDENTITY_ONLY`  
**Clinical authority:** NONE  
**Real full-corpus build authorized by this PR:** FALSE  
**Generator version:** `0.2.1-p2c-full-corpus-tooling-harden`

## Commands

```text
node tools/disease-identity-generator/cli.mjs preflight-full-corpus ...
node tools/disease-identity-generator/cli.mjs build-full-corpus --authorize-full-corpus --owner-token "R2-DATA-P2C: AUTHORIZE_FULL_CANONICAL_IDENTITY_ARTIFACT_GENERATION_AND_VERIFICATION" ...
node tools/disease-identity-generator/cli.mjs verify-full-bundle --input <external-dir>
node tools/disease-identity-generator/cli.mjs compare-full-builds --a <dir> --b <dir>
node tools/disease-identity-generator/cli.mjs verify-inventory --inventory <path> --mapped-json <path>
```

## Guards

- Full build requires `--authorize-full-corpus`, exact owner token, pinned SHA-256 values, and explicit external paths.
- Output directory must be outside the Git repository (realpath / symlink-safe).
- SQLite reads only `SELECT id, icd10_code FROM diseases ORDER BY id ASC` via pinned-byte immutable URI (`mode=ro&immutable=1`); WAL/SHM are not read. Fallback readonly open is allowed only when sidecars are absent.
- mapped.json uses a string-aware streaming parser; only `source`/`code` are retained; rows aggregate into dedupe buckets (no full raw array retained).
- Bridge JSONL has bounded line length and max rows; candidate IDs must be unique, strictly ascending, and present in the DB id set.
- Bridge key set must equal mapped unique-key set; EXACT_UNIQUE rows must each produce a relationship edge (no silent omit).
- Atomic bundle write verifies staged members (hashes, counts, semantic invariants) before rename; never overwrites an existing destination.
- Manifest hash-pins every immutable member except itself (including `p2c-build-evidence.json`).
- Licensing classification for full corpus manifests:
  `PRIVATE_ENGINEERING_IDENTITY_PENDING_LEGAL_CLEARANCE`
  (not legal clearance; private/local engineering only).

## Memory / streaming posture

Documented peak-memory budget constant: `DOCUMENTED_PEAK_MEMORY_BUDGET_BYTES` (512 MiB engineering estimate).  
Processing model: bounded stream dedupe for mapped.json, SQLite `.iterate()`, bounded Bridge JSONL line reads, streamed inventory line counts.

## Explicit non-goals

- No real corpus execution in this PR/CI
- No registry population
- No polarity import
- No runtime/API/UI/search/migration/deployment wiring
