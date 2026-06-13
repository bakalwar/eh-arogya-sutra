"""Chaldean name→number calculation + tendency query logic."""
import random
import re
from typing import Any, Dict, List, Optional

from sqlalchemy.orm import Session

from numerology_db import NumerologyBase, NumerologyTendency

CHALDEAN = {
    "A": 1, "B": 2, "C": 3, "D": 4, "E": 5, "F": 8, "G": 3, "H": 5, "I": 1,
    "J": 1, "K": 2, "L": 3, "M": 4, "N": 5, "O": 7, "P": 8, "Q": 1, "R": 2,
    "S": 3, "T": 4, "U": 6, "V": 6, "W": 6, "X": 5, "Y": 1, "Z": 7,
}

FORBIDDEN_OUTPUT = re.compile(
    r"\b(numerology|astrology|planet|grah|dasha|surya|chandra|rahu|ketu|shani|mangal|budha|shukra|guru)\b",
    re.I,
)

SEVERITIES = ("Mild", "Moderate", "Severe")
AGE_BANDS = ("Child", "Adult", "Middle-age", "Senior")
GENDERS = ("Any", "Male", "Female")
VARIANTS_PER_COMBO = 11


def calculate_number(name: str) -> int:
    clean = "".join(c for c in (name or "").upper() if c.isalpha())
    if not clean:
        return 5
    total = sum(CHALDEAN.get(c, 0) for c in clean)
    while total > 9:
        total = sum(int(d) for d in str(total))
    return total or 5


def age_to_band(age: int) -> str:
    if age < 18:
        return "Child"
    if age < 40:
        return "Adult"
    if age < 60:
        return "Middle-age"
    return "Senior"


def sanitize_public_text(text: str) -> str:
    """Strip forbidden labels from outward-facing copy."""
    if not text:
        return text
    out = FORBIDDEN_OUTPUT.sub("constitutional pattern", text)
    return out


def _pick_tendency(
    db: Session,
    *,
    number: int,
    organ: str,
    severity: str,
    age_band: str,
    gender: str,
) -> Optional[NumerologyTendency]:
    genders = [gender, "Any"]
    rows = (
        db.query(NumerologyTendency)
        .filter(
            NumerologyTendency.number == number,
            NumerologyTendency.organ == organ,
            NumerologyTendency.severity == severity,
            NumerologyTendency.age_band == age_band,
            NumerologyTendency.gender.in_(genders),
        )
        .all()
    )
    if not rows:
        rows = (
            db.query(NumerologyTendency)
            .filter(
                NumerologyTendency.number == number,
                NumerologyTendency.organ == organ,
                NumerologyTendency.severity == severity,
                NumerologyTendency.age_band == age_band,
            )
            .all()
        )
    if not rows:
        return None
    return random.choice(rows)


def build_baseline(
    db: Session,
    *,
    name: str,
    age: int,
    gender: str,
) -> Dict[str, Any]:
    number = calculate_number(name)
    base = db.query(NumerologyBase).filter(NumerologyBase.number == number).first()
    if not base:
        raise ValueError(f"No base row for number {number}")

    age_band = age_to_band(age)
    picked: List[NumerologyTendency] = []
    organs = base.organs[:3]

    for organ in organs:
        row = _pick_tendency(
            db,
            number=number,
            organ=organ,
            severity="Mild",
            age_band=age_band,
            gender=gender,
        )
        if row:
            picked.append(row)

    if not picked:
        baseline_text = (
            f"Constitutional Baseline indicates a {base.dosha_primary} pattern "
            f"with emphasis on {', '.join(base.organs[:3])}. "
            "Clinical correlation with examination and temperament findings is recommended."
        )
        watch_points = [f"Monitor {org} function periodically" for org in base.organs[:2]]
    else:
        texts = [sanitize_public_text(r.tendency_text) for r in picked[:3]]
        baseline_text = " ".join(texts)
        watch_points = list({sanitize_public_text(r.watch_point) for r in picked})

    return {
        "number": number,
        "dosha_primary": base.dosha_primary,
        "dosha_secondary": base.dosha_secondary,
        "organs": base.organs,
        "baseline_text": sanitize_public_text(baseline_text),
        "watch_points": watch_points,
        "focus_areas": ", ".join(base.organs),
        "note": sanitize_public_text(baseline_text[:280] + ("…" if len(baseline_text) > 280 else "")),
        "watch": watch_points[:4],
    }


def _normalize_dosha(value: str) -> str:
    v = (value or "").strip().capitalize()
    if v.startswith("Vat"):
        return "Vata"
    if v.startswith("Pitt"):
        return "Pitta"
    if v.startswith("Kaph"):
        return "Kapha"
    return v


def build_correlation(
    db: Session,
    *,
    name: str,
    age: int,
    gender: str,
    photo_detected_dosha: str,
    photo_detected_organs: List[str],
) -> Dict[str, Any]:
    baseline = build_baseline(db, name=name, age=age, gender=gender)
    number = baseline["number"]
    primary = baseline["dosha_primary"]
    secondary = baseline.get("dosha_secondary")
    base_organs = list(baseline["organs"])
    photo_dosha = _normalize_dosha(photo_detected_dosha)
    photo_organs = [o.strip() for o in (photo_detected_organs or []) if o and o.strip()]

    if photo_dosha == primary:
        match_status = "CONFIRMED"
        severity = "Moderate"
    elif secondary and photo_dosha == secondary:
        match_status = "PARTIAL"
        severity = "Moderate"
    else:
        match_status = "DUAL_TENDENCY"
        severity = "Mild"

    combined_organs = list(dict.fromkeys(base_organs + photo_organs))
    age_band = age_to_band(age)
    texts: List[str] = []
    watch_points: List[str] = []

    target_organs = photo_organs[:2] if photo_organs else base_organs[:2]
    for organ in target_organs:
        row = _pick_tendency(
            db,
            number=number,
            organ=organ,
            severity=severity,
            age_band=age_band,
            gender=gender,
        )
        if row:
            texts.append(sanitize_public_text(row.tendency_text))
            watch_points.append(sanitize_public_text(row.watch_point))

    if match_status == "CONFIRMED":
        lead = (
            "Constitutional Baseline and visual temperament findings align on the same dosha pattern. "
        )
    elif match_status == "PARTIAL":
        lead = (
            "Visual findings partially confirm the secondary constitutional tendency while primary baseline remains distinct. "
        )
    else:
        lead = (
            "Visual temperament suggests a dual constitutional pattern relative to the name-derived baseline. "
        )

    correlation_text = lead + " ".join(texts[:2])
    if not texts:
        correlation_text = baseline["baseline_text"]

    return {
        "number": number,
        "numerology_dosha": primary,
        "numerology_secondary": secondary,
        "numerology_organs": base_organs,
        "photo_dosha": photo_dosha,
        "match_status": match_status,
        "combined_organs": combined_organs,
        "correlation_text": sanitize_public_text(correlation_text),
        "watch_points": watch_points or baseline["watch_points"],
        "baseline_text": baseline["baseline_text"],
        "focus_areas": baseline["focus_areas"],
        "note": sanitize_public_text(correlation_text[:280] + ("…" if len(correlation_text) > 280 else "")),
        "watch": (watch_points or baseline["watch_points"])[:4],
    }
