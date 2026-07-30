# Disease search lineage (Phase 5A)

**Primary code (old):** `eh-api/core/integrated_engine.py`  
**API:** `GET /api/v3/search` in `eh-api/eh_api.py`  
**Audit prior art:** `docs/full-system-audit/05_SEARCH_DISEASE_AUDIT.md`

## Pipeline stages (observed)

| Stage | Mechanism | Verdict |
|-------|-----------|---------|
| Input normalization | Hinglish normalizer + lowercasing | PROVEN |
| Hindi/English | FTS both languages; multilingual embeddings | PROVEN |
| Alias expansion | Code maps / anatomical patterns — **no DB alias table** | PARTIAL |
| Exact / FTS | FTS5 phrase then prefix; limit ~30 | PROVEN |
| Fuzzy (trigram/Fuse in this DB path) | Not in hybrid SQLite path | NOT_FOUND |
| Vector | sqlite-vec k≈30 cosine | PROVEN |
| Ranking | RRF `1/(60+rank)` FTS+vec | PROVEN |
| Top-k | hybrid default 5 (API max 10); detect_systems often k=3 | PROVEN |
| Junk / ghost filter | `ghost_disease_filter.py` + gender gates | PROVEN |
| Organ anchoring | anatomical anchors + chief-complaint north star | PROVEN |
| Multi-disease | `multi_disease_engine.py` merges hybrid + plans | PROVEN |
| Confidence thresholds | e.g. MIN_HYBRID_SCORE≈0.015; treatment≈0.06 | PROVEN |
| No-match | empty → []; systems may UNRESOLVED | PROVEN |

## Historical problems (documented / observed)

| Problem | Status |
|---------|--------|
| Ghost / semantic-neighbour hits | PROVEN (filter exists because of this) |
| DB name often not the treatment label | PROVEN in search audits |
| Global symptom leakage into medicine scoring | PROVEN in prior P4D audits |
| Top-1 silent misclassification risk | PARTIAL |
| Gene/rare-ontology / animal noise | PARTIAL (corpus quality) |
| CSV-corrupt titles in FTS/vec | PROVEN (amplifies junk) |
| Report findings not affecting prescription | PARTIAL — findings prepared but not merged into `MDE.analyze` (see multimodal audit) |
| Five-system / CC dominance conflicts | documented historically | PARTIAL |

## Recommended EHAS2 search boundary (design only — not implemented)

```
normalize(HI/EN/Hinglish)
  → alias expand (versioned pack)
  → exact → FTS → optional fuzzy → vector
  → RRF + organ/system prior from CC/anchors
  → hard junk gates (corrupt / non-human / ghost / gender)
  → return top-k≥5 with scores + reject reasons
  → never silent top-1
  → never read consultations table
  → medicine scoring remains slot-scoped (no full-case leakage)
```

Service home: `services/disease-search/` consuming **disease knowledge pack only**.
