# R2-DATA-P2C-A — Full-corpus generator tooling

**Authority:** `R2-DATA-P2C-A: AUTHORIZE_FULL_CORPUS_GENERATOR_TOOLING_PR`
**Classification:** `ENGINEERING_IDENTITY_ONLY`
**Clinical authority:** NONE
**Real full-corpus build authorized by this PR:** FALSE
**Generator version:** `0.3.0-p2c-sanitized-identity-tooling` (see also `p2c-c-sanitized-identity-tooling.md`)

## Commands

```text
node tools/disease-identity-generator/cli.mjs preflight-full-corpus ...
node tools/disease-identity-generator/cli.mjs build-full-corpus --authorize-full-corpus --owner-token "..." \
  --expected-generator-commit <40-hex> --legacy-db ... --mapped-json ... --bridge ... --output <external>
node tools/disease-identity-generator/cli.mjs verify-full-bundle --input <external-dir>
node tools/disease-identity-generator/cli.mjs compare-full-builds --a <dir> --b <dir>
node tools/disease-identity-generator/cli.mjs verify-inventory --inventory <path> --mapped-json <path>
```

`verify-full-bundle` locks expected `bundleKind` to
`EHAS2_FULL_CANONICAL_DISEASE_IDENTITY_LEDGER_V1` (production). Artifacts cannot choose their own verification policy.

## Bundle identity

| Kind | Value |
|------|--------|
| Production | `EHAS2_FULL_CANONICAL_DISEASE_IDENTITY_LEDGER_V1` |
| Synthetic fixture | `EHAS2_SYNTHETIC_DISEASE_IDENTITY_FIXTURE_V1` |

`bundleKind` appears in both `bundle-manifest.json` and `p2c-build-evidence.json` and must agree. Production verification always enforces full-corpus counts when the expected kind is production — never by inferring from `diseaseCount === 116284` alone.

Publication is fail-closed activation publication, not an atomic rename. It fully verifies staging, exclusively creates a previously absent destination, copies only verified members, re-verifies the destination, and exclusively writes `ehas2-bundle-activation.json` last. The marker binds `aggregateFingerprint`, `bundleKind`, and `schemaVersion`. Verifiers reject directories lacking a valid marker.

## Guards

- Full build requires `--authorize-full-corpus`, exact owner token, pinned SHA-256 **and** mapped consumed bytes (`54,597,079`), `--expected-generator-commit`, clean git worktree, remote `bakalwar/EH_AROGYA_SUTRA_2`, expected commit object existence, exact equality with the verified `ehas2/main` tip, and `merge-base --is-ancestor` reachability from that tip.
- Output directory must be outside the Git repository (realpath / symlink-safe).
- SQLite reads only `SELECT id, icd10_code FROM diseases ORDER BY id ASC` via pinned-byte immutable URI; WAL/SHM presence fails closed before open/fallback. Fallback readonly only when both sidecars are absent.
- **mapped.json / Bridge / inventory:** same-stream SHA-256 over the exact bytes fed to the parser/reader (no second independent hash pass for mapped consumed-byte proof). **SQLite:** pre/post main-file path hash + immutable readonly query — not a row-consumed-byte hash.
- Production CLI uses a private temporary SQLite **controlled build index** (not shipped in the bundle): DB rows, mapped unique keys, and bridge rows/candidates are persisted and iterated from disk. It does **not** reconstruct `dbRows[]`, does **not** call `bridgeIndex.rows()`, and does **not** retain corpus-sized disease/mapped/edge/unresolved JavaScript arrays during generation.
- Publication never deletes a foreign destination. It may clean up only the unactivated destination directory it exclusively acquired and only while that directory contains recognized bundle names. Existing paths, including empty directories, fail closed.
- Manifest hash-pins immutable members except itself (including build-evidence). Activation marker is required for published verification but is not part of the aggregate fingerprint member list (it binds the fingerprint instead).

## Memory / streaming posture (honest)

| Structure | Location |
|-----------|----------|
| Legacy DB identity rows | Controlled SQLite index (`db_disease`) |
| Mapped unique keys + provenance | Controlled SQLite index (`mapped_entry`) |
| Bridge dispositions + candidates | Controlled SQLite index (`bridge_entry` / `bridge_candidate`) |
| Generated member lines (pre-JSONL) | Controlled SQLite index (`output_record`) then streamed to staging |
| Parser unfinished object buffer | Process memory (≤ `MAX_MAPPED_OBJECT_BYTES`) |
| Verifier disease/mapped ID sets | Process memory (endpoint checks; not full member bodies) |
| Manifest / evidence strings | Process memory (small) |

- `ESTIMATED_PEAK_MEMORY_BUDGET_BYTES` (512 MiB) is an **engineering estimate only** — not a process RSS enforcer.
- Fail-closed limits: `MAX_STAGING_MEMBER_BYTES`, continuous BigInt accounting of the controlled SQLite main/WAL/SHM/journal files against `MAX_CONTROLLED_INDEX_BYTES` (2 GiB), max mapped object/line sizes, max bridge candidates (64), fixed production row counts, and verifier row bounds checked before identity-set insertion.
- Remaining OS limits: V8 heap, SQLite page cache, filesystem TOCTOU for input replace-and-restore races (mitigated by same-stream digests + pre/post identity snapshots, not eliminated).

Synthetic unit tests may still use small in-memory arrays via `buildFullCorpusArtifacts` or the synthetic streaming fixture builder. Only `buildFullCorpusArtifactsBoundedProduction` can emit the production bundle kind. Production CLI uses only that disk-backed path.

## Bridge ingest schemas

| Mode | API | Use |
|------|-----|-----|
| **Pinned Bridge V3 actual** (`pinned-bridge-v3-actual`) | `parsePinnedBridgeV3JsonlRow` / production stream default | Exact 13-key pinned `R2_BRIDGE_CANDIDATES_V3.jsonl` rows |
| **Synthetic projected mini** (`synthetic-projected-mini`) | `parseBridgeJsonlRow` | Test/fixture rows only (`allowSyntheticBridgeSchema=true`) |

Production full-corpus ingest requires the actual V3 key set (`ambiguity`, `bridge_id`, `candidate_eh_disease_id`, `majority_polarity`, `mapped_code`, `mapped_name`, `match_confidence`, `match_method`, `polarity_conflict`, `polarity_counts`, `recommended_disposition`, `source_system`, `technical_disposition`). It does **not** silently fall back to the synthetic mini-schema. Duplicate JSON object keys are rejected at **every** depth (including nested `polarity_counts`), with Unicode-escape–equivalent keys treated as identical, before identity extraction. Identity extraction uses `source_system`, `mapped_code`, authoritative `recommended_disposition`, and disposition-shaped `candidate_eh_disease_id` only. Polarity / `mapped_name` / `bridge_id` / match provenance fields are structurally validated and never enter `ParsedBridgeRow`, controlled-index identity columns, edges, unresolved queue, or clinical authority.

## Explicit non-goals

- No real corpus execution in this PR/CI
- No registry population
- No polarity import
- No runtime/API/UI/search/migration/deployment wiring
