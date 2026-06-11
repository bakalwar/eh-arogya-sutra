# EH Phase 2 — Book → JSON Mapping — DONE

Source: `EH_Phase2_RuleExtract_Cursor-2.docx`

## Flow

```
book/extracted/doctor_supplied/page_*.txt
book/extracted/pages_text/
book/extracted/local_vector_index.json (RAG)
        ↓
bookToJsonMapper.js + Ollama
        ↓
backend/data/medicine_knowledge_base.json
        ↓
knowledgeBasedSelector.js → rule engine
```

## Commands

```bash
# Terminal 1
ollama serve

# Terminal 2 — full run (~30–40 min for 37 medicines)
npm run map:book

# Single medicine test
npm run map:book:one

# Fast catalog JSON (no Ollama)
npm run build:medicine-kb
```

## Verify

```bash
node -e "const db=require('./backend/data/medicine_knowledge_base.json'); console.log('count',Object.keys(db.medicines).length); console.log('S-6',db.medicines['S-6']?.mapping_rules?.[0]?.condition);"
```

## Env

| Variable | Default |
|----------|---------|
| `EH_MAP_DELAY_MS` | 2000 |
| `EH_MAP_TIMEOUT_MS` | **600000** (10 min; uses `EH_OLLAMA_DOCTOR_TIMEOUT_MS` if set) |
| `EH_MAP_RETRIES` | 2 (extra 2 min per retry) |
| `EH_MAP_BOOK_CHARS` | 3200 |
| `EH_MAP_NUM_PREDICT` | 900 |
| `EH_MAP_OLLAMA_MODEL` | llama3.2:3b |
| `EH_USE_KNOWLEDGE_BASE` | on (not `0`) |

**Timeout fix:** CPU par 120s kam padta tha → ab default 10 min + retry. Purani run band karke dubara `npm run map:book`.

## Notes

- Skips medicines already `source: book-extracted` with ≥2 rules (use `--force` to redo)
- No book text → `catalog-fallback` from `buildMedicineKnowledgeBase.js`
- Rule engine uses this file when `EH_USE_KNOWLEDGE_BASE` is enabled
