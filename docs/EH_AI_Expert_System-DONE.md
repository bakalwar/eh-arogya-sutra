# EH AI Expert System — DONE

Source: `docs/EH_AI_Expert_System.pdf` (Count Cesare Mattei EH principles)

## Principle
**डॉक्टर की दी गई जानकारी** (नाम, BP, नाड़ी, लक्षण, अंग, लैब) → Temperament → Polarity → Electricity → Mishran A/B/C/D — **किसी एक रोग की हार्डकोड सूची नहीं**।

## Implementation

| Component | File |
|-----------|------|
| Rule engine v4 (pool scoring) | `backend/services/ehSourceOfTruthClinical.js` → `pickMedicinesFromDoctorInput()` |
| Default path | `EH_USE_MEDICINE_KNOWLEDGE` **off** unless `=1` in `.env` |
| Ollama EH विशेषज्ञ prompt | `backend/services/ollamaBookDoctorSummary.js` → `EH_SYSTEM_SEVEN` |
| Header = Formula electricity | `expertClinicalSummaryService.js` + `generateClinicalSummary.js` |

## Flow
1. **Temperament** — `[TEMP] S/L/N` scores from vitals + symptoms + labs  
2. **Polarity** — `[POL] HYPER/HYPO` → D10/D30/D4/D3  
3. **Electricity** — uric/joint → **G.E.** before BP-high **B.E.** when labs/symptoms dominate  
4. **Medicines** — `[MEDS] Top8` from temperament + symptom + organ + report pool  
5. **Formulas** — electricity only in Mishran A; S-7/S-8/S-9 excluded  

## Verify
```bash
node scripts/test-sync-fix.js
node scripts/test-ai-expert-uric.js
```

## Optional
`EH_USE_MEDICINE_KNOWLEDGE=1` — `medicine_knowledge.json` scoring on top of rule engine (Ollama book learn path).
