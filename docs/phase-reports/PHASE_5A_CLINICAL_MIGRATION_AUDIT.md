# Phase 5A — Clinical engine and data migration forensic audit

## Summary

Read-only forensic audit of old E.H. AROGYA SUTRA clinical assets for future EHAS2 migration. **No clinical code or data was copied.** Phase 4B remains HOLD.

## Preflight

| Gate | Result |
|------|--------|
| New HEAD `1c7b895…` | PASS |
| Branch master / clean tree | PASS |
| Node v20.20.2 | PASS |
| Tests 188 | PASS |
| Vulnerabilities | 0 |
| Old HEAD `b9ec3f6…` | PASS |
| Old DB SHA-256 | PASS unchanged |
| Preview `/preview` | PASS (200 + watermark) |

## Headline findings

| Topic | Verdict |
|-------|---------|
| Nine-rule source | YES (`9-rule-v4.0`) |
| Clean isolated 9 engines | NO — orchestrated MultiDiseaseEngine |
| Canonical pipeline | PARTIAL (naming conflicts; Rule 8 unwired) |
| Disease count | **116,284** PROVEN |
| Patient exclusion boundary | PASS (consultations 1862 must stay out) |
| Medicine registry | **39** PROVEN (file named MEDICINES_38); SQLite 38 missing C11 |
| Oral 3/4/5 | MATCH |
| No default WE (oral canonical) | MATCH |
| Full-pool Tablet A/B | CONFLICT (production oral-derived) |
| Multimodal→Rx | PARTIAL/UNPROVEN for reports on analyze path |
| Phase F | Separated (presentation) |

## Explicit non-claims

- Clinical engine NOT_CONNECTED in EHAS2  
- Disease/medicine packages NOT installed  
- OCR/report processing inactive  
- No patient data used  
- Phase 4B HOLD  
- No deployment  

## Preview

Local-only: `http://127.0.0.1:4101/preview/clinical-integration-status`

## Artifacts

See `docs/clinical/*` and `PHASE_5A_FINAL_MANIFEST.md`.  
Raw probes: `%TEMP%\ehas2_phase5a_clinical_audit\`
