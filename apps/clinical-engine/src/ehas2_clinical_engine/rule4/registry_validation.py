from __future__ import annotations

from .registry_loader import load_reason_code_registry


class Rule4UnknownCodeError(ValueError):
    """Fail-closed registry membership check — message is a stable code only."""

    def __init__(self, code: str) -> None:
        super().__init__(code)
        self.code = code


def _registry_sets() -> tuple[set[str], set[str]]:
    registry = load_reason_code_registry()
    reason = {entry["code"] for entry in registry["reasonCodes"]}
    limitation = {entry["code"] for entry in registry["limitationCodes"]}
    return reason, limitation


def validate_rule4_output_codes(output: dict) -> None:
    """Validate reason_codes / limitation_codes on evaluator output (Phase 1 subset registry)."""
    reason_set, limitation_set = _registry_sets()

    def check_reason(codes: list | tuple | None) -> None:
        for code in codes or []:
            if code not in reason_set:
                raise Rule4UnknownCodeError("RULE4_UNKNOWN_REASON_CODE")

    def check_limitation(codes: list | tuple | None) -> None:
        for code in codes or []:
            if code not in limitation_set:
                raise Rule4UnknownCodeError("RULE4_UNKNOWN_LIMITATION_CODE")

    check_reason(output.get("reason_codes"))
    check_limitation(output.get("limitation_codes"))
    for slot in output.get("slots") or []:
        if not isinstance(slot, dict):
            continue
        check_reason(slot.get("reason_codes"))
        check_limitation(slot.get("limitation_codes"))
