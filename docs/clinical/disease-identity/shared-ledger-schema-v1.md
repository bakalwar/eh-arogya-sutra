# R2-DATA-P2B — Shared Disease Identity Ledger Schema (v1)

**Schema version:** `ehas2-disease-identity-ledger-v1`  
**Dataset version:** `ehas2-disease-identity-v1`  
**Authority classification:** `ENGINEERING_IDENTITY_ONLY`

## Disease ledger row (`LEGACY_DB_ROW`)

Required fields:

- `ehas2DiseaseId` — canonical disease ID (`ehas2-dis-v1-{64 hex}`)
- `ledgerSchemaVersion`
- `recordKind`: `LEGACY_DB_ROW`
- `legacyAuthority`: `EHAS2_PINNED_LEGACY_DISEASE_DB_V1`
- `legacyDbDiseaseId` — positive integer provenance anchor
- `sourceNamespace` / `sourceCode` / `normalizedIdentityKey` — nullable content fields
- `relationshipState`
- `bridgeDisposition` — nullable
- `mappedIndexRefs` — array of mapped index IDs (may be empty)
- `candidateLegacyDbIds` — ascending integers; multiple candidates allowed; **no primary field**
- `quarantineFlags` — structural only
- `reviewRequiredUnclassified` — boolean, default false in v1
- `provenance` — engineering metadata (dataset version, authority classification)
- `recordFingerprint` — SHA-256 of stable content fields excluding IDs/fingerprint
- `lifecycleStatus` — engineering lifecycle marker

## Mapped index row

- `ehas2MappedIndexId` — nullable canonical mapped ID
- `rawMappedReferenceId` — nullable traceability ref for unnormalizable rows
- `mappedCodeRaw`, `mappedSourceLabel` — provenance
- `provenanceVariants` — raw presentation history
- `linkedEhas2DiseaseIds` — may be empty under fail-closed dispositions
- `candidateLegacyDbIds` — ascending, no default primary

## Prohibited fields (hard reject)

Polarity, medicine, formula, potency, electricity, dosage, Rx/prescription, patient/PHI fields — see `@ehas2/disease-identity` `PROHIBITED_RECORD_FIELDS`.

## Shared ledger reference (ID-05)

Disease packages MUST reference the shared canonical disease identity ledger by ID and manifest hash in a future phase. P2B v1 defines schema/types only; no runtime loader wiring.

## Approved aggregate reconciliation keys

Manifest reconciliation MUST match owner-approved counts in `APPROVED_AGGREGATE_COUNTS` (116,284 DB rows, 50,544 mapped unique codes, bridge dispositions, 18,103 DB-only, 12,634 DB codes without mapped parent, 17,438 fail-closed ambiguous mapped codes).
