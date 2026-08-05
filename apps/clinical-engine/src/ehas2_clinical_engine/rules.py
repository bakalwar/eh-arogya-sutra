from __future__ import annotations

from . import ENGINE_VERSION, RULE_SET_VERSION

RULE_DEFINITIONS = [
    {"rule_number": 1, "rule_name": "Temperament (Prakriti)", "status": "READY_FOR_VALIDATION"},
    {"rule_number": 2, "rule_name": "Polarity", "status": "READY_FOR_VALIDATION"},
    {"rule_number": 3, "rule_name": "Organ / System Affinity", "status": "READY_FOR_VALIDATION"},
    {"rule_number": 4, "rule_name": "Potency", "status": "READY_FOR_VALIDATION"},
    {
        "rule_number": 5,
        "rule_name": "Monitoring, Follow-up & Post-Release Safety Surveillance",
        "status": "NOT_IMPLEMENTED",
    },
    {
        "rule_number": 6,
        "rule_name": "Multi-Disease / Organ-System Triad",
        "status": "READY_FOR_VALIDATION",
    },
    {"rule_number": 7, "rule_name": "External Use Routes", "status": "READY_FOR_VALIDATION"},
    {
        "rule_number": 8,
        "rule_name": "Disease-level Prakruti Inference",
        "status": "NOT_IMPLEMENTED",
    },
    {"rule_number": 9, "rule_name": "Master Pipeline", "status": "READY_FOR_VALIDATION"},
]


def rule_interface_status() -> list[dict]:
    out = []
    for r in RULE_DEFINITIONS:
        out.append(
            {
                **r,
                "evidence": [],
                "confidence": None,
                "warnings": (
                    ["Historically unwired on legacy live path"]
                    if r["status"] == "NOT_IMPLEMENTED"
                    else []
                ),
                "unknown_unresolved_reason": (
                    r["status"] if r["status"] in {"NOT_IMPLEMENTED", "UNRESOLVED"} else None
                ),
                "source_version": RULE_SET_VERSION,
                "deterministic_fingerprint": None,
            }
        )
    return out


def orchestration_status() -> dict:
    return {
        "status": "READY_FOR_VALIDATION",
        "production_analyze_complete": "NOT_CONNECTED",
        "prescription_engine": "PRESCRIPTION_ENGINE_NOT_CONNECTED",
        "engine_version": ENGINE_VERSION,
        "rule_set_version": RULE_SET_VERSION,
        "ready": False,
        "clinical_readiness": False,
    }
