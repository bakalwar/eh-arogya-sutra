# EH Summary 7-Section — Done

Source: `EH_Summary_7Section-2.docx` → `docs/EH_Summary_7Section.extracted.txt`

## Implemented

| Item | File |
|------|------|
| `selectElectricityForFormula()` — BP low→R.E., high→B.E., W.E. only BP 90–130 + nervous | `ehSourceOfTruthClinical.js` |
| `buildFallbackSummary()` — 7 sections, tables, malam, ~800+ words | `ehSummary7SectionFallback.js` |
| `EH_SYSTEM_SEVEN` doctor brain prompt | `ollamaBookDoctorSummary.js` |
| Ollama + fallback wiring | `ehOllamaCompleteSummary.js`, `expertClinicalSummaryService.js` |

## 7 sections

1. कार्यकारी क्लिनिकल विवरण  
2. प्रकृति एवं रोग विश्लेषण  
3. शारीरिक रोग + जांच table  
4. औषधि सूत्र (+ electricity in A)  
5. पोटेंसी + ध्रुवता  
6. खुराक समय table + 2 malam  
7. आहार + EH सिद्धांत + follow-up  

## Verify

```bash
node -e "const {buildClinicalData}=require('./backend/services/ehSourceOfTruthClinical'); const {buildFallbackSummary}=require('./backend/services/ehSummary7SectionFallback'); const inp={bp_systolic:150,symptoms:[{name:'bp'}]}; const cd=buildClinicalData(inp); console.log(cd.formulas.formula_a.formatted); console.log(buildFallbackSummary(inp,cd).slice(0,200));"
```

Expected: `A1 + A2 + … + BE D10` (not W.E. for HYPER BP).
