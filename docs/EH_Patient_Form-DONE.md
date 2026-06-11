# EH Patient Form — Done

Source: `EH_Patient_Form_Cursor.docx`

## Frontend

- **`frontend/src/pages/PatientAnalysisForm.jsx`** — full form (name, mobile, vitals, symptoms, organs, 9 labs, report text, file upload)
- Route **`/search`** → `PatientAnalysisForm`
- **`SearchResult.jsx`** — patient name + age in header bar

## Backend

- **`/api/search/analyze`** — accepts `report_values`, `affected_organs`, `phase`, `blood_report`, `mri_report`, `sonography`, `pulse`, `mobile`
- **`/api/search/analyze-complete`** — same fields via FormData
- **`pdfExpertMapper` / `summaryCaseAdapter`** — pass labs + reports into summary engine

## Flow

1. Fill form → **ANALYZE**
2. `analyze` → formula on **Search Result**
3. Summary loads via existing `/api/summary/expert-clinical`

## Optional

- **New Case** (`/case/new`) still registers patient; open **Search** for analysis with pre-filled name from navigation state.
