# R2-DATA-P2C-C — Sanitized legacy disease identity tooling

**Authority:** `R2-DATA-P2C-C-SANITIZED-TOOLING-PR-01`  
**Classification:** `ENGINEERING_IDENTITY_ONLY`  
**Clinical authority:** `NONE`  
**Real derivation / real full-corpus build in this PR:** **FALSE**

## Owner decisions (accepted)

- Canonical source: transactionally consistent identity-only snapshot from complete committed live SQLite state.
- Primary method: **D-DIRECT** (readonly `mode=ro`, **not** `immutable=1`, one DEFERRED read transaction, allowlisted SQL only).
- Method E (full PHI backup) is **not** authorized.
- SHM caveat: Windows WAL readonly may touch SHM/wal-index coordination state; never claim zero filesystem metadata touch; fail on unexpected **main** DB content mutation.
- Canonical disease ID algorithm and hash inputs remain unchanged (`EHAS2_PINNED_LEGACY_DISEASE_DB_V1` + `legacyDbDiseaseId`).
- Derived artifact lifecycle is always `DERIVED_PENDING_ADOPTION` and immutable.
- Adoption is a separate in-repo control-plane manifest; build requires adoption + artifact agreement.

## Artifact

| Item | Value |
|------|--------|
| Kind | `SANITIZED_LEGACY_DISEASE_IDENTITY_JSONL_V1` |
| Record schema | `ehas2-sanitized-legacy-disease-identity-record-v1` |
| Dataset version | `ehas2-sanitized-legacy-disease-identity-v1` |
| Keys | `artifactSchemaVersion`, `legacyAuthority`, `legacyDbDiseaseId`, `legacyCodeRaw` |
| Fingerprint | `EHAS2_ORDERED_SANITIZED_DISEASE_IDENTITY_FP_V1_SHA256` |

Framing: `UTF8(canonicalJsonString(record))||LF` per row; outer fingerprint = domain prefix + NUL + schema + NUL + decimal count + NUL + SHA256(record-byte stream).

## SQL privacy

- Query ID: `EHAS2_DISEASE_IDENTITY_SQL_V1`
- Exact SQL: `SELECT id, icd10_code FROM diseases ORDER BY id ASC`
- Pinned SHA-256: `dd936ecf5f21ca877fac1b9c78ef2b571167ce05ef2c8d507b13960b483391d7`
- No row values in logs/evidence.

## Identity stability window

1. Pass A: DEFERRED txn derives artifact + fingerprint.  
2. Pass B: second DEFERRED txn fingerprint-only.  
3. Require equal counts/fingerprints before publication.  
Mismatch → fail closed; delete partials; aggregate error only.

## Commands

```text
derive-sanitized-disease-identity --authorize-derive-sanitized-identity \
  --owner-token "R2-DATA-P2C-C-DERIVE-01: AUTHORIZE_ONE_SANITIZED_LEGACY_DISEASE_IDENTITY_DERIVATION" \
  --source-db <external> --source-evidence-ref <historical-p2a-main-sha> \
  --output <external-dir> --expected-generator-commit <40-hex>

build-full-corpus ... --db-identity-input-class SANITIZED_LEGACY_DISEASE_IDENTITY_JSONL_V1 \
  --sanitized-artifact ... --sanitized-manifest ... --adoption-id ... \
  --expected-artifact-sha256 ... --expected-artifact-bytes ... --expected-record-count 116284 \
  --expected-ordered-fingerprint ... --expected-sanitized-manifest-sha256 ...
```

Full DB mode and sanitized mode are **XOR**. No sanitized→live DB fallback. No network download.

## Adoption control plane

Directory: `docs/clinical/disease-identity/sanitized-adoption-manifests/`  
Caller supplies `--adoption-id` only (closed filename pattern). Path is derived from trusted repo root.

## Future sequence

1. Merge this tooling.  
2. Owner selects private sanitized output root.  
3. `R2-DATA-P2C-C-DERIVE-01` → one derivation.  
4. Aggregate evidence review.  
5. Adoption manifest PR.  
6. Authorized sanitized-input full build.  
7. P2C-D / P2C-E.

## Licensing / privacy

- `PRIVATE_ENGINEERING_IDENTITY_PENDING_LEGAL_CLEARANCE`
- `SANITIZED_IDENTITY_NO_PHI`
- No absolute paths in canonical manifests.
