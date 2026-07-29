# PHASE 1C-B — Route matrix

| Route | Purpose | Auth | Notes |
|-------|---------|------|-------|
| `/patients` | Patient list | None (future Phase 2) | Synthetic list |
| `/patients/[patientId]` | Patient detail | None | `syn-patient-*` only |
| `/patients/[patientId]/history` | History timeline | None | Prescription links → 1C-C |
| `/cases/new` | New case steps | None | `?step=` + `?patient=` |
| `/cases/new/reports` | Report selection | None | In-memory files only |
| `/cases/new/review` | Case review | None | No disease/medicine output |
| `/cases/[caseId]/analysis` | Analysis pending | None | `preview-case-*` / `syn-case-*` |

Future auth guard: protect `/patients` and `/cases/*` after Phase 2. No `/ops` links.
