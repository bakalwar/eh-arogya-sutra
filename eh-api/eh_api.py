"""
╔══════════════════════════════════════════════════════════════╗
║  EH AROGYA SUTRA — COMMERCIAL API v3.1                      ║
║  Electro-Homeopathy Clinical Decision Engine                 ║
║                                                              ║
║  38 Authentic EH Medicines (Book-accurate)                   ║
║  S-Group(9) + A(3) + C(10) + P(4) + F(2)                   ║
║  + Ver(2) + Ven(1) + L(1) + Electricity(6) = 38            ║
║                                                              ║
║  Run: uvicorn eh_api:app --reload --port 8000               ║
║  Docs: http://localhost:8000/docs                            ║
║  Test Key: EH_TEST_KEY_2026                                  ║
╚══════════════════════════════════════════════════════════════╝
"""

import os, json, hashlib, secrets, sys

try:
    from dotenv import load_dotenv
    _env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")
    if os.path.isfile(_env_path):
        load_dotenv(_env_path)
except Exception as e:
    print(f"[WARNING] .env load skipped: {e}")

print(f"DEBUG: sys.path = {sys.path}")
print(f"DEBUG: __file__ = {__file__}")
print(f"DEBUG: os.getcwd() = {os.getcwd()}")
from datetime import datetime
from typing import List, Optional
from fastapi import FastAPI, Depends, HTTPException, Security, UploadFile, File, Form, Body
from fastapi.security.api_key import APIKeyHeader
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import (create_engine, Column, Integer,
    String, Text, DateTime, Boolean)
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from pydantic import BaseModel, Field
from models import Base, Medicine, Disease, PotencyRule, ApiKey, Consultation, engine, SessionLocal, init_db

# Professional summary engine — required (no legacy string fallback)
from summary_engine import build_professional_summary
print("[STARTUP] Professional Summary Engine (summary_engine.py) loaded.")

init_db()

# ═══════════════════════════════════════════════
# DATABASE HELPERS
# ═══════════════════════════════════════════════
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# 9 Rule Engine seed data (38 medicines + ICD diseases + potency rules)
from data import MEDICINES_38, DISEASES_DATA, POTENCY_RULES_DATA

# ═══════════════════════════════════════════════
# AUTO-SEEDING
# ═══════════════════════════════════════════════
def seed_all_data():
    db = SessionLocal()
    try:
        if db.query(Medicine).count() == 0:
            db.add_all([Medicine(**m) for m in MEDICINES_38])
            db.commit()
            print(f"[SEED] {len(MEDICINES_38)} medicines loaded.")

        if db.query(Disease).count() == 0:
            seen_names = set()
            for d in DISEASES_DATA:
                name = d[1]
                if name in seen_names:
                    continue
                seen_names.add(name)
                db.add(Disease(
                    icd10_code=d[0], name_english=name,
                    category=d[2], system_key=d[3],
                    symptoms_en=d[4], base_medicines=d[5]
                ))
            db.commit()
            print(f"[SEED] {len(seen_names)} diseases loaded.")

        if db.query(PotencyRule).count() == 0:
            for r in POTENCY_RULES_DATA:
                db.add(PotencyRule(
                    condition=r[0], polarity=r[1],
                    phase=r[2], age_min=r[3], age_max=r[4],
                    dilution=r[5], matra_type=r[6], reason=r[7]
                ))
            db.commit()
            print(f"[SEED] {len(POTENCY_RULES_DATA)} potency rules loaded.")

        test_hash = hashlib.sha256("EH_TEST_KEY_2026".encode()).hexdigest()
        if db.query(ApiKey).filter(
                ApiKey.key_hash==test_hash).count() == 0:
            db.add(ApiKey(key_hash=test_hash,
                          doctor_name="Test Doctor",
                          email="test@eharogya.com",
                          daily_limit=1000))
            db.commit()
            print("[SEED] Test key ready: EH_TEST_KEY_2026")
    finally:
        db.close()

