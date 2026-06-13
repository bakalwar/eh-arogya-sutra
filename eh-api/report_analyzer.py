"""
REPORT ANALYZER — EH Arogya Sutra
Combines: OCR + Rules + 9 Engines
FastAPI endpoint: POST /api/v3/analyze-report
Book data is SEPARATE — not mixed here
"""
import os
import json
import re
import shutil
import uuid
from datetime import datetime
from typing import Optional, List
from fastapi import UploadFile, File, Form, Depends, HTTPException
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

# Import our 3 engines
from report_ocr   import process_report_image
from report_rules import (
    classify_lab_values,
    classify_imaging_findings,
    get_combined_systems_and_medicines,
)

# New professional summary engine
try:
    from summary_engine import build_professional_summary
    SUMMARY_ENGINE_V2 = True
    print("[STARTUP] Professional Summary Engine v2 loaded in analyzer.")
except ImportError as e:
    SUMMARY_ENGINE_V2 = False
    print(f"[WARNING] Summary engine not found in analyzer: {e}")

# ═══════════════════════════════════════════════════════
# UPLOAD FOLDER SETUP
# ═══════════════════════════════════════════════════════
UPLOAD_DIR = "data/report_uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

ALLOWED_TYPES = {
    "image/jpeg", "image/jpg", "image/png",
    "image/webp", "image/heic", "image/tiff",
    "application/pdf"
}

MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB — MRI PDFs, high-res clinical photos


# ═══════════════════════════════════════════════════════
# CLINICAL SUMMARY GENERATOR (No AI — Template Based)
# ═══════════════════════════════════════════════════════
SYSTEM_EXPLANATIONS = {
    "RENAL":       "Kidney filtration capacity has reduced.",
    "LIVER":       "Liver detoxification is compromised.",
    "CARDIAC":     "Arterial/venous circulation is imbalanced.",
    "GYNE":        "Pelvic/reproductive system congestion detected.",
    "METABOLIC":   "Constitutional vital energy is depleted.",
    "NEURO":       "Peripheral nerve conduction is impaired.",
    "JOINTS":      "Bone/joint degeneration with inflammation.",
    "RESPIRATORY": "Bronchial/lung airways are congested.",
    "GLANDULAR":   "Lymph node/glandular drainage is stagnant.",
    "GASTRIC":     "Digestive enzyme function is reduced.",
    "FEVER":       "Active infection/inflammation detected.",
    "SKIN":        "Blood toxins overflowing through skin.",
    "CONSTIPATION":"Intestinal peristalsis has slowed down.",
    "PARASITIC":   "Intestinal parasitic load detected.",
}

def build_report_summary(
    patient_name:    str,
    lab_findings:    list,
    imaging_findings:list,
    combined:        dict,
    report_types:    list,
) -> str:
    name        = patient_name or "Patient"
    abnormal_labs = [f for f in lab_findings    if f["badge"]=="ABNORMAL"]
    detected_img  = [f for f in imaging_findings if f["badge"]=="DETECTED"]
    systems       = combined.get("active_systems", [])
    polarity      = combined.get("dominant_polarity", "MIXED")

    lines = [f"REPORT ANALYSIS — {name}",
             f"Date: {datetime.now().strftime('%d/%m/%Y %H:%M')}", ""]

    # Abnormal findings
    if abnormal_labs:
        lines.append("ABNORMAL BLOOD VALUES:")
        for f in abnormal_labs:
            lines.append(
                f"  • {f['parameter']}: {f['value']} {f['unit']} "
                f"[{f['status']}] — {f.get('eh_note','')[:70]}"
            )
        lines.append("")

    if detected_img:
        lines.append("IMAGING FINDINGS:")
        for f in detected_img:
            lines.append(f"  • {f['finding']} detected")
        lines.append("")

    # EH Analysis
    lines.append("EH ANALYSIS:")
    lines.append(f"  Disease Polarity: {polarity}")
    lines.append(f"  Active Systems: {', '.join(systems)}")
    for sys in systems[:3]:
        if sys in SYSTEM_EXPLANATIONS:
            lines.append(f"  → {sys}: {SYSTEM_EXPLANATIONS[sys]}")
    lines.append("")

    # Special notes
    specials = combined.get("special_potencies", [])
    if specials:
        lines.append(f"SPECIAL POTENCY: {', '.join(specials)}")
        lines.append("")

    lines.append(
        "NOTE: Formula will be generated after combining with "
        "patient symptoms and BP via 9 Rule Engines."
    )

    return "\n".join(lines)


