# EH Electricity + Formula — Done

Source: `EH_Electricity_Formula_Cursor.docx` → `docs/EH_Electricity_Formula_Cursor.extracted.txt`

## Implemented

| Component | Location |
|-----------|----------|
| `ELECTRICITY_DB` (5 colours + prakriti) | `backend/services/ehSourceOfTruthClinical.js` |
| `selectElectricityForFormula()` | same — rog-first rules |
| `buildFormulasWithElectricity()` | same — **BE/RE/GE/WE/YE inside Mishran A** |
| `buildClinicalData()` | uses `buildFormulasWithElectricity` |
| `syncFormulaElectricity()` | `backend/services/potencyEngine.js` — keeps elec in **formula_a**, D3 malam only in **formula_d** |
| Summary prompts | `ehOllamaCompleteSummary.js`, `ehCompleteFallbackSummary.js` |

## Electricity rules

| Code | Prakriti | When |
|------|----------|------|
| **B.E.** | NEGATIVE | BP ≥140, heart, HYPER |
| **R.E.** | POSITIVE | HYPO, kamzori, HB &lt;10, BP &lt;90 |
| **G.E.** | NEUTRAL | joints, uric, kidney, sujan |
| **W.E.** | CALM | anxiety, neend, chakkar |
| **Y.E.** | STIMULATE | fever, lung, khansi |

## UI / console

```
Electricity : B.E. (NEGATIVE (ऋणात्मक))
Formula A : A1 + A2 + A3 + BE D10
Malam D : BE D3
```

## Test

```bash
node scripts/test-electricity-formula.js
```

Restart `npm run dev` and **Re-Analyze** on Search.
