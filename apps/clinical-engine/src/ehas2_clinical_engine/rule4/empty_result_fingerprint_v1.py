from __future__ import annotations

import hashlib
from typing import Any

from .canonical_json import canonical_stable_dumps

RULE4_EMPTY_RESULT_FINGERPRINT_V1 = "rule4-empty-result-fingerprint-v1"


def build_rule4_empty_result_fingerprint_v1_payload(
    *,
    contract_version: str,
    ruleset_version: str,
    execution_status: str,
    engine_mode: str,
    prescription_issue_allowed: bool,
    deterministic_safety_fingerprint: str,
    slots: list[dict[str, Any]],
) -> dict[str, Any]:
    slot_rows = sorted(
        [
            {
                "formula_slot_id": slot["formula_slot_id"],
                "potency_status": slot["potency_status"],
                "reason_codes": sorted(set(slot.get("reason_codes") or [])),
                "limitation_codes": sorted(set(slot.get("limitation_codes") or [])),
            }
            for slot in slots
        ],
        key=lambda row: row["formula_slot_id"],
    )
    return {
        "fingerprint_version": RULE4_EMPTY_RESULT_FINGERPRINT_V1,
        "contract_version": contract_version,
        "ruleset_version": ruleset_version,
        "execution_status": execution_status,
        "engine_mode": engine_mode,
        "prescription_issue_allowed": prescription_issue_allowed,
        "deterministic_safety_fingerprint": deterministic_safety_fingerprint,
        "slots": slot_rows,
    }


def rule4_empty_result_fingerprint_v1_hash(**kwargs: Any) -> str:
    payload = canonical_stable_dumps(build_rule4_empty_result_fingerprint_v1_payload(**kwargs))
    return hashlib.sha256(payload.encode("utf-8")).hexdigest().upper()