# ═══════════════════════════════════════════════════════
# ANALYZE MULTIPLE REPORTS
# ═══════════════════════════════════════════════════════
def analyze_multiple_reports(
    file_paths:  List[str],
    patient_name:str = "Patient",
    gender:      str = "Male",
    age:         int = 40,
) -> dict:
    """
    Multiple report photos → Combined EH analysis
    """
    all_lab_values  = {}
    all_findings    = []
    report_types    = []
    ocr_details     = []

    for fpath in file_paths:
        # Step 1: OCR
        ocr_result = process_report_image(fpath)
        if not ocr_result.get("success"):
            ocr_details.append({
                "file":   os.path.basename(fpath),
                "status": "OCR_FAILED",
                "error":  ocr_result.get("error","Unknown error"),
            })
            continue

        rtype = ocr_result["report_type"]
        report_types.append(rtype)

        # Merge lab values
        for k, v in ocr_result.get("lab_values", {}).items():
            if k not in all_lab_values:
                all_lab_values[k] = v

        # Collect image findings
        all_findings.extend(ocr_result.get("findings", []))

        ocr_details.append({
            "file":        os.path.basename(fpath),
            "report_type": rtype,
            "ocr_method":  ocr_result["ocr_method"],
            "values_found":len(ocr_result.get("lab_values",{})),
            "findings_found":len(ocr_result.get("findings",[])),
        })

    # Step 2: Classify
    lab_classified     = classify_lab_values(all_lab_values, gender, age)
    imaging_classified = classify_imaging_findings(list(set(all_findings)))

    # Step 3: Combine
    combined = get_combined_systems_and_medicines(
        lab_classified, imaging_classified)

    # Step 4: Summary
    summary = build_report_summary(
        patient_name, lab_classified,
        imaging_classified, combined, report_types)

    return {
        "success":           True,
        "reports_processed": len(ocr_details),
        "report_types":      list(set(report_types)),
        "ocr_details":       ocr_details,
        "lab_findings":      lab_classified,
        "imaging_findings":  imaging_classified,
        "combined_analysis": combined,
        "report_summary":    summary,
    }


# ═══════════════════════════════════════════════════════
# FASTAPI ENDPOINT FUNCTION
# (Add this to eh_api.py)
# ═══════════════════════════════════════════════════════
async def _save_uploads(upload_list, session_id: str, prefix: str) -> list:
    paths = []
    if not upload_list:
        return paths
    for file in upload_list:
        ctype = (file.content_type or "").lower()
        fname = (file.filename or "").lower()
        allowed = ctype in ALLOWED_TYPES or fname.endswith(
            (".jpg", ".jpeg", ".png", ".webp", ".heic", ".pdf", ".tif", ".tiff")
        )
        if not allowed and ctype:
            raise HTTPException(
                400,
                f"File type {file.content_type} not allowed. Use: JPEG, PNG, PDF",
            )
        content = await file.read()
        if len(content) > MAX_FILE_SIZE:
            raise HTTPException(400, f"File {file.filename} too large. Max 50MB.")
        safe_name = f"{session_id}_{prefix}_{file.filename or 'upload'}"
        fpath = os.path.join(UPLOAD_DIR, safe_name)
        with open(fpath, "wb") as f:
            f.write(content)
        paths.append(fpath)
    return paths


