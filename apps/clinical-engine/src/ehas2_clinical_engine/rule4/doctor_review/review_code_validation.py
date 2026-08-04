from __future__ import annotations

from ..registry_loader import load_reason_code_registry
from ..registry_validation import Rule4UnknownCodeError


def _assert_known_reason(code: str, reason_set: set[str]) -> None:
    if code not in reason_set:
        raise Rule4UnknownCodeError("RULE4_UNKNOWN_REASON_CODE")


def _assert_known_limitation(code: str, limitation_set: set[str]) -> None:
    if code not in limitation_set:
        raise Rule4UnknownCodeError("RULE4_UNKNOWN_LIMITATION_CODE")


def validate_doctor_review_output_codes(output: dict) -> None:
    registry = load_reason_code_registry()
    reason_set = {entry["code"] for entry in registry["reasonCodes"]}
    limitation_set = {entry["code"] for entry in registry["limitationCodes"]}

    for code in output.get("reason_codes") or []:
        _assert_known_reason(code, reason_set)
    for code in output.get("limitation_codes") or []:
        _assert_known_limitation(code, limitation_set)
    for gate in output.get("issuance_gate_results") or []:
        for code in gate.get("reason_codes") or []:
            _assert_known_reason(code, reason_set)
