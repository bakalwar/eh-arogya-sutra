# Disease package schema (Phase 5B)

**Schema version:** `ehas2-disease-schema-v1`  
**Dataset version:** `ehas2-disease-v1`  
**Expected count:** 116,284

## Approved fields (explicit Phase 5A allowlist)

| Field | Meaning |
|-------|---------|
| `id` | Stable disease ID |
| `icd10_code` | ICD-style code when present |
| `name_english` | Canonical English name |
| `name_hindi` | Canonical Hindi name when present |
| `category` | Category metadata |
| `system_key` | Organ/system key |
| `symptoms_en` / `symptoms_hi` | Structured symptom text |
| `prakruti` | Disease-row prakruti knowledge field |
| `base_medicines` | Disease-knowledge medicine hints (not a patient Rx) |
| `base_formula` | Disease-knowledge formula hint (not consultation `formula_json`) |

## Forbidden in package

Consultations, patients, phones, reports, uploads, prescriptions, `formula_json`, credentials, api keys.

## Artifact files

- `diseases.v1.jsonl` — one JSON object per line, ordered by `id`
- `manifest.json` — versions, count, source fingerprint, artifact SHA-256

Full package path policy: `data/clinical-artifacts/disease-package-v1/` (gitignored).
