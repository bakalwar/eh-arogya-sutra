from __future__ import annotations

import re
from dataclasses import dataclass, field

# Minimal Hinglish / Hindi cue map for synthetic validation (not a full clinical lexicon).
HINGLISH_MAP = {
    "bukhar": "fever",
    "sir": "head",
    "dard": "pain",
    "pet": "abdomen",
    "khansi": "cough",
    "saans": "breath",
    "jodo": "joint",
    "jodon": "joint",
    "matli": "nausea",
    "ulti": "vomiting",
    "kamzor": "weakness",
}

NEGATION_CUES = ("no ", "not ", "without ", "denies ", "नहीं", "nahi", "nahin")

SYSTEM_KEYWORDS = {
    "METABOLIC": ("fever", "bukhar", "diabetes", "sugar", "weakness", "fatigue"),
    "JOINTS": ("joint", "jodo", "arthritis", "knee", "pain", "dard"),
    "LIVER": ("liver", "nausea", "matli", "jaundice", "hepat"),
    "RESPIRATORY": ("cough", "khansi", "breath", "saans", "asthma", "wheeze"),
    "CARDIAC": ("chest", "palpitation", "heart", "bp", "hypertension"),
    "NEURO": ("headache", "sir", "vertigo", "migraine", "seizure"),
    "GI": ("abdomen", "pet", "diarrhea", "constipation", "vomit", "ulti"),
    "SKIN": ("rash", "itch", "eczema", "acne", "skin"),
    "RENAL": ("urine", "kidney", "edema", "swelling"),
    "GYNE": ("menstrual", "pcos", "pregnancy", "uterus"),
}


@dataclass
class NormalizedEvidence:
    chief_complaint: str
    symptoms: list[str]
    negated_symptoms: list[str]
    tokens: list[str]
    language_hints: list[str]
    duration: str | None = None
    severity: str | None = None
    vitals: dict = field(default_factory=dict)
    doctor_diagnosis: str | None = None
    affected_site: str | None = None
    raw_text: str = ""


def _has_devanagari(text: str) -> bool:
    return any("\u0900" <= ch <= "\u097f" for ch in text)


def normalize_text(text: str) -> str:
    t = (text or "").strip().lower()
    t = re.sub(r"\s+", " ", t)
    for src, dst in HINGLISH_MAP.items():
        t = re.sub(rf"\b{re.escape(src)}\b", dst, t)
    return t


def normalize_case(payload: dict) -> NormalizedEvidence:
    cc = str(payload.get("chief_complaint") or payload.get("chiefComplaint") or "").strip()
    symptoms_in = payload.get("symptoms") or []
    if isinstance(symptoms_in, str):
        symptoms_in = [symptoms_in]
    duration = payload.get("duration")
    severity = payload.get("severity")
    vitals = payload.get("vitals") or {}
    doctor_dx = payload.get("doctor_supplied_diagnosis") or payload.get("doctorSuppliedDiagnosis")
    site = payload.get("affected_site") or payload.get("affectedSite")

    positives: list[str] = []
    negated: list[str] = []
    for s in symptoms_in:
        raw = str(s).strip()
        if not raw:
            continue
        low = raw.lower()
        if any(low.startswith(n) or f" {n}" in f" {low}" for n in NEGATION_CUES):
            negated.append(normalize_text(raw))
        else:
            positives.append(normalize_text(raw))

    cc_n = normalize_text(cc)
    raw_text = " ".join([cc_n, *positives])
    tokens = []
    for part in [cc_n, *positives]:
        tokens.extend(re.findall(r"[a-z0-9\u0900-\u097f]+", part))

    hints = []
    blob = " ".join([cc, *map(str, symptoms_in)])
    if _has_devanagari(blob):
        hints.append("hi")
    if re.search(r"[a-zA-Z]", blob):
        hints.append("en")

    return NormalizedEvidence(
        chief_complaint=cc_n,
        symptoms=positives,
        negated_symptoms=negated,
        tokens=[t for t in tokens if len(t) >= 2],
        language_hints=hints,
        duration=str(duration) if duration else None,
        severity=str(severity) if severity else None,
        vitals=dict(vitals) if isinstance(vitals, dict) else {},
        doctor_diagnosis=normalize_text(str(doctor_dx)) if doctor_dx else None,
        affected_site=normalize_text(str(site)) if site else None,
        raw_text=raw_text,
    )


def detect_systems(evidence: NormalizedEvidence) -> list[dict]:
    scores: dict[str, int] = {}
    blob = evidence.raw_text
    for system, keys in SYSTEM_KEYWORDS.items():
        score = 0
        for k in keys:
            if k in blob:
                score += 1
        if score:
            scores[system] = score
    ranked = sorted(scores.items(), key=lambda x: (-x[1], x[0]))
    # Do not silently truncate to five — return all evidenced systems
    return [{"system": s, "score": sc, "confidence": min(1.0, 0.25 * sc)} for s, sc in ranked]
