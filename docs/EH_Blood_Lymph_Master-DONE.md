# EH Blood + Lymph Master Prompt — Done

Source: `EH_Blood_Lymph_Master_Prompt-1.docx` → `docs/EH_Blood_Lymph_Master_Prompt.extracted.txt`

## Implemented

| Item | File |
|------|------|
| RAKT/RAS/NERV `detectTemperament` | `backend/services/ehSourceOfTruthClinical.js` |
| `selectMedicinesByTemperament` (A/B/C separate, temperament-first) | same |
| `temperamentBloodLymphHi` + console `Mishran A/B/C` | same |
| `EH_EXPERT_DOCTRINE` Blood/Lymph | same |
| Ollama `EH_SYSTEM` Blood/Lymph sections | `backend/services/ehOllamaCompleteSummary.js` |

## Rules

- **Sanguine** → PRIMARY `A-1, A-2, A-3` (Formula A starts A-Group; `S-1` only in night/support if needed)
- **Lymphatic** → PRIMARY `S-1, S-10, S-5`
- **Formula A ≠ B ≠ C** — `medKey()` dedupe; liver/kidney pool for B only
- Summary must explain **RAKT vs RAS** and why each group was chosen

## Verify locally

```bash
npm run dev
```

Re-Analyze on Search after engine bump. Console shows:

```
[EH Blood/Lymph] scores → RAKT:… RAS:… NERV:…
Mishran A: …
Mishran B: …
Mishran C: …
```

## Test matrix (Node)

```bash
node -e "const {buildClinicalData}=require('./backend/services/ehSourceOfTruthClinical'); ..."
```

| Case | Input | Expected |
|------|-------|----------|
| 1 | BP 180, pulse 95 | Sanguine, A-Group in A, no S-1 in A |
| 2 | Uric 8.5, sujan | Lymphatic, S-Group in A |
| 3 | Any | A∩B empty |
