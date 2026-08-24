# R2-DATA-P2C-A — Full-corpus generator tooling

**Authority:** `R2-DATA-P2C-A: AUTHORIZE_FULL_CORPUS_GENERATOR_TOOLING_PR`  
**Classification:** `ENGINEERING_IDENTITY_ONLY`  
**Clinical authority:** NONE  
**Real full-corpus build authorized by this PR:** FALSE

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
- Output directory must be outside the Git repository.
- SQLite reads only `SELECT id, icd10_code FROM diseases ORDER BY id ASC`.
- mapped.json retains only `source`/`code` fields.
- Licensing classification for full corpus manifests:
  `PRIVATE_ENGINEERING_IDENTITY_PENDING_LEGAL_CLEARANCE`
  (not legal clearance; private/local engineering only).

## Explicit non-goals

- No real corpus execution in this PR/CI
- No registry population
- No polarity import
- No runtime/API/UI/search/migration/deployment wiring
