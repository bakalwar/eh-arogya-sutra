# Multimodal boundary audit (Phase 5A)

**Orchestrator:** `eh-api/intelligence/engine.py` → `MultiModalEHEngine.run_analysis`

## Observed flow

```
ingest (CC, symptoms, vitals, reports, images)
  → normalize / OCR / interpretation
  → safety.validate
  → _prepare_prescription_inputs (findings-enriched)
  → MultiDiseaseEngine.analyze(analysis_patient_data)
  → build_professional_summary(..., report_lab, photo_result, intelligence_data)
```

### Critical wiring truth

`prescription_inputs` is computed and attached to the intelligence result, but **`analyze()` is invoked with `analysis_patient_data` derived from raw `patient_data` (+ prakriti/duration)** — not the findings-enriched prescription inputs.

Report findings are passed into **summary presentation** (`report_lab`, imaging, photo summary).  
Debug flag `medicine_changed: report_used` can therefore **overstate** prescription influence.

**Verdict:** multimodal → medicine selection influence = **PARTIAL / largely UNPROVEN** for lab/PDF/USG on the live analyze path.

## Influence matrix

| Input | Narrative/UI | Systems/disease ranking | Polarity/prakriti/temperament | Medicine selection | Potency/elec | Tablets | External |
|-------|--------------|-------------------------|-------------------------------|--------------------|--------------|---------|----------|
| Chief complaint | YES | PROVEN | PROVEN | PROVEN | PROVEN | via oral | PROVEN |
| Symptom narrative | YES | PROVEN | PROVEN | PROVEN | PROVEN | via oral | PROVEN |
| Vitals (BP/age) | YES | PARTIAL | PARTIAL | via potency/safety | PROVEN | PARTIAL | BE routes PROVEN |
| Lab / PDF / USG text | PROVEN in summary | UNPROVEN on analyze | UNPROVEN | UNPROVEN | UNPROVEN | UNPROVEN | UNPROVEN |
| Clinical image | PROVEN observations UI | UNPROVEN | PARTIAL (temperament if no doctor value) | UNPROVEN | UNPROVEN | UNPROVEN | UNPROVEN |
| Ordinary patient photograph | presentation / limited phenotype hints | Must **not** claim diagnoses every disease | PARTIAL | UNPROVEN | UNPROVEN | UNPROVEN | UNPROVEN |

## EHAS2 multimodal boundary (design only)

```
temporary encrypted input
  → extraction (OCR/vision) — services/report-processing/
  → structured Finding[] + confidence + verification state
  → clinical engine (explicit merge into AnalyzeComplete evidence)
  → original blob deletion
  → deletion verification audit event
```

Rules:

- No report/image processing in Phase 5A  
- Findings must be versioned structured objects, not free-text leakage into MM scoring  
- Photographs never auto-diagnose arbitrary diseases  
- Frontend never selects medicines from OCR text
