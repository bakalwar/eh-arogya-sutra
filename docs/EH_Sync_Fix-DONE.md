# EH Sync Fix — DONE

Source: `EH_Sync_Fix_Cursor.docx`

## Problem
- Header showed **G.E.** but Formula A had **W.E.** (desync)
- Rare meds **S-7, S-8** appeared without symptom match
- Electricity sometimes embedded in medicine lists

## Fixes
| Area | Change |
|------|--------|
| `generateClinicalSummary.js` | Removed BP≤110 rule that forced G.E.→W.E.; pass `electricity` from source-of-truth input |
| `expertClinicalSummaryService.js` | Lock header `masterElectricity` from `eh_clinical.elecCode` after enrich |
| `summaryCaseAdapter.js` | Forward `electricity` / `masterElectricity` into summary input |
| `ehSourceOfTruthClinical.js` | `sujan` → G.E.; strip electricity from knowledge FA before append |
| `knowledgeBasedSelector.js` | Exclude S-7/S-8/S-9 and electricity codes from scoring pool |
| `ollamaBookDoctorSummary.js` | CRITICAL MEDICINE RULES in `EH_SYSTEM_SEVEN` |

## Verify
```bash
node scripts/test-sync-fix.js
```

## Ollama note
`ollama serve` error *"address already in use"* means Ollama is **already running** — no second `serve` needed.
