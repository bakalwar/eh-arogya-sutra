# EH Complete Engine — Step by Step

Source: `docs/EH_Complete_Engine_Final.docx`

## Fix: purana summary dikhna (v3)

- `sessionStorage` purana 11-section / short summary rakhta tha → **version `complete-engine-v3`** se cache invalidate
- Analyze par summary chipkana band — sirf **Result page** par `/api/summary/expert-clinical`
- Dead files delete: `summaryEngine.js`, `ehElevenSectionSummary.js`, `ehSevenSectionSummary.js`, `ClinicalSummaryView.jsx`
- `expertClinicalSummaryService.js` → sirf `generateClinicalSummary.js`

**Browser:** naya search karein ya Result par **सार दोबारा बनाएँ**; purana tab mein F12 → Application → Session Storage → `eh_smart_search_result` delete.

## Flow (Doctor → Summary)

| Step | Function | Output |
|------|----------|--------|
| 1 | `determinePolarity()` | HYPER/HYPO + D10/D3/D30 (score-based) |
| 2 | `determineElectricity()` | BE/GE/RE/WE/YE + body location |
| 3 | `buildFormula()` | `S10 + A3 + BE D10` |
| 4 | `db.get38MedicinesBySymptoms()` | 38 medicines Hindi from JSON |
| 5 | Ollama `llama3.2:3b` | 7-section Hindi (~1000 words) |
| 6 | `normalizeFormulaSpacing()` | `YED10` → `YE D10` |
| 7 | `buildFallbackSummary()` | Full 7 sections if Ollama off/fail |

## Files

- `backend/services/generateClinicalSummary.js` — main engine
- `backend/models/bookModel.js` — 38 medicines DB
- `backend/services/summaryCaseAdapter.js` — adds `report_text` + `report_values`
- `backend/services/expertClinicalSummaryService.js` — API wiring

## Env

```env
EH_EXPERT_SUMMARY_MODE=rule          # fast fallback (default)
EH_EXPERT_SUMMARY_MODE=ollama        # try Ollama
EH_38MED_SUMMARY_OLLAMA=1            # force Ollama in rule mode
OLLAMA_MODEL=llama3.2:3b
OLLAMA_ENABLED=1
```

## Test

```bash
npm run smoke:summary
```

## 4 Rules

1. Pure Hindi Devanagari  
2. Formula: potency once at end  
3. HYPER → D10/D30 | HYPO → D3/D4  
4. No book name / page in output  