# ═══════════════════════════════════════════════
# API KEY SECURITY (optional when EH_API_OPEN=1 — local search engine)
# ═══════════════════════════════════════════════
def _api_open_mode() -> bool:
    # Open by default for local search (set EH_API_OPEN=0 to require API keys)
    val = os.getenv("EH_API_OPEN", "1").strip().lower()
    return val not in ("0", "false", "no")

API_KEY_HEADER = APIKeyHeader(name="x-api-key", auto_error=False)

def verify_api_key(api_key: Optional[str] = Security(API_KEY_HEADER),
                   db: Session = Depends(get_db)) -> str:
    if _api_open_mode():
        if api_key:
            key_hash = hashlib.sha256(api_key.encode()).hexdigest()
            record = db.query(ApiKey).filter(
                ApiKey.key_hash == key_hash,
                ApiKey.is_active == True).first()
            if record:
                return key_hash
        return "open-mode"
    if not api_key:
        raise HTTPException(403,
            "Missing API key. Header: x-api-key: EH_TEST_KEY_2026")
    key_hash = hashlib.sha256(api_key.encode()).hexdigest()
    record   = db.query(ApiKey).filter(
                   ApiKey.key_hash==key_hash,
                   ApiKey.is_active==True).first()
    if not record:
        raise HTTPException(403,
            "Invalid API key. "
            "Register at POST /api/v3/register "
            "or use test key: EH_TEST_KEY_2026")
    return key_hash

# ═══════════════════════════════════════════════
# 9 CLINICAL RULE ENGINES (Imported)
# ═══════════════════════════════════════════════
from clinical_engines import (
    PRAKRITI_KEYWORDS, POS_KW, NEG_KW, POTENCY_TABLE,
    SCHEDULES, DROPS_MAP, FREQ_MAP, DURATION_MAP,
    detect_prakriti, detect_polarity, select_potency,
    build_formula, safety_check, calc_dosage, build_diet,
    SYMPTOM_MAP, SYSTEM_PRIORITY
)

# ═══════════════════════════════════════════════
# FASTAPI APP
# ═══════════════════════════════════════════════
app = FastAPI(
    title="EH Arogya Sutra — Electro-Homeopathy API",
    description=(
        "**Commercial Electro-Homeopathy Clinical Decision API**\n\n"
        "38 Authentic EH Medicines | 9 Rule Engines | Book-Accurate\n\n"
        "**Test API Key**: `EH_TEST_KEY_2026`\n\n"
        "**Header**: `x-api-key: EH_TEST_KEY_2026`"
    ),
    version="3.1.0",
)

app.add_middleware(CORSMiddleware, allow_origins=["*"],
                   allow_methods=["*"], allow_headers=["*"])

@app.on_event("startup")
def startup():
    seed_all_data()
    print("[STARTUP] EH Arogya Sutra API v3.1 ready.")

# ─── PYDANTIC MODELS ────────────────────────────────
class PrescribeReq(BaseModel):
    patient_name:  Optional[str] = Field("Anonymous", example="Ram Kumar")
    age:           int           = Field(example=45, ge=0, le=120)
    gender:        str           = Field(example="Male")
    bp_systolic:   int           = Field(example=155, ge=60, le=250)
    bp_diastolic:  int           = Field(example=95,  ge=40, le=150)
    symptoms:      str           = Field(
                       example="swelling in hands feet, high BP, back pain")
    condition:     str           = Field("chronic",
                       example="chronic",
                       description="acute / sub_acute / chronic / degenerative")
    disease_names: Optional[List[str]] = Field(
                       default=[], example=["Hypertension / High BP"])

class RegisterReq(BaseModel):
    doctor_name: str = Field(example="Dr. Sharma")
    email:       str = Field(example="doctor@clinic.com")


