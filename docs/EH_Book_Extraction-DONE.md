# EH Book Extraction — Done

Source: `EH_Book_Extraction_CursorPrompt-1.docx` → `docs/EH_Book_Extraction_CursorPrompt.extracted.txt`

## Files

| File | Role |
|------|------|
| `backend/scripts/bookMedicineReader.js` | Ollama reads book chunks → `medicine_knowledge.json` |
| `backend/services/knowledgeBasedSelector.js` | Score-based medicine pick from knowledge |
| `backend/data/ehMedicineCatalog.js` | 38 medicines + catalog fallback |
| `backend/data/medicine_knowledge.json` | Auto-seeded on first run; enriched by `learn:medicines` |
| `backend/services/ehSourceOfTruthClinical.js` | Knowledge-first `buildClinicalData()` |

## Commands

```bash
# One-time (~20–30 min, needs ollama serve)
npm run learn:medicines

# Single medicine re-learn
npm run learn:medicines:one

# Quick test
node scripts/test-medicine-knowledge.js
```

## Env

- `EH_USE_MEDICINE_KNOWLEDGE=0` — disable knowledge path (rule engine only)
- `EH_LEARN_MIN_CONFIDENCE=60` — skip re-learn if already ≥60
- `EH_LEARN_DELAY_MS=2000` — pause between Ollama calls

## Flow

1. **Learn:** Book index (`book/extracted/local_vector_index.json`) → chunks per medicine → Ollama JSON → save  
2. **Analyze:** Patient symptoms + labs → score all 38 medicines → Formula A/B/C + electricity  
3. **Fallback:** If no scores, uses Blood/Lymph rule engine

## Expected console (patient uric 8.5)

```
[EH] ✓ Knowledge-based selection
[knowledge] Top medicines:
  S-6: score=...
Formula A : S6 + C4 + GE D30
```
