# Clinical migration architecture (Phase 5A — design only)

**No packages created in this phase** except documentation and a non-clinical preview status page.

## Recommended boundaries

| Boundary | Owns | Does not own |
|----------|------|--------------|
| `apps/clinical-engine/` | Orchestration facade / AnalyzeComplete | UI, OTP, payments |
| `packages/clinical-contracts/` | Versioned request/result schemas, enums | Scoring logic |
| `packages/clinical-data-manifest/` | Dataset/registry/rule version stamps, provenance | Live OCR |
| `packages/medicine-registry/` | Canonical 39 MM | Case logic |
| `services/disease-search/` | Detection/search over disease pack | Rx selection |
| `services/report-processing/` | Encrypted ingest → structured findings → delete | Medicine pick |
| `services/clinical-validation/` | Golden fingerprints, gates | Production mutate |

## Python engine service recommendation

**Keep Python clinical engine as a separate service** (current `eh-api` pattern).  
EHAS2 web/API call it over a versioned internal contract. Do **not** embed scoring in Next/Vite.

## AnalyzeComplete contract (versioned — design)

Request (conceptual):

- `schema_version`
- `engine_version` / `rule_version` / `dataset_version` / `medicine_registry_version`
- patient evidence (structured; no frontend inference)
- optional `findings[]` with confidence/verification
- timeout budget

Result (conceptual):

- clinical status: OK / UNRESOLVED / UNSAFE / ENGINE_ERROR  
- systems, prakriti, polarity  
- `mixtures[3|4|5]` or empty with reason  
- potency + electricity per mixture (no default WE)  
- tablet A/B with empty-slot reasons  
- external routes or NOT_CLINICALLY_INDICATED  
- `warnings[]`, `unresolved[]`  
- `deterministic_fingerprint`  
- echoed version stamps  

## Failure behavior

- Timeout → ENGINE_TIMEOUT (no partial silent Rx)  
- Dataset/registry mismatch → refuse analyze  
- Frontend on failure → show NOT_CONNECTED / error state only  

## Non-negotiables

- No frontend clinical inference  
- No patient tables in disease pack  
- No Phase F inside clinical authority  
- Tablet A/B must eventually use full 39 pool (owner rule) — old prod CONFLICT documented
