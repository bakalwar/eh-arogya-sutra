# EH Expert Engine — Runbook (Steps 0–8)

Local CDSS pipeline: **PostgreSQL** → **Python Expert** → **Node API** → **React Smart Search**.

---

## 1. One-time setup

```powershell
# Repo root
copy .env.example .env
# Fill DATABASE_URL or POSTGRES_* in .env

npm install
cd frontend && npm install && cd ..
cd backend && npm install && cd ..

npm run db:schema
npm run seed:postgres

cd eh-expert-engine
py -m pip install -r requirements.txt
py -m pip install mediapipe colorthief
cd ..
```

**Optional:** SciSpaCy model, Tesseract (Hindi+English), Ollama:

```powershell
pip install https://s3-us-west-2.amazonaws.com/ai2-s3-scispacy/releases/v0.5.4/en_core_sci_sm-0.5.4.tar.gz
ollama pull llama3.2:3b
```

**Book data (optional):**

```powershell
# Place PDF at book/eh_arogya_sutra.pdf
npm run extract:book
npm run load:book-extracted
```

---

## 2. Daily dev (3 terminals)

| Terminal | Command | Port |
|----------|---------|------|
| 1 | `npm run dev` | 5000 API, 5173 Vite |
| 2 | `npm run expert-engine` | 8001 Python |
| 3 | `ollama serve` | 11434 (optional) |

**Health check:**

```powershell
npm run expert:health
```

---

## 3. Environment (`.env`)

| Variable | Default | Purpose |
|----------|---------|---------|
| `DATABASE_URL` | — | PostgreSQL (required) |
| `EH_EXPERT_ENGINE_URL` | `http://127.0.0.1:8001` | Python FastAPI |
| `EH_EXPERT_TIMEOUT_MS` | `90000` | Analyze timeout |
| `EH_EXPERT_OCR` | `1` | `0` = skip Expert OCR on report upload |
| `OLLAMA_URL` | `http://127.0.0.1:11434` | Use **127.0.0.1** on Windows |
| `OLLAMA_MODEL` | `llama3.2:3b` | 11-section summary |
| `OLLAMA_ENABLED` | `1` | `0` = disable Ollama |
| `OLLAMA_EXPERT_CLINICAL_TIMEOUT_MS` | `400000` | Step 3.4 summary |
| `TESSERACT_LANG` | `hin+eng` | Report OCR |

---

## 4. API map

### Python (direct) — `http://127.0.0.1:8001`

| Endpoint | Step |
|----------|------|
| `GET /health` | Wiring |
| `POST /v1/expert/analyze` | Formula A–D |
| `POST /v1/expert/analyze-complete` | **All-in-one** |
| `POST /v1/expert/analyze-face` | Face |
| `POST /v1/expert/ocr-report` | Report OCR |
| `POST /v1/expert/summary` | Summary (`prompt_style: eleven_section`) |

### Node proxy — `http://127.0.0.1:5000/api/expert`

Same paths under `/api/expert/*` (multipart supported).

### Smart Search — `http://127.0.0.1:5000/api/search`

| Endpoint | Use |
|----------|-----|
| `POST /analyze` | JSON body (legacy flow) |
| `POST /analyze-complete` | Multipart face + report + summary |

### Summary

| Endpoint | Use |
|----------|-----|
| `POST /api/summary/expert-clinical` | 11-section Hindi (needs `expert.ok`) |

---

## 5. User flow (doctor)

1. Open **http://127.0.0.1:5173/search**
2. Patient details + clinical notes
3. Optional: face photo + medical report PDF/image
4. **Analyze** → Formula A–D on result page
5. **Generate 11-Section Clinical Summary** (Ollama or instant rule fallback)
6. Save prescription

If face or report file uploaded → **complete pipeline** runs automatically (`/api/search/analyze-complete`).

---

## 6. Troubleshooting

| Problem | Fix |
|---------|-----|
| Expert analyze 503 | `npm run expert-engine` |
| Ollama fetch failed | `OLLAMA_URL=http://127.0.0.1:11434`, run `ollama serve` |
| Empty formula | `npm run db:schema`, check `DATABASE_URL` |
| OCR empty | Install [Tesseract](https://github.com/tesseract-ocr/tesseract) + `hin` traineddata |
| Face not detected | Good lighting; MediaPipe model auto-downloads first run |
| Summary too short | Increase `OLLAMA_EXPERT_NUM_PREDICT`; or rule fallback is OK |

---

## 7. Migrations applied

- `013_eh_expert_knowledge_graph.sql` — anatomy, groups, potency, electricity
- `014_eh_materia_medica.sql` — per-medicine rows + seeds

---

## 8. Hub & agent status

```powershell
npm run open:eh-hub
npm run agent:now -- "Step 8 runbook ready"
```

---

*E.H. AROGYA SUTRA CLINIC — AI Suggests, Doctor Decides.*
