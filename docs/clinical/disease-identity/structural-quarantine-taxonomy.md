# R2-DATA-P2B — Structural Quarantine Taxonomy (v1)

Automatic quarantine flags are **structural only** in P2B v1.

## Allowed automatic flags

| Flag | Trigger |
|------|---------|
| `Q_IDENTITY_INVALID_NAMESPACE` | Unknown/empty namespace |
| `Q_IDENTITY_INVALID_CODE` | Empty/invalid code |
| `Q_IDENTITY_NORMALIZATION_COLLISION` | Incompatible raw codes share normalized key |
| `Q_DISPLAY_CSV_STRUCT_CORRUPT` | Proven mechanical CSV structural corruption in display field |
| `Q_DISPLAY_EMPTY` | Both English and Hindi display empty |
| `Q_REL_EXACT_MULTIPLE` | Bridge disposition EXACT_MULTIPLE |
| `Q_REL_OWNER_REVIEW` | Bridge disposition OWNER_REVIEW |
| `Q_REL_NO_DB_MATCH` | Bridge disposition NO_MATCH |
| `Q_REL_DB_UNLINKED` | DB-only / unlinked legacy row |
| `Q_REL_DB_CODE_WITHOUT_MAPPED_PARENT` | DB code without mapped bridge parent |
| `Q_MAPPED_UNNORMALIZABLE_RAW` | Mapped row cannot be normalized |

## Semantic suitability

- `reviewRequiredUnclassified` defaults to **false** in P2B v1.
- Semantic content suitability is `REVIEW_REQUIRED_UNCLASSIFIED` for manual/future review only.
- **No** automatic clinical/noise inference is authorized.
- **No** keyword lists (gene, virus, chromosome, equine, etc.) may assign quarantine.

## Fail-closed records

Records with blocking structural flags MUST NOT be silently linked or promoted to primary candidates.

Blocking flags include: invalid namespace/code, normalization collision, EXACT_MULTIPLE, OWNER_REVIEW, NO_MATCH, unnormalizable mapped raw.
