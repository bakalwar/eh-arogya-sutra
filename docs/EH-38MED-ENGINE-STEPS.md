# EH 38Med Engine Fix — implemented

Source: `docs/EH_38Med_Engine_Fix.docx`

## Files

| File | Role |
|------|------|
| `backend/services/generateClinicalSummary.js` | 7-section Hindi, 4 rules, Ollama + fallback |
| `backend/models/bookModel.js` | `get38MedicinesBySymptoms()` from `book/extracted/*.json` |
| `backend/services/summaryEngine.js` | Sync shim → `buildFallbackSummary` |
| `backend/services/expertClinicalSummaryService.js` | Rule path uses 38Med engine; no book pages in summary |

## Rules

1. Pure Hindi Devanagari  
2. Formula: `S10 + A3 + YE D10` (potency once at end)  
3. ACUTE/POSITIVE → D10; CHRONIC/NEGATIVE → D3/D4  
4. No book name / page in output  

## Env

- `EH_EXPERT_SUMMARY_MODE=rule` — fast fallback (default)  
- `EH_EXPERT_SUMMARY_MODE=ollama` or `EH_38MED_SUMMARY_OLLAMA=1` — try `llama3.2:3b`  
- `OLLAMA_MODEL=llama3.2:3b`  

## Test

```bash
npm run smoke:summary
```
