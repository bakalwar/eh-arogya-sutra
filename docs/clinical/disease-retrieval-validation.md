# Disease retrieval validation (Phase 5C)

## Package interface

- Load only via `disease_package.load_disease_package`  
- Full local artifact: count **116284**, SHA-256 Phase 5B manifest  
- CI synthetic: `fixtures/synthetic/clinical/disease-package-tiny` (11 rows) — **separate**  
- `require_full=True` never falls back to synthetic  
- Old-project SQLite / folder paths rejected  

## Behaviours validated

- Hindi / English / Hinglish normalization  
- Alias / hinglish map (minimal, explicit)  
- Chief-complaint preservation  
- Negation handling  
- Multi-candidate ranking (`forced_top1: false`)  
- No-match → empty candidates + Rule 6 `UNRESOLVED`  
- Noise token down-rank (gene / virus / equine / chromosome)  
- No cross-case contamination (independent fingerprints)  

## Gates

| Gate | Result |
|------|--------|
| No forced top-1 | PASS |
| No silent synthetic fallback for full | PASS |
| Old runtime path forbidden | PASS |
| Multi-system beyond five preserved | PASS |