async def analyze_report_endpoint(
    files:         Optional[List[UploadFile]] = None,
    report_files:  Optional[List[UploadFile]] = None,
    body_photos:   Optional[List[UploadFile]] = None,
    patient_name:  str  = Form("Patient"),
    age:           int  = Form(40),
    gender:        str  = Form("Male"),
    bp_systolic:   int  = Form(120),
    bp_diastolic:  int  = Form(80),
    symptoms:      str  = Form(""),
    condition:     str  = Form("chronic"),
    analysis_mode: str  = Form("auto"),
    output_mode:   str  = Form("full"),
    db:            Session = None,
    key_hash:      str = "",
):
    """
    Dual-mode EH pipeline:
      Mode 1 — photo_temperament: body_photos only → visual temperament engine → 9 Rule Engines
      Mode 2 — medical_report_ocr: report_files → OCR → pathology → 9 Rule Engines
      combined — both paths merged before 9 Rule Engines + summary_engine (500–600 words)
    """
    saved_paths: List[str] = []
    try:
        from photo_temperament import analyze_body_photos

        session_id = str(uuid.uuid4())[:8]

        legacy_reports = list(files or [])
        report_uploads = list(report_files or []) + legacy_reports
        body_uploads = list(body_photos or [])

        report_paths = await _save_uploads(report_uploads, session_id, "report")
        body_paths = await _save_uploads(body_uploads, session_id, "body")
        saved_paths = report_paths + body_paths

        has_reports = len(report_paths) > 0
        has_body = len(body_paths) > 0

        if analysis_mode == "auto":
            if has_body and not has_reports:
                mode = "photo_temperament"
            elif has_reports and not has_body:
                mode = "medical_report_ocr"
            elif has_reports and has_body:
                mode = "combined"
            else:
                mode = "symptoms_only"
        else:
            mode = analysis_mode

        face_analysis = None
        photo_result = None

        # ── Mode 1 / combined: Temperament Engine (body photo) ──
        if has_body:
            try:
                photo_result = analyze_body_photos(body_paths)
                if photo_result.get("success"):
                    face_analysis = photo_result.get("face_analysis")
            except Exception as exc:
                print(f"[analyze-report] body photo analysis failed: {exc}")
                photo_result = {"success": False, "error": str(exc)}

        # ── Mode 2 / combined: OCR Medical Reports Engine ──
        if has_reports:
            report_result = analyze_multiple_reports(
                report_paths, patient_name, gender, age
            )
        elif photo_result and photo_result.get("success"):
            report_result = {
                "success": True,
                "reports_processed": 0,
                "report_types": ["BODY_PHOTO"],
                "ocr_details": [],
                "lab_findings": [],
                "imaging_findings": [],
                "combined_analysis": {
                    "active_systems": photo_result.get("active_systems", ["SKIN"]),
                    "suggested_meds": [],
                    "dominant_polarity": photo_result.get("polarity", "MIXED"),
                    "special_potencies": [],
                    "total_abnormal": 0,
                },
                "report_summary": "Temperament analysis from patient/body photo.",
            }
        else:
            report_result = {
                "success": True,
                "reports_processed": 0,
                "report_types": [],
                "ocr_details": [],
                "lab_findings": [],
                "imaging_findings": [],
                "combined_analysis": {
                    "active_systems": [],
                    "suggested_meds": [],
                    "dominant_polarity": "MIXED",
                    "special_potencies": [],
                    "total_abnormal": 0,
                },
                "report_summary": "No reports uploaded.",
            }

        report_systems = report_result["combined_analysis"].get("active_systems", [])

        combined_symptoms = (symptoms or "").strip()
        if photo_result and photo_result.get("symptoms_enrichment"):
            combined_symptoms = f"{combined_symptoms} {photo_result['symptoms_enrichment']}".strip()
        if report_systems:
            combined_symptoms += " " + " ".join(s.lower() for s in report_systems)

        from clinical_engines import (
            detect_active_systems,
            detect_prakriti,
            detect_polarity,
            select_potency,
            build_formula,
            safety_check,
            calc_dosage,
            build_diet,
            detect_diseases_and_meds,
        )

        db_analysis = detect_diseases_and_meds(db, combined_symptoms)
        all_systems = list(db_analysis["systems"])
        db_base_meds = db_analysis["meds"]

        symptom_systems = detect_active_systems(combined_symptoms, bp_systolic)
        for s in symptom_systems:
            if s == "GYNE" and gender.lower() == "male":
                continue
            if s not in all_systems:
                all_systems.append(s)

        for s in report_systems:
            if s not in all_systems:
                all_systems.append(s)

        if photo_result and photo_result.get("active_systems"):
            for s in photo_result["active_systems"]:
                if s not in all_systems:
                    all_systems.append(s)

        all_systems = list(dict.fromkeys(all_systems))[:4]

        prakriti = detect_prakriti(combined_symptoms, bp_systolic)
        if photo_result and photo_result.get("temperament"):
            prakriti = photo_result["temperament"]

        polarity = detect_polarity(combined_symptoms, bp_systolic, age, bp_diastolic)
        if photo_result and photo_result.get("polarity") in ("POSITIVE", "NEGATIVE"):
            polarity = photo_result["polarity"]

        clinical_only = str(output_mode or "").lower() in ("clinical_only", "clinical", "analysis")

        if clinical_only:
            print("[analyze-report] output_mode=clinical_only — skipping prescription / build_formula")
            from organ_info import get_organ_info

            def _dosha_status(score: int) -> str:
                if score >= 3:
                    return "Severely Aggravated"
                if score >= 1:
                    return "Mildly Aggravated"
                return "Balanced"

            sym_l = combined_symptoms.lower()
            vat_s = sum(1 for t in ["pain", "joint", "numb", "anxiety", "constipation", "gas", "vaat", "vat"] if t in sym_l)
            pitt_s = sum(1 for t in ["fever", "burn", "acidity", "heat", "inflam", "pitt", "jaundice", "yellow"] if t in sym_l)
            kaph_s = sum(1 for t in ["swell", "mucus", "weight", "lazy", "congest", "kaph", "cough", "fluid"] if t in sym_l)
            for f in report_result.get("lab_findings", []):
                st = str(f.get("status", f.get("badge", ""))).upper()
                if st in ("HIGH", "ABNORMAL", "LOW"):
                    pitt_s += 1 if "liver" in str(f.get("parameter", "")).lower() else 0
                    kaph_s += 1 if any(x in str(f.get("parameter", "")).lower() for x in ["wbc", "esr", "crp"]) else 0
                    vat_s += 1 if any(x in str(f.get("parameter", "")).lower() for x in ["uric", "joint"]) else 0

            lab_rows = []
            for f in report_result.get("lab_findings", []):
                st = str(f.get("status", f.get("badge", "NORMAL"))).upper()
                if st == "ABNORMAL":
                    st = "HIGH"
                lab_rows.append({
                    "parameter": f.get("parameter", "—"),
                    "value": f.get("value", "—"),
                    "status": st if st in ("HIGH", "LOW", "NORMAL") else "NORMAL",
                    "eh_meaning": (f.get("eh_note") or f.get("clinical_note") or "")[:200],
                })

            prakriti_analysis = ""
            if face_analysis and face_analysis.get("findings"):
                prakriti_analysis = " ".join(
                    f"{x.get('sign', '')}: {x.get('meaning', '')}" for x in face_analysis["findings"][:3]
                )
            if not prakriti_analysis and photo_result:
                prakriti_analysis = photo_result.get("summary") or f"Visual temperament pattern consistent with {prakriti}."

            affected_part = "Not provided"
            if photo_result and photo_result.get("success") and has_body:
                affected_part = prakriti_analysis or "Body-part photo reviewed for visible signs of vitiation and tissue congestion."

            severity = "Moderate"
            abnormal = [f for f in lab_rows if f["status"] in ("HIGH", "LOW")]
            if len(abnormal) >= 4 or len(all_systems) >= 3:
                severity = "Severe"
            elif len(abnormal) <= 1 and len(all_systems) <= 1:
                severity = "Mild"

            organ_systems = get_organ_info(all_systems)

            dosha_analysis_text = (
                f"Vat pattern: {_dosha_status(vat_s)}; Pitt pattern: {_dosha_status(pitt_s)}; "
                f"Kaph pattern: {_dosha_status(kaph_s)}. Polarity {polarity} with {len(all_systems)} active organ systems."
            )

            impression_parts = [
                f"Clinical analysis for {patient_name}, a {age}-year-old {gender}. "
                f"Constitutional temperament is {prakriti} with {polarity} polarity pattern.",
                prakriti_analysis or "",
                dosha_analysis_text,
            ]
            if lab_rows:
                abnormal = [f for f in lab_rows if f["status"] in ("HIGH", "LOW")]
                impression_parts.append(
                    f"Laboratory review shows {len(abnormal)} abnormal parameter(s) out of {len(lab_rows)} reported values."
                )
                for f in abnormal[:6]:
                    impression_parts.append(
                        f"{f['parameter']} at {f['value']} ({f['status']}): {f.get('eh_meaning') or 'requires clinical correlation'}."
                    )
            for org in organ_systems[:4]:
                impression_parts.append(
                    f"The {org['system']} system ({org.get('dosha', 'Mixed')} dosha influence) — {org.get('description', '')} "
                    f"Typical pathology pattern: {org.get('typical_pathology', '')}"
                )
            if affected_part and affected_part != "Not provided":
                impression_parts.append(f"Affected body region: {affected_part}")
            atomic_symptoms = [
                s.strip() for s in re.split(r" and | aur | , ", combined_symptoms.lower()) if len(s.strip()) > 2
            ]
            if atomic_symptoms:
                impression_parts.append(
                    f"Symptom index (14k fuzzy engine input): {', '.join(atomic_symptoms[:8])}."
                )
            impression_parts.append(
                f"Overall severity is assessed as {severity}. "
                "Blood and lymph circulation should be explained to the patient in plain language: "
                "which organ systems are under stress, why symptoms may persist, and how temperament "
                "and lab findings fit together. This is a diagnostic explanation only — no prescription or medicine protocol."
            )
            overall_impression = "\n\n".join(p for p in impression_parts if p)
            while len(overall_impression.split()) < 500:
                overall_impression += (
                    "\n\nFrom an Electro-Homeopathy constitutional view, the interplay between blood (Sanguine) "
                    "and lymph (Lymphatic) channels determines how toxins and inflammation are cleared. "
                    "When multiple systems are flagged, the body is often compensating through secondary pathways "
                    "such as skin, gastric mucosa, or joint tissue. The doctor should correlate these findings "
                    "with examination, history, and repeat labs where indicated."
                )

            return {
                "status": "success",
                "output_mode": "clinical_only",
                "analysis_mode": mode,
                "pipeline": "eh-api-14k-9engine-clinical-analysis",
                "patient": {
                    "name": patient_name,
                    "age": age,
                    "gender": gender,
                    "bp": f"{bp_systolic}/{bp_diastolic} mmHg",
                },
                "clinical_report": {
                    "prakriti": prakriti,
                    "prakriti_analysis": prakriti_analysis or f"Constitution aligns with {prakriti} temperament based on symptoms and available visual data.",
                    "dosha_dominant": "Pitt" if pitt_s >= vat_s and pitt_s >= kaph_s else ("Vat" if vat_s >= kaph_s else "Kaph"),
                    "vat_status": _dosha_status(vat_s),
                    "pitt_status": _dosha_status(pitt_s),
                    "kaph_status": _dosha_status(kaph_s),
                    "dosha_analysis": dosha_analysis_text,
                    "lab_findings": lab_rows,
                    "lab_summary": report_result.get("report_summary") or (
                        "No laboratory report uploaded." if not has_reports else "See individual parameters above."
                    ),
                    "imaging_findings": report_result.get("imaging_findings", []),
                    "affected_part_analysis": affected_part,
                    "active_systems": all_systems,
                    "organ_systems": organ_systems,
                    "severity": severity,
                    "no_face": not has_body,
                    "no_ang": not has_body,
                    "no_blood": not has_reports,
                    "no_scan": not has_reports,
                    "overall_clinical_impression": overall_impression,
                },
                "eh_engine": {
                    "rule_engines": 9,
                    "disease_index": 14000,
                    "systems_detected": all_systems,
                },
                "face_analysis": face_analysis,
                "report_analysis": report_result,
            }

        potency = select_potency(polarity, condition, age, combined_symptoms)

        report_base_meds = report_result["combined_analysis"].get("suggested_meds", [])
        base_meds = list(dict.fromkeys(report_base_meds + db_base_meds))

        mixtures = build_formula(
            db, all_systems, polarity, prakriti, potency, combined_symptoms, base_meds
        )

        safety = safety_check(polarity, potency["dilution"])
        dosage = calc_dosage(age, polarity, condition)
        diet = build_diet(polarity, all_systems)

        from models import Consultation

        c = Consultation(
            api_key_hash=key_hash,
            patient_name=patient_name,
            age=age,
            gender=gender,
            bp_systolic=bp_systolic,
            bp_diastolic=bp_diastolic,
            symptoms_input=combined_symptoms,
            prakriti=prakriti,
            polarity=polarity,
            potency=potency["dilution"],
            formula_json=json.dumps([m["formula"] for m in mixtures]),
            safety_status=safety["status"],
        )
        db.add(c)
        db.commit()
        db.refresh(c)

        pipeline = {
            "photo_temperament": "eh-api-temperament-9engine",
            "medical_report_ocr": "eh-api-9engine-analyze-report",
            "combined": "eh-api-combined-9engine",
        }.get(mode, "eh-api-9engine-analyze-report")

        if SUMMARY_ENGINE_V2:
            summary_data = build_professional_summary(
                patient={
                    "patient_name": patient_name,
                    "age": age,
                    "gender": gender,
                    "bp_systolic": bp_systolic,
                    "bp_diastolic": bp_diastolic,
                    "symptoms": combined_symptoms,
                },
                prakriti=prakriti,
                polarity=polarity,
                condition=condition,
                active_systems=all_systems,
                mixtures=mixtures,
                dosage={**dosage, "dilution": potency["dilution"]},
                safety=safety,
                diet=diet,
                report_lab=report_result.get("lab_findings", []),
                report_imaging=report_result.get("imaging_findings", []),
                prescription_id=c.id if hasattr(c, "id") else None,
            )
            summary = summary_data["summary"]
            engine_result = summary_data["engine_result"]
        else:
            summary = f"Report Analysis — {patient_name}"
            engine_result = {"mixtures": mixtures, "diet": diet}

        result = {
            "status": "success",
            "prescription_id": c.id,
            "analysis_mode": mode,
            "patient": {
                "name": patient_name,
                "age": age,
                "gender": gender,
                "bp": f"{bp_systolic}/{bp_diastolic} mmHg",
                "condition": condition,
            },
            "report_analysis": report_result,
            "clinical_analysis": {
                "prakriti": prakriti,
                "polarity": polarity,
                "potency": potency["dilution"],
                "active_systems": all_systems,
                "report_systems": report_systems,
            },
            "mixtures": mixtures,
            "dosage": dosage,
            "safety": safety,
            "diet": diet,
            "clinical_summary": summary,
            "engine_result": engine_result,
            "summary_via": "summary_engine.py",
            "pipeline": pipeline,
        }
        if face_analysis:
            result["face_analysis"] = face_analysis
        if photo_result:
            result["photo_temperament"] = photo_result
        return result

    except Exception as e:
        import traceback
        traceback.print_exc()
        return {"status": "error", "message": str(e)}

    finally:
        for fpath in saved_paths:
            try:
                os.remove(fpath)
            except Exception:
                pass


# ═══════════════════════════════════════════════════════
# REGISTER ENDPOINT IN eh_api.py
# ═══════════════════════════════════════════════════════
"""
eh_api.py mein yeh add karo:

from report_analyzer import analyze_report_endpoint

@app.post("/api/v3/analyze-report", tags=["Report Analysis"])
async def analyze_reports(
    files:        List[UploadFile] = File(...),
    patient_name: str  = Form("Patient"),
    age:          int  = Form(40),
    gender:       str  = Form("Male"),
    bp_systolic:  int  = Form(120),
    bp_diastolic: int  = Form(80),
    symptoms:     str  = Form(""),
    condition:    str  = Form("chronic"),
    db:           Session = Depends(get_db),
    key_hash:     str = Depends(verify_api_key),
):
    return await analyze_report_endpoint(
        files, patient_name, age, gender,
        bp_systolic, bp_diastolic, symptoms,
        condition, db, key_hash
    )
"""


if __name__ == "__main__":
    # Quick test with fake data
    print("Report Analyzer Module Loaded ✅")
    print("Endpoint: POST /api/v3/analyze-report")
    print("Accepts: Multiple image files + patient data")
    print("Returns: Complete EH prescription + report analysis")
