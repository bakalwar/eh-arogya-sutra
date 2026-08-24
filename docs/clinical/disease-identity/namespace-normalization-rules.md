# R2-DATA-P2B — Namespace Normalization Rules

Presentation-safe normalization only. No fuzzy matching, no display-name matching, no AI, no cross-namespace inference.

## Supported canonical namespaces

`ICD10`, `OMIM`, `ORPHANET`, `MESH`

Source labels map case-insensitively to these namespaces (synthetic engineering labels only in fixtures).

## Rules

| Step | Rule |
|------|------|
| Trim | Remove outer whitespace |
| Unicode | NFC-normalize all strings |
| Leading zeroes | Preserve meaningful leading zeroes in codes |
| ICD10 | Uppercase; retain meaningful internal punctuation |
| OMIM | Remove optional documented prefix `OMIM:` only |
| ORPHANET | Remove optional documented prefix `ORPHA:` only |
| MESH | Remove optional documented prefix `MESH:` only; uppercase descriptor |

## Presentation variants (same mapped index ID)

Examples (synthetic):

- `OMIM:600001` and `600001`
- `MESH:D012345` and `d012345`
- `ORPHA:999` and `999`
- `a00.1` and `A00.1` under ICD10

Raw variants MUST be preserved in `provenanceVariants`.

## Hard-fail conditions

- Unknown / empty namespace label → `INVALID_NAMESPACE`
- Empty code after trim → `INVALID_CODE`
- Field length > 512 → bounded fail-closed
- Normalization collision (same normalized key incorrectly shared by incompatible raw codes) → hard-fail

## Explicitly prohibited

- Fuzzy or phonetic matching
- Display-name or alias matching
- Cross-namespace code inference
- Semantic keyword classification
