"""
EH organ system descriptions — DATA ONLY (no medicines / formulas).
"""
from __future__ import annotations

from typing import Any, Dict, List

EHS: Dict[str, Dict[str, str]] = {
    "RENAL": {
        "description": "Kidney filtration and fluid-electrolyte balance.",
        "dosha": "Kaph + Vat",
        "typical_pathology": "Reduced clearance, fluid retention, elevated creatinine/uric acid.",
    },
    "LIVER": {
        "description": "Hepatic detoxification, bile flow, and metabolic processing.",
        "dosha": "Pitt",
        "typical_pathology": "Enzyme elevation, sluggish bile, lymphatic overflow through skin.",
    },
    "CARDIAC": {
        "description": "Arterial and venous circulation, heart muscle workload.",
        "dosha": "Pitt + Vat",
        "typical_pathology": "BP imbalance, circulatory congestion, reduced tissue perfusion.",
    },
    "GYNE": {
        "description": "Pelvic and reproductive organ congestion.",
        "dosha": "Kaph",
        "typical_pathology": "Hormonal stagnation, pelvic fluid retention, cyclical symptoms.",
    },
    "METABOLIC": {
        "description": "Constitutional energy, glucose handling, endocrine tone.",
        "dosha": "Kaph + Pitt",
        "typical_pathology": "Fatigue, weight shift, glycemic instability.",
    },
    "NEURO": {
        "description": "Peripheral nerves, spinal pathways, CNS regulation.",
        "dosha": "Vat",
        "typical_pathology": "Tingling, weakness, stress-linked symptom flares.",
    },
    "JOINTS": {
        "description": "Bone, cartilage, synovial and lymph around joints.",
        "dosha": "Vat + Kaph",
        "typical_pathology": "Stiffness, degenerative change, inflammatory swelling.",
    },
    "RESPIRATORY": {
        "description": "Bronchial tree, lung parenchyma, upper airway lymph.",
        "dosha": "Kaph + Vat",
        "typical_pathology": "Congestion, wheeze, recurrent cough, low oxygen reserve.",
    },
    "GLANDULAR": {
        "description": "Lymph nodes, glands, immune surveillance tissue.",
        "dosha": "Kaph",
        "typical_pathology": "Swollen nodes, chronic drainage lag, recurrent infections.",
    },
    "GASTRIC": {
        "description": "Stomach acid, enzymes, upper GI motility.",
        "dosha": "Pitt + Vat",
        "typical_pathology": "Acidity, bloating, poor appetite, post-meal distress.",
    },
    "FEVER": {
        "description": "Active infection-inflammatory response.",
        "dosha": "Pitt",
        "typical_pathology": "Elevated temperature, leukocytosis, systemic inflammation.",
    },
    "SKIN": {
        "description": "Cutaneous lymph overflow and blood-toxin expression.",
        "dosha": "Pitt + Kaph",
        "typical_pathology": "Rash, dryness, pigmentation, chronic dermatitis.",
    },
    "CONSTIPATION": {
        "description": "Colonic motility and pelvic nerve reflex.",
        "dosha": "Vat",
        "typical_pathology": "Infrequent stools, hard evacuation, abdominal heaviness.",
    },
    "PARASITIC": {
        "description": "Intestinal parasitic load and mucosal irritation.",
        "dosha": "Kaph + Pitt",
        "typical_pathology": "Itching, malabsorption, cyclical GI upset.",
    },
}


def get_organ_info(systems: List[str]) -> List[Dict[str, Any]]:
    out: List[Dict[str, Any]] = []
    for raw in systems or []:
        key = str(raw or "").strip().upper()
        if not key:
            continue
        row = EHS.get(key)
        if row:
            out.append({"system": key, **row})
        else:
            out.append(
                {
                    "system": key,
                    "description": f"{key.replace('_', ' ').title()} system involvement noted clinically.",
                    "dosha": "Mixed",
                    "typical_pathology": "Pattern requires correlation with symptoms and labs.",
                }
            )
    return out