def _case_data_to_prescribe_req(case: dict) -> PrescribeReq:
    """Node Smart Search caseData → PrescribeReq (14k diseases + 9 engines)."""
    case = case or {}
    patient = case.get("patient") or {}
    analysis = case.get("analysis") or {}
    parts = []
    if patient.get("chiefComplaint"):
        parts.append(str(patient.get("chiefComplaint")))
    if analysis.get("chief_complaint"):
        parts.append(str(analysis.get("chief_complaint")))
    if case.get("chief_complaint"):
        parts.append(str(case.get("chief_complaint")))
    if case.get("chiefComplaint"):
        parts.append(str(case.get("chiefComplaint")))
    for s in patient.get("symptoms") or []:
        if s:
            parts.append(s.get("name") if isinstance(s, dict) else str(s))
    symptoms_text = ", ".join([p for p in parts if p]).strip()
    phase = str(
        analysis.get("phase") or patient.get("condition") or case.get("phase") or "chronic"
    ).lower().replace("-", "_")
    condition = phase if phase in ("acute", "sub_acute", "chronic", "degenerative") else "chronic"
    return PrescribeReq(
        patient_name=patient.get("name") or case.get("name") or case.get("patient_name") or "Patient",
        age=int(patient.get("age") or case.get("age") or 30),
        gender=patient.get("gender") or case.get("gender") or "Male",
        bp_systolic=int(patient.get("bp_systolic") or case.get("bp_systolic") or 120),
        bp_diastolic=int(patient.get("bp_diastolic") or case.get("bp_diastolic") or 80),
        symptoms=symptoms_text,
        condition=condition,
        disease_names=case.get("disease_names") or [],
    )


def _run_prescribe_pipeline(req: PrescribeReq, db: Session, key_hash: str) -> dict:
    from clinical_engines import (
        detect_active_systems, detect_prakriti, detect_polarity,
        select_potency, build_formula, safety_check, calc_dosage,
        build_diet, detect_diseases_and_meds
    )

    active_systems = detect_active_systems(req.symptoms, req.bp_systolic)
    db_analysis = detect_diseases_and_meds(db, req.symptoms, req.disease_names)
    db_systems = db_analysis["systems"]
    base_meds = db_analysis["meds"]

    for s in db_systems:
        if s not in active_systems:
            active_systems.append(s)

    if req.gender.lower() == "male" and "GYNE" in active_systems:
        active_systems.remove("GYNE")

    active_systems = list(dict.fromkeys(active_systems))[:4]

    try:
        prakriti = detect_prakriti(req.symptoms, req.bp_systolic)
        polarity = detect_polarity(req.symptoms, req.bp_systolic, req.age, req.bp_diastolic)
        potency = select_potency(polarity, req.condition, req.age, req.symptoms)
        mixtures = build_formula(db, active_systems, polarity, prakriti,
                                 potency, req.symptoms, base_meds)
        final_systems = [m["system"] for m in mixtures]
        safety = safety_check(polarity, potency["dilution"])
        dosage = calc_dosage(req.age, polarity, req.condition)
        diet = build_diet(polarity, final_systems)
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(500, f"EH clinical engines failed: {e}")

    c = Consultation(
        api_key_hash=key_hash, patient_name=req.patient_name,
        age=req.age, gender=req.gender,
        bp_systolic=req.bp_systolic, bp_diastolic=req.bp_diastolic,
        symptoms_input=req.symptoms, prakriti=prakriti,
        polarity=polarity, potency=potency["dilution"],
        formula_json=json.dumps([m["formula"] for m in mixtures]),
        safety_status=safety["status"],
    )
    db.add(c)
    db.commit()
    db.refresh(c)

    try:
        summary_data = build_professional_summary(
            patient={
                "patient_name": req.patient_name,
                "age": req.age,
                "gender": req.gender,
                "bp_systolic": req.bp_systolic,
                "bp_diastolic": req.bp_diastolic,
                "symptoms": req.symptoms,
            },
            prakriti=prakriti,
            polarity=polarity,
            condition=req.condition,
            active_systems=final_systems,
            mixtures=mixtures,
            dosage={**dosage, "dilution": potency.get("dilution", "D6")},
            safety=safety,
            diet=diet,
            report_lab=[],
            report_imaging=[],
            prescription_id=c.id,
        )
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(500, f"summary_engine.py failed: {e}")

    summary = str(summary_data.get("summary") or "").strip()
    if not summary or summary.lower().startswith("error generating summary"):
        raise HTTPException(502, "Empty or invalid clinical_summary from summary_engine.py")

    engine_result = summary_data.get("engine_result") or {}

    return {
        "status": "success",
        "prescription_id": c.id,
        "generated_at": datetime.utcnow().isoformat(),
        "patient": {
            "name": req.patient_name,
            "age": req.age,
            "gender": req.gender,
            "bp": f"{req.bp_systolic}/{req.bp_diastolic} mmHg",
            "condition": req.condition,
        },
        "clinical_analysis": {
            "prakriti": prakriti,
            "polarity": polarity,
            "phase": req.condition,
            "potency": potency["dilution"],
            "potency_type": potency["type"],
            "potency_note": potency.get("note", ""),
            "active_systems": active_systems,
        },
        "mixtures": mixtures,
        "dosage": dosage,
        "safety": safety,
        "diet": diet,
        "clinical_summary": summary,
        "engine_result": engine_result,
        "summary_via": "summary_engine.py",
        "pipeline": "eh-api-14k-diseases-9-rule-engines",
        "important_rules": [
            "Never mix different mixtures in same glass.",
            "Always use warm water — never cold.",
            "Wait 15 minutes after taking medicine.",
            "Do not stop medicine midway.",
            f"Antidote: {safety['antidote']}",
        ],
    }


