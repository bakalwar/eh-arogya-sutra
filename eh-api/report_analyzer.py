"""
REPORT ANALYZER — EH Arogya Sutra
Combines: OCR + Rules + 9 Engines
FastAPI endpoint: POST /api/v3/analyze-report
Book data is SEPARATE — not mixed here
"""
import os
import json
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

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB


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
async def analyze_report_endpoint(
    files:        Optional[List[UploadFile]] = None,
    patient_name: str  = Form("Patient"),
    age:          int  = Form(40),
    gender:       str  = Form("Male"),
    bp_systolic:  int  = Form(120),
    bp_diastolic: int  = Form(80),
    symptoms:     str  = Form(""),
    condition:    str  = Form("chronic"),
    db:           Session = None,
    key_hash:     str = "",
):
    """
    POST /api/v3/analyze-report
    Multiple report photos → Complete EH prescription
    """
    saved_paths = []
    try:
        # Save uploaded files
        session_id = str(uuid.uuid4())[:8]
        if files:
            for file in files:
                if file.content_type not in ALLOWED_TYPES:
                    raise HTTPException(400,
                        f"File type {file.content_type} not allowed. "
                        f"Use: JPEG, PNG, PDF")

                content = await file.read()
                if len(content) > MAX_FILE_SIZE:
                    raise HTTPException(400,
                        f"File {file.filename} too large. Max 10MB.")

                safe_name = f"{session_id}_{file.filename}"
                fpath     = os.path.join(UPLOAD_DIR, safe_name)
                with open(fpath, "wb") as f:
                    f.write(content)
                saved_paths.append(fpath)

        # Analyze all reports
        if saved_paths:
            report_result = analyze_multiple_reports(
                saved_paths, patient_name, gender, age)
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
                    "total_abnormal": 0
                },
                "report_summary": "No reports uploaded."
            }

        # Get EH systems from reports
        report_systems = report_result["combined_analysis"].get(
            "active_systems", [])
        report_polarity = report_result["combined_analysis"].get(
            "dominant_polarity", "MIXED")

        # Combine with patient symptoms for 9 engines
        combined_symptoms = symptoms
        if report_systems:
            combined_symptoms += " " + " ".join([
                s.lower() for s in report_systems])
        
        # KAAM: Better system detection from symptoms
        from clinical_engines import detect_active_systems, detect_prakriti, detect_polarity, select_potency, build_formula, safety_check, calc_dosage, build_diet, detect_diseases_and_meds
        
        # 1. Detect diseases and suggested meds from DB
        db_analysis = detect_diseases_and_meds(db, combined_symptoms)
        all_systems = db_analysis["systems"]
        db_base_meds = db_analysis["meds"]

        # 2. Detect active systems using shared logic
        symptom_systems = detect_active_systems(combined_symptoms, bp_systolic)
        for s in symptom_systems:
            # Gender check for GYNE
            if s == "GYNE" and gender.lower() == "male":
                continue
            if s not in all_systems:
                all_systems.append(s)
        
        # Merge with report-detected systems
        for s in report_systems:
            if s not in all_systems:
                all_systems.append(s)
        
        all_systems = list(dict.fromkeys(all_systems))[:4]

        # Run 9 Rule Engines
        from models import Medicine

        prakriti = detect_prakriti(combined_symptoms, bp_systolic)
        polarity = detect_polarity(combined_symptoms, bp_systolic, age)
        potency  = select_potency(polarity, condition, age, combined_symptoms)

        # Combine meds from reports and DB
        report_base_meds = report_result["combined_analysis"].get("suggested_meds", [])
        base_meds = list(dict.fromkeys(report_base_meds + db_base_meds))
        
        print(f"DEBUG: Calling build_formula from report_analyzer.py with 7 args, base_meds={base_meds}")
        mixtures  = build_formula(db, all_systems, polarity,
                                  prakriti, potency, combined_symptoms, base_meds)
        
        safety    = safety_check(polarity, potency["dilution"])
        dosage    = calc_dosage(age, polarity, condition)
        diet      = build_diet(polarity, all_systems)
        
        # Save to DB to get ID
        from models import Consultation
        c = Consultation(
            api_key_hash=key_hash, patient_name=patient_name,
            age=age, gender=gender,
            bp_systolic=bp_systolic, bp_diastolic=bp_diastolic,
            symptoms_input=symptoms, prakriti=prakriti,
            polarity=polarity, potency=potency["dilution"],
            formula_json=json.dumps([m["formula"] for m in mixtures]),
            safety_status=safety["status"],
        )
        db.add(c); db.commit(); db.refresh(c)

        if SUMMARY_ENGINE_V2:
            summary_data = build_professional_summary(
                patient={
                    "patient_name": patient_name,
                    "age":          age,
                    "gender":       gender,
                    "bp_systolic":  bp_systolic,
                    "bp_diastolic": bp_diastolic,
                    "symptoms":     combined_symptoms,
                },
                prakriti        = prakriti,
                polarity        = polarity,
                condition       = condition,
                active_systems  = all_systems,
                mixtures        = mixtures,
                dosage          = {**dosage, "dilution": potency["dilution"]},
                safety          = safety,
                diet            = diet,
                report_lab      = report_result.get("lab_findings",[]),
                report_imaging  = report_result.get("imaging_findings",[]),
                prescription_id = c.id if hasattr(c,'id') else None,
            )
            summary = summary_data["summary"]
            engine_result = summary_data["engine_result"]
        else:
            summary = f"Report Analysis — {patient_name}"
            engine_result = {"mixtures": mixtures, "diet": diet}

        return {
            "status":          "success",
            "prescription_id": c.id,
            "patient": {
                "name":    patient_name,
                "age":     age,
                "gender":  gender,
                "bp":      f"{bp_systolic}/{bp_diastolic} mmHg",
                "condition": condition,
            },
            "report_analysis":  report_result,
            "clinical_analysis":{
                "prakriti":        prakriti,
                "polarity":        polarity,
                "potency":         potency["dilution"],
                "active_systems":  all_systems,
                "report_systems":  report_systems,
            },
            "mixtures":          mixtures,
            "dosage":            dosage,
            "safety":            safety,
            "diet":              diet,
            "clinical_summary":  summary,
            "engine_result":     engine_result,
        }

    except Exception as e:
        import traceback
        traceback.print_exc()
        return {
            "status":  "error",
            "message": str(e)
        }

    finally:
        # Cleanup uploaded files after analysis
        for fpath in saved_paths:
            try:
                os.remove(fpath)
            except:
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
