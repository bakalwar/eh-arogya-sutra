# Disease dataset audit (Phase 5A)

**Access:** Read-only SQLite (`readonly: true`) via TEMP audit tooling — old project unmodified.  
**File:** `C:\Users\zero error\Desktop\EH_Arogya_Sutra_App\eh-api\data\eh_arogya.db`  
**SHA-256:** `C3FF59F862EAD2559E116CF6A4F629B7259BBD12D73385F299B780F25C4D1154` (**unchanged**)

## Count verification

| Metric | Value | Verdict |
|--------|-------|---------|
| Expected | 116,284 | — |
| `SELECT COUNT(*) FROM diseases` | **116,284** | PROVEN |
| FTS rows `fts_diseases` | 116,284 | PROVEN |
| Vector rowids present | yes (`vec_diseases*`) | PROVEN |

These 116,284 rows are **disease knowledge**, not patient records.

## Schema (`diseases`)

Columns: `id`, `icd10_code`, `name_english`, `category`, `system_key`, `symptoms_en`, `base_medicines`, `prakruti`, `name_hindi`, `symptoms_hi`, `base_formula`.

| Feature | Status |
|---------|--------|
| Stable ID | Integer PK |
| Hindi / English names | `name_hindi`, `name_english` |
| Symptoms HI/EN | present; **77,937** empty `symptoms_en` (~67%) |
| Organ/system | `system_key`, `category` |
| Alias table | **Absent** |
| FTS5 | `fts_diseases` content-synced |
| Vector | sqlite-vec FLOAT[384]; model noted in `integrated_engine.py` as multilingual MiniLM |
| Fuzzy index in DB | Absent |

## Same database contains PHI / clinical records

| Table | Count | Migration |
|-------|-------|-----------|
| `diseases` (+ FTS/vec) | 116,284 | Extract knowledge only |
| `consultations` | **1,862** | **EXCLUDE forever** from disease pack |
| `api_keys` | 1 | EXCLUDE |
| `medicines` | 38 | Separate registry (non-canonical vs MM 39) |
| `potency_rules` | present | Separate clinical config |
| `patients` table | none | — |

## Quality risks (read-only observations)

- Large CSV-parse corruption in many `name_english` values from mid-corpus onward (documented ~71k pattern hits in forensic probe)  
- Animal/virus disease titles exist in the ICD-style corpus  
- No dedicated disease alias table — Hinglish map lives in code  
- Empty symptom fields dominate — search leans on names + embeddings  

## Safe extraction boundary (design)

**Include:** `diseases` rows + rebuild FTS/vec from a cleaned extract (or export indexes only if bit-identical required).  
**Exclude:** `consultations`, `api_keys`, any uploads/reports, phone numbers, patient names, credentials, prescription blobs.

Recommended EHAS2 artifact:

1. Content-addressed disease pack keyed by extract SHA + `dataset_version`  
2. Quarantine flags: `raw_ok` / `csv_corrupt` / `non_human_candidate`  
3. Sibling alias pack (new) — not present today  
4. Never version the whole mixed SQLite file as “knowledge”

## Dataset-version strategy

```
disease_dataset_version = ehas2-disease-v1 + sha256(<extract>)
embedding_model = paraphrase-multilingual-MiniLM-L12-v2 (pin name + dim)
fts_schema_version = fts5-v1
```

Clinical AnalyzeComplete responses must echo `dataset_version`.
