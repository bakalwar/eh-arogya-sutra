# Phase F separation (Phase 5A)

## Principle

**Phase F is presentation-only.** It must never invent diseases or medicines. Clinical selection belongs to the clinical engine.

## Phase F / presentation files (old project)

| Path | Role |
|------|------|
| `eh-api/core/professional_summary_renderer.py` | Phase F builder (`phase_f_professional_summary_v1`) |
| `eh-api/core/summary_engine.py` | Attaches post-prescription payload / may replace clean summary text |
| `eh-api/core/clinical_explanation_engine.py` | Explanations |
| `eh-api/core/formula_explanation_builder.py` | Formula explanations |
| `eh-api/core/clean_clinical_presentation.py` | Clean presentation |
| `eh-api/clinical_administration/final_clinical_prescription.py` | RX-SCHEDULE-7 text shell |
| `next-app/src/components/PhaseFProfessionalReportView.tsx` | UI |
| `next-app/src/lib/phaseFProfessionalSummary.ts` | Client model |
| `next-app/src/lib/phaseFPresentationNormalizer.ts` | Normalizer |
| `next-app/src/lib/presentationGate.ts` | Reliability gate |

## Inputs / outputs

| Direction | Content |
|-----------|---------|
| Inputs | Finalized mixtures, tablet_prescription, external_routes, patient/systems metadata |
| Outputs | `professional_clinical_summary` (+ explanation sections) |
| Replacement point | After Rx finalization — may replace ASCII/clean summary **text** |

## Must NOT migrate into clinical authority package

- Phase F renderer / Next presentation adapters  
- Dark report CSS skins  
- Explanation copy generators  
- Any mapper that “fills” missing medicines for display  

## Must remain clinical authority

- `MultiDiseaseEngine` + scoring / potency / electricity / external / tablet selection  
- Medicine registry + disease search  

## EHAS2 stance (Phase 5A)

- Phase F: **NOT_SELECTED** for migration into clinical packages  
- Preview status page records Phase F as NOT_SELECTED  
- Future summary renderer consumes frozen clinical result JSON only
