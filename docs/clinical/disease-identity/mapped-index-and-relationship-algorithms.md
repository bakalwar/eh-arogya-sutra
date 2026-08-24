# R2-DATA-P2B — Mapped Index and Relationship Identity Algorithms

## Mapped index ID

| Field | Value |
|-------|-------|
| Algorithm | `EHAS2_MAPPED_IDENTITY_KEY_v1_SHA256` |
| Output prefix | `ehas2-mdx-v1-` |

### Semantic input (exact fixed keys)

```json
{
  "algorithm": "EHAS2_MAPPED_IDENTITY_KEY_v1_SHA256",
  "recordKind": "MAPPED_CODE_INDEX",
  "sourceCode": "A00.0",
  "sourceNamespace": "ICD10"
}
```

- `sourceCode` and `sourceNamespace` are **normalized** presentation-safe values.
- Raw mapped variants and artifact hashes are provenance only.

### Unnormalizable mapped rows

When namespace/code cannot be normalized, assign traceability ref:

- Algorithm: `EHAS2_UNNORMALIZABLE_MAPPED_RAW_v1_SHA256`
- Prefix: `ehas2-mdx-raw-v1-`
- This is **not** a canonical mapped index ID.

## Relationship ID (optional materialization)

| Field | Value |
|-------|-------|
| Algorithm | `EHAS2_IDENTITY_RELATIONSHIP_v1_SHA256` |
| Output prefix | `ehas2-rel-v1-` |

Deterministic input keys:

- `algorithm`
- `ehas2MappedIndexId`
- `ehas2DiseaseId`
- `relationshipType`

## Golden vector (synthetic)

Mapped canonical JSON for ICD10 `A00.0`:

```json
{"algorithm":"EHAS2_MAPPED_IDENTITY_KEY_v1_SHA256","recordKind":"MAPPED_CODE_INDEX","sourceCode":"A00.0","sourceNamespace":"ICD10"}
```

Expected mapped index ID:

`ehas2-mdx-v1-f417a3e13947abe4de4aaa142002436cbf2bbbc05b05cefeacd18ad1fda68b6a`

## Fail-closed bridge dispositions

| Disposition | Structural quarantine | Resolution |
|-------------|----------------------|------------|
| `EXACT_UNIQUE_MATCH` | none (unless other structural flags) | linked when materialized |
| `EXACT_MULTIPLE_MATCH` | `Q_REL_EXACT_MULTIPLE` | fail-closed, no default primary |
| `OWNER_REVIEW_REQUIRED` | `Q_REL_OWNER_REVIEW` | fail-closed |
| `NO_MATCH` | `Q_REL_NO_DB_MATCH` | remain unlinked |

Approved aggregate counts remain declared in `@ehas2/disease-identity` constants and manifest reconciliation only; real 36 NO_MATCH rows are not loaded in P2B v1.