# ─── ENDPOINTS ──────────────────────────────────────
@app.get("/api/health", tags=["System"],
         summary="System health check — no API key needed")
@app.get("/health", tags=["System"], include_in_schema=False)
def health(db: Session = Depends(get_db)):
    return {
        "status":    "online",
        "version":   "3.1.0",
        "medicines": db.query(Medicine).count(),
        "diseases":  db.query(Disease).count(),
        "rules":     db.query(PotencyRule).count(),
        "open_mode": _api_open_mode(),
        "message":   "EH Arogya Sutra API running. 38 book-accurate medicines.",
    }


@app.get("/api/v3/search", tags=["Clinical Engine"],
         summary="Fuzzy disease search — 14,000 records, no API key required")
def fuzzy_disease_search(
    q: str,
    threshold: int = 70,
    limit: int = 5,
):
    from clinical_engines import fuzzy_engine
    if not q or len(q.strip()) < 2:
        raise HTTPException(400, "Query 'q' must be at least 2 characters.")
    limit = max(1, min(limit, 10))
    matches = fuzzy_engine.find_matches(q.strip(), threshold=threshold)[:limit]
    return {
        "status": "success",
        "query": q.strip(),
        "total": len(matches),
        "database_records": len(fuzzy_engine.search_space),
        "matches": matches,
    }


@app.post("/api/v3/register", tags=["Authentication"],
          summary="Register doctor and get API key")
def register(req: RegisterReq, db: Session = Depends(get_db)):
    new_key  = f"EH_{secrets.token_hex(12).upper()}"
    key_hash = hashlib.sha256(new_key.encode()).hexdigest()
    db.add(ApiKey(key_hash=key_hash,
                  doctor_name=req.doctor_name,
                  email=req.email, daily_limit=100))
    db.commit()
    return {
        "status":      "success",
        "api_key":     new_key,
        "doctor_name": req.doctor_name,
        "daily_limit": 100,
        "usage":       f"Add header: x-api-key: {new_key}",
        "note":        "Save this key — it cannot be recovered.",
    }


@app.post("/api/v3/prescribe", tags=["Clinical Engine"],
          summary="Generate complete EH prescription — 9 Rule Engines")
def prescribe(req: PrescribeReq,
              db: Session = Depends(get_db),
              key_hash: str = Depends(verify_api_key)):
    return _run_prescribe_pipeline(req, db, key_hash)


@app.get("/api/summary/eh-api", tags=["Clinical Summary"],
         summary="Summary route info (POST only)")
def summary_eh_api_get():
    raise HTTPException(
        405,
        "Use POST /api/summary/eh-api with JSON { caseData } on EH Python API (eh_api.py).",
    )


@app.post("/api/summary/eh-api", tags=["Clinical Summary"],
          summary="Clinical summary — 14k diseases + 9 Rule Engines (summary_engine.py)")
