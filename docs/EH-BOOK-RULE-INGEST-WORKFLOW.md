# Textbook ingest → final dynamic rules (Dr. Sahib workflow)

## Phase 1 — Ingest only (current)

**Dr. Sahib is now extracting text page-by-page from the printed book** → drop files in `backend/book/extracted/incoming_batch/` → `npm run ingest:book-batch` (only new/changed; README skipped).

**File naming:** prefer real book page numbers (`page_0045.txt` = page 45). Chat batch `page_9001`–`9008` remains in `doctor_supplied/`.

1. **Seed rules** (Count Mattei core laws) run from `backend/data/dynamicEhRules.default.json` — no Ollama needed.
2. **Add pages** as they arrive:
   - **Folder batch:** `backend/book/extracted/incoming_batch/page_9010.txt` … then `npm run ingest:book-batch`
   - **Status:** `npm run ingest:book-status`
   - **API (admin):** `POST /api/book-rag/ingest-page` `{ page_number, text }`
   - **API batch:** `POST /api/book-rag/ingest-batch` `{ pages: [{ page_number, text }] }`
3. **Rebuild index** (batch script does this automatically): `POST /api/book-rag/rebuild-index`
4. **Toggle rules** in Admin → **Clinical Rules** (`/admin/clinical-rules`) without editing JSON.

**Ollama full extraction is OFF by default** (`EH_RULE_EXTRACT_ALLOW` unset or `0`).

## Phase 2 — After all chapters are in the RAG index

1. Confirm stats: `GET /api/book-rag/rule-extract-status` (admin) — check `bookChunks` / `bookPageFiles`.
2. In `.env` set:
   ```env
   EH_RULE_EXTRACT_ALLOW=1
   ```
3. Restart backend (`npm run dev`).
4. Run **once** (full book context):
   - Admin UI → **Extract from book (Ollama)**, or
   - `npm run extract:eh-rules -- "पूर्ण पुस्तक विद्युत पोटेंसी ध्रुवता"`
5. Review / enable rules in **Clinical Rules** panel.

## Optional flags

| Variable | Default | Meaning |
|----------|---------|---------|
| `EH_RULE_EXTRACT_ALLOW` | `0` | `1` = allow generate-rules / CLI extract |
| `EH_AUTO_EXTRACT_RULES` | off | Auto-extract on each ingest-page (only if allow=1) |

## Privacy

All ingest and Ollama calls stay **local** (`127.0.0.1`). No patient or book data sent to cloud APIs.
