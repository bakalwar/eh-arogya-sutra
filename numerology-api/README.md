# Constitutional Baseline API (standalone)

Completely separate from `eh-api/` — own folder, own SQLite DB (`numerology.db`), own port **8001**.

Maps patient name → constitutional baseline (Chaldean reduction internally; UI labels only **Constitutional Baseline** / **Constitutional Tendency**).

## Setup

```bash
cd numerology-api
pip install -r requirements.txt
```

## Generate ~14,256 tendency rows (once)

**Offline bootstrap (no API key):**

```bash
python generate_numerology_db.py --templates
```

**Anthropic batches (resume-safe):**

```bash
set ANTHROPIC_API_KEY=your_key
python generate_numerology_db.py
python generate_numerology_db.py --resume
```

Progress checkpoint: `numerology_gen_progress.json`

## Run server

```bash
uvicorn numerology_api:app --port 8001 --reload
```

Or:

```bash
python numerology_api.py
```

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | `{ status, entries }` |
| POST | `/api/baseline` | `{ name, age, gender }` → baseline_text, watch_points |
| POST | `/api/correlation` | baseline + photo dosha/organs → correlation_text |

## Dev stack

Root `npm run dev:restart` starts this alongside Next `:3001`, Node `:5000`, and eh-api `:8005`.

Frontend Report Analysis calls **http://127.0.0.1:8001** directly (not through eh-api).
