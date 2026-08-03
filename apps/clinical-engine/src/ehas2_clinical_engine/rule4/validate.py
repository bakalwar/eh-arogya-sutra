from __future__ import annotations

from .registry_paths import RULE4_CONTRACT_VERSION, RULE4_CONTRACT_VERSION_PHASE2

RULE4_FORBIDDEN_SELECTOR_KEYS = frozenset(
    {
        "global_text",
        "globalText",
        "sys_text_full",
        "sysTextFull",
        "disease_keyword",
        "registry_nearest_match",
        "potency_logic",
    }
)

ACCEPTED_CONTRACT_VERSIONS = frozenset({RULE4_CONTRACT_VERSION, RULE4_CONTRACT_VERSION_PHASE2})


class Rule4ValidationError(ValueError):
    code = "RULE4_INPUT_VALIDATION_FAILED"


def _assert_no_forbidden_keys(obj: dict, path: str) -> None:
    for key in obj:
        if key in RULE4_FORBIDDEN_SELECTOR_KEYS:
            raise Rule4ValidationError(f"Forbidden Rule4 selector input at {path}.{key}")


def validate_rule4_input_contract(input_contract: dict) -> None:
    version = input_contract.get("contract_version")
    if not version:
        raise Rule4ValidationError("contract_version required")
    if version not in ACCEPTED_CONTRACT_VERSIONS:
        raise Rule4ValidationError("contract_version not supported")
    if not input_contract.get("ruleset_version"):
        raise Rule4ValidationError("ruleset_version required")
    label = input_contract.get("label")
    if label not in {"SYNTHETIC", "PRODUCTION"}:
        raise Rule4ValidationError("label must be SYNTHETIC or PRODUCTION")
    slots = input_contract.get("formula_slots")
    if not isinstance(slots, list):
        raise Rule4ValidationError("formula_slots must be a list")
    _assert_no_forbidden_keys(input_contract, "input")
    for slot in slots:
        if not isinstance(slot, dict):
            raise Rule4ValidationError("each formula slot must be an object")
        if not slot.get("formula_slot_id"):
            raise Rule4ValidationError("formula_slot_id required on each slot")
        _assert_no_forbidden_keys(slot, f"slot:{slot.get('formula_slot_id')}")
    for i, reading in enumerate(input_contract.get("bp_readings") or []):
        if not isinstance(reading, dict):
            raise Rule4ValidationError(f"bp_readings[{i}] must be object")
        if not reading.get("evidence_status"):
            raise Rule4ValidationError(f"bp_readings[{i}].evidence_status required")
    raw_kw = input_contract.get("raw_lab_keyword_present")
    if raw_kw is not None and not isinstance(raw_kw, bool):
        raise Rule4ValidationError("raw_lab_keyword_present must be boolean when provided")
