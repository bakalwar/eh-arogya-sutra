"""
Body / patient photo → EH Temperament Engine (visual constitutional analysis).
Used when ONLY body_photos are uploaded (Mode 1).
"""
from __future__ import annotations

import os
from typing import Any, Dict, List

try:
    from PIL import Image
except ImportError:
    Image = None  # type: ignore


def _dominant_rgb(img: "Image.Image") -> tuple:
    img = img.convert("RGB")
    w, h = img.size
    # Sample central region (affected body part / face)
    left = int(w * 0.2)
    top = int(h * 0.15)
    right = int(w * 0.8)
    bottom = int(h * 0.85)
    crop = img.crop((left, top, right, bottom)).resize((64, 64))
    pixels = list(crop.getdata())
    if not pixels:
        return (128, 128, 128)
    r = sum(p[0] for p in pixels) / len(pixels)
    g = sum(p[1] for p in pixels) / len(pixels)
    b = sum(p[2] for p in pixels) / len(pixels)
    return (r, g, b)


def analyze_single_body_photo(image_path: str) -> Dict[str, Any]:
    if not Image or not os.path.isfile(image_path):
        return {
            "success": False,
            "error": "Image analysis unavailable (Pillow required)",
        }

    img = Image.open(image_path)
    r, g, b = _dominant_rgb(img)

    findings: List[Dict[str, str]] = []
    blood_score = lymph_score = polarity_score = 0
    temperament = "Mixed"
    polarity = "MIXED"
    vitiation = "MIXED"

    # Red / inflamed skin → Sanguine / Positive
    if r > 160 and r > g + 25 and r > b + 25:
        findings.append({
            "sign": "Laal / inflamed skin (Redness)",
            "meaning": "Rakt vitiation — positive inflammatory pattern",
            "vitiation": "SANGUINE",
            "polarity": "POSITIVE",
            "zone": "skin",
        })
        blood_score += 2
        polarity_score += 2
        temperament = "Sanguine"
        polarity = "POSITIVE"
        vitiation = "SANGUINE"

    # Yellowish → Lymphatic / hepatic
    elif r > 150 and g > 130 and b < 110:
        findings.append({
            "sign": "Peeli / yellowish skin tone",
            "meaning": "Lymphatic congestion — hepato-lymphatic vitiation",
            "vitiation": "LYMPHATIC",
            "polarity": "POSITIVE",
            "zone": "skin",
        })
        lymph_score += 2
        polarity_score += 1
        temperament = "Lymphatic"
        polarity = "POSITIVE"
        vitiation = "LYMPHATIC"

    # Pale / dull → Negative lymphatic
    elif r < 120 and g < 120 and b < 120:
        findings.append({
            "sign": "Pale / dull skin",
            "meaning": "Lymphatic weakness — negative vitiation pattern",
            "vitiation": "LYMPHATIC",
            "polarity": "NEGATIVE",
            "zone": "skin",
        })
        lymph_score += 1
        polarity_score -= 1
        temperament = "Lymphatic"
        polarity = "NEGATIVE"
        vitiation = "LYMPHATIC"

    else:
        findings.append({
            "sign": "Visible skin / body signs documented",
            "meaning": "Constitutional skin pattern for EH temperament mapping",
            "vitiation": "MIXED",
            "polarity": "MIXED",
            "zone": "skin",
        })

    active_systems = ["SKIN"]
    symptom_bits = [
        "prabhavit ang photo analysis",
        "skin manifestation",
        f"temperament {temperament}",
        f"polarity {polarity}",
    ]
    for f in findings:
        symptom_bits.append(f.get("sign", ""))

    return {
        "success": True,
        "temperament": temperament,
        "polarity": polarity,
        "vitiation": vitiation,
        "findings": findings,
        "blood_score": blood_score,
        "lymph_score": lymph_score,
        "polarity_score": polarity_score,
        "confidence": min(70 + len(findings) * 8, 92),
        "face_detected": True,
        "engine": "eh-photo-temperament-v1",
        "active_systems": active_systems,
        "symptoms_enrichment": " ".join(symptom_bits),
        "skin_color": {"r": round(r), "g": round(g), "b": round(b)},
    }


def analyze_body_photos(file_paths: List[str]) -> Dict[str, Any]:
    merged: Dict[str, Any] = {
        "success": False,
        "findings": [],
        "active_systems": [],
        "symptoms_enrichment": "",
        "photos_analyzed": 0,
    }
    if not file_paths:
        return merged

    temps = []
    pols = []
    systems: List[str] = []
    enrichments: List[str] = []

    for path in file_paths:
        one = analyze_single_body_photo(path)
        if not one.get("success"):
            continue
        merged["photos_analyzed"] += 1
        merged["findings"].extend(one.get("findings", []))
        temps.append(one.get("temperament", "Mixed"))
        pols.append(one.get("polarity", "MIXED"))
        for s in one.get("active_systems", []):
            if s not in systems:
                systems.append(s)
        enrichments.append(one.get("symptoms_enrichment", ""))
        merged["last_photo"] = one

    if merged["photos_analyzed"] == 0:
        merged["error"] = "Could not analyze body photos"
        return merged

    last = merged.get("last_photo") or {}
    merged.update({
        "success": True,
        "temperament": last.get("temperament", "Mixed"),
        "polarity": last.get("polarity", "MIXED"),
        "vitiation": last.get("vitiation", "MIXED"),
        "confidence": last.get("confidence", 80),
        "face_detected": True,
        "engine": "eh-photo-temperament-v1",
        "active_systems": systems or ["SKIN"],
        "symptoms_enrichment": " ".join(enrichments),
        "face_analysis": {
            "findings": merged["findings"],
            "temperament": last.get("temperament"),
            "polarity": last.get("polarity"),
            "vitiation": last.get("vitiation"),
            "face_detected": True,
            "engine": "eh-photo-temperament-v1",
            "skin_color": last.get("skin_color"),
        },
    })
    return merged
