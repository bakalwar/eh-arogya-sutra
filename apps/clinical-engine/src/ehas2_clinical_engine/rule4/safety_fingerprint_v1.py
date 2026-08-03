from __future__ import annotations

import hashlib
from typing import Any

from .canonical_json import canonical_stable_dumps

RULE4_SAFETY_FINGERPRINT_V1 = "rule4-safety-fingerprint-v1"


def build_rule4_safety_fingerprint_v1_payload(
    *,
    safety_gate_status: str,
    safety_status: str,
    prescription_status: str,
    hold_status: str,
    patient_wide_hold: bool,
    urgent_escalation_required: bool,
    analysis_status: str | None,
    d13_hard_stop_active: bool,
    age_verification: str,
    pediatric_band: str | None,
    bp_crisis: bool,
    reason_codes: list[str],
    limitation_codes: list[str],
) -> dict[str, Any]:
    return {
        "fingerprint_version": RULE4_SAFETY_FINGERPRINT_V1,
        "safety_gate_status": safety_gate_status,
        "safety_status": safety_status,
        "prescription_status": prescription_status,
        "hold_status": hold_status,
        "patient_wide_hold": patient_wide_hold,
        "urgent_escalation_required": urgent_escalation_required,
        "analysis_status": analysis_status,
        "d13_hard_stop_active": d13_hard_stop_active,
        "age_verification": age_verification,
        "pediatric_band": pediatric_band,
        "bp_crisis": bp_crisis,
        "reason_codes": sorted(set(reason_codes)),
        "limitation_codes": sorted(set(limitation_codes)),
    }


def rule4_safety_fingerprint_v1_canonical_string(**kwargs: Any) -> str:
    return canonical_stable_dumps(build_rule4_safety_fingerprint_v1_payload(**kwargs))


def rule4_safety_fingerprint_v1_hash(**kwargs: Any) -> str:
    payload = rule4_safety_fingerprint_v1_canonical_string(**kwargs)
    return hashlib.sha256(payload.encode("utf-8")).hexdigest().upper()
