from __future__ import annotations

from .normalize import NormalizedEvidence, detect_systems


PRAKRITI_CUES = {
    "vata": ("dry", "anxiety", "constipation", "cold", "vata", "वात"),
    "pitta": ("heat", "burn", "anger", "acid", "pitta", "पित्त", "inflammation"),
    "kapha": ("heavy", "mucus", "lethargy", "kapha", "कफ", "obesity", "edema"),
}

POLARITY_POS = ("acute", "active", "positive", "heat", "inflammation", "fever")
POLARITY_NEG = ("chronic", "deficient", "negative", "cold", "weakness", "fatigue")


def interpret_prakriti(evidence: NormalizedEvidence) -> dict:
    blob = evidence.raw_text
    hits = {k: sum(1 for c in cues if c in blob) for k, cues in PRAKRITI_CUES.items()}
    ranked = sorted(((k, v) for k, v in hits.items() if v > 0), key=lambda x: (-x[1], x[0]))
    if not ranked:
        return {
            "status": "UNKNOWN",
            "prakriti": "UNKNOWN",
            "confidence": 0.0,
            "evidence": [],
            "mixed": False,
        }
    if len(ranked) >= 2 and ranked[0][1] == ranked[1][1]:
        return {
            "status": "MIXED",
            "prakriti": "MIXED",
            "confidence": 0.4,
            "evidence": [{"dosha": k, "hits": v} for k, v in ranked],
            "mixed": True,
        }
    top, score = ranked[0]
    return {
        "status": "RESOLVED",
        "prakriti": top.upper(),
        "confidence": min(1.0, 0.35 * score),
        "evidence": [{"dosha": k, "hits": v} for k, v in ranked],
        "mixed": False,
    }


def interpret_polarity(evidence: NormalizedEvidence) -> dict:
    blob = evidence.raw_text
    pos = sum(1 for c in POLARITY_POS if c in blob)
    neg = sum(1 for c in POLARITY_NEG if c in blob)
    if pos == 0 and neg == 0:
        return {
            "status": "UNKNOWN",
            "polarity": "UNKNOWN",
            "confidence": 0.0,
            "evidence": [],
        }
    if pos > 0 and neg > 0:
        return {
            "status": "MIXED",
            "polarity": "MIXED",
            "confidence": 0.35,
            "evidence": [{"positive_hits": pos, "negative_hits": neg}],
        }
    if pos > neg:
        return {
            "status": "RESOLVED",
            "polarity": "POSITIVE",
            "confidence": min(1.0, 0.4 * pos),
            "evidence": [{"positive_hits": pos}],
        }
    return {
        "status": "RESOLVED",
        "polarity": "NEGATIVE",
        "confidence": min(1.0, 0.4 * neg),
        "evidence": [{"negative_hits": neg}],
    }


def interpret_temperament(evidence: NormalizedEvidence, prakriti: dict) -> dict:
    # Temperament here mirrors prakriti when evidenced; otherwise UNKNOWN.
    if prakriti.get("status") == "UNKNOWN":
        return {
            "status": "UNKNOWN",
            "temperament": "UNKNOWN",
            "confidence": 0.0,
            "evidence": [],
        }
    return {
        "status": prakriti["status"],
        "temperament": prakriti.get("prakriti"),
        "confidence": prakriti.get("confidence", 0.0),
        "evidence": prakriti.get("evidence", []),
    }


def interpret_organs(evidence: NormalizedEvidence) -> dict:
    systems = detect_systems(evidence)
    if not systems:
        return {
            "status": "UNKNOWN",
            "systems": [],
            "confidence": 0.0,
            "evidence": [],
            "truncated": False,
        }
    return {
        "status": "RESOLVED" if systems else "UNKNOWN",
        "systems": systems,  # full list — no silent five-system truncation
        "confidence": systems[0]["confidence"] if systems else 0.0,
        "evidence": systems,
        "truncated": False,
        "beyond_five": len(systems) > 5,
    }


def safety_red_flags(evidence: NormalizedEvidence) -> dict:
    warnings: list[str] = []
    vitals = evidence.vitals or {}
    sys_bp = vitals.get("systolic_bp") or vitals.get("systolicBp") or vitals.get("bp_systolic")
    dia_bp = vitals.get("diastolic_bp") or vitals.get("diastolicBp") or vitals.get("bp_diastolic")
    try:
        if sys_bp is not None and float(sys_bp) >= 180:
            warnings.append("HIGH_BP_RED_FLAG")
        if dia_bp is not None and float(dia_bp) >= 120:
            warnings.append("HIGH_DIASTOLIC_RED_FLAG")
    except (TypeError, ValueError):
        pass
    return {
        "status": "WARNING" if warnings else "CLEAR",
        "warnings": warnings,
        "claims_emergency_treatment": False,
        "evidence": {"vitals": vitals} if vitals else {},
    }


def doctor_vs_symptoms(evidence: NormalizedEvidence, candidates: list[dict]) -> dict:
    dx = evidence.doctor_diagnosis
    if not dx:
        return {"status": "ABSENT", "conflict": False}
    names = " ".join(str(c.get("name_english") or "").lower() for c in candidates)
    conflict = bool(candidates) and dx not in names and not any(tok in names for tok in dx.split() if len(tok) > 3)
    return {
        "status": "CONFLICT" if conflict else "ALIGNED_OR_UNCOMPARABLE",
        "conflict": conflict,
        "doctor_diagnosis_as_evidence_only": True,
        "forces_engine_conclusion": False,
    }