def summary_eh_api(
    body: dict = Body(...),
    db: Session = Depends(get_db),
    key_hash: str = Depends(verify_api_key),
):
    if not body or not isinstance(body, dict):
        raise HTTPException(400, "JSON body required: { caseData: { patient, analysis, ... } }")
    case = body.get("caseData") if isinstance(body.get("caseData"), dict) else body
    if not case:
        raise HTTPException(400, "caseData missing — send symptoms / eh_analysis from Analyze Case")
    req = _case_data_to_prescribe_req(case)
    if not (req.symptoms or "").strip():
        raise HTTPException(400, "Symptoms / chief complaint required for EH API summary")
    return _run_prescribe_pipeline(req, db, key_hash)


@app.get("/api/v3/prescription/{pid}", tags=["Clinical Engine"],
         summary="Get saved prescription by ID")
def get_prescription(pid: int,
                     db: Session = Depends(get_db),
                     key_hash: str = Depends(verify_api_key)):
    c = db.query(Consultation).filter(Consultation.id==pid).first()
    if not c:
        raise HTTPException(404, f"Prescription {pid} not found.")
    return {
        "prescription_id": c.id,
        "created_at":      c.created_at,
        "patient": {
            "name":   c.patient_name,
            "age":    c.age,
            "gender": c.gender,
            "bp":     f"{c.bp_systolic}/{c.bp_diastolic}",
        },
        "analysis": {
            "prakriti":c.prakriti,
            "polarity":c.polarity,
            "potency": c.potency,
            "safety":  c.safety_status,
        },
        "formulas":  json.loads(c.formula_json or "[]"),
        "symptoms":  c.symptoms_input,
    }


@app.get("/api/v3/medicines", tags=["Reference Data"],
         summary="Get all 38 EH medicines")
def get_medicines(
    group: Optional[str] = None,
    db:    Session        = Depends(get_db),
    key_hash: str         = Depends(verify_api_key)):
    q = db.query(Medicine)
    if group:
        q = q.filter(Medicine.group_type.ilike(f"%{group}%"))
    meds = q.all()
    return {
        "total": len(meds),
        "medicines": [{
            "id":           m.id,
            "name":         m.name,
            "group":        m.group_type,
            "polarity":     m.polarity,
            "target_organ": m.target_organ,
            "description":  m.description,
            "organ_action": m.organ_action,
            "when_to_give": m.when_to_give,
        } for m in meds],
    }


@app.get("/api/v3/diseases", tags=["Reference Data"],
         summary="Get all diseases with ICD-10 codes")
def get_diseases(
    category: Optional[str] = None,
    search:   Optional[str] = None,
    db:       Session        = Depends(get_db),
    key_hash: str            = Depends(verify_api_key)):
    q = db.query(Disease)
    if category:
        q = q.filter(Disease.category.ilike(f"%{category}%"))
    if search:
        q = q.filter(Disease.name_english.ilike(f"%{search}%"))
    ds = q.all()
    return {
        "total": len(ds),
        "diseases": [{
            "id":           d.id,
            "icd10_code":   d.icd10_code,
            "name":         d.name_english,
            "category":     d.category,
            "system_key":   d.system_key,
            "symptoms":     d.symptoms_en,
            "base_medicines": d.base_medicines,
        } for d in ds],
    }


@app.get("/api/v3/potency-rules", tags=["Reference Data"],
         summary="Get all EH potency selection rules")
def get_potency_rules(
    db:       Session = Depends(get_db),
    key_hash: str     = Depends(verify_api_key)):
    rules = db.query(PotencyRule).all()
    return {
        "total": len(rules),
        "rules": [{
            "condition":  r.condition,
            "polarity":   r.polarity,
            "phase":      r.phase,
            "age_range":  f"{r.age_min}-{r.age_max}",
            "dilution":   r.dilution,
            "type":       r.matra_type,
            "reason":     r.reason,
        } for r in rules],
    }


from report_analyzer import analyze_report_endpoint

@app.post("/api/v3/analyze-report", tags=["Report Analysis"])
async def analyze_reports(
    files:        Optional[List[UploadFile]] = File(None),
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


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("eh_api:app", host="0.0.0.0", port=8005, reload=False)
