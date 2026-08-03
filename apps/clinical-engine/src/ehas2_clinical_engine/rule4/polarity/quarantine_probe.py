from __future__ import annotations

QUARANTINE_KEYS = {
    "global_text",
    "globalText",
    "sys_text_full",
    "sysTextFull",
    "disease_keyword",
    "registry_nearest_match",
    "registryNearestMatch",
    "potency_logic",
    "registry_potency_logic",
    "raw_ocr_text",
    "rawOcrText",
    "keyword_selector",
    "keywordSelector",
    "nearest_match_pathology",
    "nearestMatchPathology",
    "clinical_photo_inference",
    "clinicalPhotoInference",
}


class Rule4PolarityAdapterValidationError(ValueError):
    code = "RULE4_POLARITY_ADAPTER_VALIDATION_FAILED"


def evaluate_quarantine_probe(probe: dict | None) -> dict:
    if not probe:
        return {"blocked": False, "reason_codes": []}
    reason_codes: list[str] = []
    for key, val in probe.items():
        if key not in QUARANTINE_KEYS or val is not True:
            continue
        if key in {"global_text", "globalText", "sys_text_full", "sysTextFull"}:
            reason_codes.append("GLOBAL_TEXT_POTENCY_LEAKAGE_BLOCKED")
        elif key in {"registry_nearest_match", "registryNearestMatch", "nearest_match_pathology"}:
            reason_codes.append("REGISTRY_Q16_SELECTOR_BLOCKED")
        elif key == "disease_keyword":
            reason_codes.append("REPORT_KEYWORD_SELECTOR_BLOCKED")
        elif key in {"potency_logic", "registry_potency_logic"}:
            reason_codes.append("REGISTRY_POTENCY_SELECTOR_NOT_EXECUTABLE")
        elif key in {"raw_ocr_text", "rawOcrText"}:
            reason_codes.append("REPORT_KEYWORD_SELECTOR_BLOCKED")
        else:
            reason_codes.append("REGISTRY_Q16_SELECTOR_BLOCKED")
    codes = sorted(set(reason_codes))
    return {"blocked": len(codes) > 0, "reason_codes": codes}


def validate_quarantine_probe_shape(probe: dict | None) -> None:
    if not probe:
        return
    for key, val in probe.items():
        if key not in QUARANTINE_KEYS:
            raise Rule4PolarityAdapterValidationError("quarantine_probe key not allowed")
        if not isinstance(val, bool):
            raise Rule4PolarityAdapterValidationError("quarantine_probe value must be boolean")
