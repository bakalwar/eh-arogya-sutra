# R2-DATA-P2B — Canonical Disease Identity Algorithm

**Status:** ENGINEERING CONTROL PLANE (non-runtime)  
**Owner gates:** R2-DATA-P2B-ID-01 … ID-05 (approved)

## Algorithm

| Field | Value |
|-------|-------|
| Name | `EHAS2_CANONICAL_DISEASE_ID_v1_SHA256` |
| Output prefix | `ehas2-dis-v1-` |
| Digest | 64 lowercase SHA-256 hex |

## Canonical identity object (exact fixed key set)

```json
{
  "algorithm": "EHAS2_CANONICAL_DISEASE_ID_v1_SHA256",
  "legacyAuthority": "EHAS2_PINNED_LEGACY_DISEASE_DB_V1",
  "legacyDbDiseaseId": 1,
  "recordKind": "LEGACY_DB_ROW"
}
```

## Canonical serialization (`CANON_JSON_V1`)

- UTF-8 bytes
- NFC-normalized strings
- Lexicographically sorted object keys at every object depth
- No insignificant whitespace
- Integers encoded as JSON integers (not strings)
- SHA-256 over canonical JSON bytes

## Excluded from disease identity (provenance/content only)

The following MUST NOT affect the permanent disease canonical ID:

- DB/extract SHA
- dataset/bundle version
- source namespace / source code / raw code
- display names / aliases / symptoms
- quarantine flags
- mapped links / relationship state
- polarity / Rx fields
- row ordering / timestamps

A source-code correction, display correction, quarantine update, bundle update, or evidence-hash update MUST NOT remint disease IDs.

## Legacy anchor

- `legacyDbDiseaseId` is a positive decimal integer under fixed authority `EHAS2_PINNED_LEGACY_DISEASE_DB_V1`.
- It is provenance only; it MUST NOT be exposed as the global canonical ID.
- Different legacy integer IDs MUST produce different canonical inputs.

## Collision policy

Any digest collision between different canonical inputs MUST hard-fail. No random suffix, no silent merge.

## Future scope

Diseases not originating from the pinned legacy authority require a separately versioned identity algorithm/policy.

## Golden vector (synthetic)

Canonical JSON for `legacyDbDiseaseId = 1`:

```json
{"algorithm":"EHAS2_CANONICAL_DISEASE_ID_v1_SHA256","legacyAuthority":"EHAS2_PINNED_LEGACY_DISEASE_DB_V1","legacyDbDiseaseId":1,"recordKind":"LEGACY_DB_ROW"}
```

Expected ID:

`ehas2-dis-v1-fcfbec7dd5bfa19f222e0b34f87646fac544ada69a73404d9ede051eb51388f5`
