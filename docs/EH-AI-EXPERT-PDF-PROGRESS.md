# EH AI Expert — PDF Blueprint Progress

Source: `EH_AI_Expert_Complete_Cursor.pdf` (26 pages) + **`EH_AI_Expert_Complete_Cursor-2.pdf`** (19 pages — anatomy DB)  
Extract: `docs/_eh_ai_expert_pdf_extract.txt`

## Overall

| Done | Total | % |
|------|-------|---|
| **20** | **21** | **~95%** |

---

## Step checklist (PDF order)

| Step | PDF section | Status | Notes |
|------|-------------|--------|-------|
| 1 | §2 Database (4 tables + seed) | ✅ Done | `013_eh_expert_knowledge_graph.sql` + Python `knowledge.py` |
| 2 | §3 Face engine (OpenCV/MediaPipe) | ✅ Done | `eh-expert-engine/app/engines/cv_engine.py` |
| 3 | §4 OCR (Tesseract + SciSpaCy) | ✅ Done | `eh-expert-engine/app/engines/ocr_engine.py` |
| 4 | §5 Dynamic rule engine (DB formulas) | ✅ Done | `eh-expert-engine/app/services/rule_engine.py` |
| 5 | §6 Ollama + 11-section fallback | ✅ Done | `llm_engine.py` + `clinical_summary.py` |
| 6 | §7 FastAPI `/analyze/complete` | ✅ Done | `eh-expert-engine/app/main.py` |
| 7 | §8 React `PatientAnalyze` UI | ✅ Done | `SearchEngine.jsx` (EH theme) |
| 8 | §8 Result (formula + summary) | ✅ Done | `SearchResult.jsx` — A/B/C/D + 11-section |
| 9 | Node API proxy `/api/search/*` | ✅ Done | `searchEngine.js` + `pdfExpertMapper.js` |
| 10 | App routes + nav | ✅ Done | `App.jsx` `/search` + `/search/result` |
| 11 | §9 Startup docs | ✅ Done | `EH-EXPERT-RUNBOOK.md`, `npm run expert-engine` |
| 12 | Prescription save API | ✅ Done | `POST /api/search/save-prescription` + Result UI |
| 13 | PDF print / ReportLab | ⏳ Pending | Optional — `window.print()` on Result |
| 14 | Test case (PDF p.26) | ✅ Done | Demo button + `npm run smoke:pdf-expert` |
| 15 | Progress UI on search page | ✅ Done | Stack status banner |
| 16 | Session storage v2 | ✅ Done | `eh_smart_search_pdf_v1` |
| 17 | NewCase → search flow | ✅ Done | `NewCase.jsx` → `/search` + draft merge |
| 18 | E2E smoke script | ✅ Done | `npm run smoke:pdf-expert` |
| 19 | PDF-2 `ehAnatomyPathology.js` | ✅ Done | `backend/data/ehAnatomyPathology.js` |
| 20 | Organ detect + lab table in §3 | ✅ Done | `backend/utils/ehOrganDetect.js` + `clinicalFallbackSeven.js` |
| 21 | SearchEngine demos (joint + cold) | ✅ Done | `SearchEngine.jsx` — summary **7-खंड** (same as live UI) |

**Legend:** ✅ Done · 🔄 In progress · ⏳ Pending

### PDF-2 vs live summary structure

| PDF-2 spec | Live app (locked) |
|------------|-------------------|
| 11-section Ollama template | **7-खंड rule-engine** (`clinicalFallbackSeven.js`) — जो अभी UI में दिखता है |
| Anatomy DB in §3 | ✅ ORGAN_EH_MAP injected in §3 |
| Lab EH table | ✅ `analyzeLabReports` in §3 |
| Medicine anatomy in §4 | ✅ `getMedicineReasoning` + book RAG |

---

## What you need running

```bash
# Terminal 1
npm run dev

# Terminal 2
npm run expert-engine

# Optional — faster summary
ollama serve
ollama pull llama3.2:3b
```

---

## Remaining (1 step)

1. **ReportLab PDF export** (optional — browser Print works today)  
2. **Product choice:** 7-section Node rule vs 11-section Python/Ollama display toggle
