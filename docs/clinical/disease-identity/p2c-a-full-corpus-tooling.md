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
- SQLite reads only `SELECT id, icd10_code FROM diseases ORDER BY id ASC` via pinned-byte immutable URI (`mode=ro&immutable=1`, `uri: true`, `readonly: true`, `fileMustExist: true`, `PRAGMA query_only=ON`). Presence of `-wal` or `-shm` fails closed before any open/fallback. Fallback readonly is permitted only when both sidecars are absent and URI open failed for another reason.
- Consumed-byte SHA-256 digests are compared to pinned identities for mapped/bridge/inventory streams; SQLite main-file hash is checked before open and after close. Residual OS replace-and-restore races are acknowledged and not claimed as impossible.
- mapped.json uses a string-aware streaming parser; unfinished objects (including mid-string / mid-escape / mid-`\uXXXX`) are retained across chunk boundaries; only `source`/`code` are retained; rows aggregate into dedupe buckets (no full raw array retained).
- Bridge JSONL has bounded line length and max rows; candidate IDs must be unique, strictly ascending, and present in the DB id set.
- Bridge key set must equal mapped unique-key set; EXACT_UNIQUE rows must each produce a relationship edge (no silent omit).
- Production CLI calls `validateBridgeBatchProduction` + `buildFullCorpusArtifactsProduction` only — `skipBridgeMappedKeyReconciliation` and disposition/count overrides are impossible on that path.
- Atomic bundle write verifies staged members (hashes, streaming row counts, semantic invariants) before rename; never overwrites an existing destination; staging/destination must share a filesystem; free-space math uses BigInt.
- Manifest hash-pins every immutable member except itself (including `p2c-build-evidence.json`). Self-reference handling: `bundle-manifest.json` is not included in its own artifact hash list / aggregate fingerprint inputs as a circular self-hash.
- Licensing classification for full corpus manifests:
  `PRIVATE_ENGINEERING_IDENTITY_PENDING_LEGAL_CLEARANCE`
  (not legal clearance; private/local engineering only).

## Memory / streaming posture

Estimated peak-memory budget constant: `ESTIMATED_PEAK_MEMORY_BUDGET_BYTES` (512 MiB engineering estimate; **not enforced at runtime**).  
Fail-closed size guard: `MAX_STAGING_MEMBER_BYTES` (512 MiB) — a single staged bundle member must not exceed this.  
Processing model: bounded stream dedupe for mapped.json, SQLite `.iterate()` / JSONL spool, bounded Bridge JSONL line reads with index maps (no full raw row array), streamed inventory line counts, verify-one-artifact-at-a-time.  
Production bridge validation (`validateBridgeBatchProduction`) requires a mandatory DB id set and fixed disposition/referenced/db-only counts with no overrides. Synthetic tests use `validateBridgeBatchSynthetic`.  
`generatorSourceCommit` is recorded in `p2c-build-evidence.json` only (from `git rev-parse HEAD` at build time; synthetic tests use `SYNTHETIC_TEST_COMMIT`).

## Explicit non-goals

- No real corpus execution in this PR/CI
- No registry population
- No polarity import
- No runtime/API/UI/search/migration/deployment wiring
