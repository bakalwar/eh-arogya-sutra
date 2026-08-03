from __future__ import annotations

from ..fingerprints import fingerprint
from .registry_loader import load_reason_code_registry
from .registry_validation import validate_rule4_output_codes
from .validate import RULE4_CONTRACT_VERSION, validate_rule4_input_contract


class Rule4ConfigurationError(ValueError):
    code = "RULE4_CONFIGURATION_ERROR"


__all__ = [
    "Rule4ConfigurationError",
    "evaluate_rule4_empty",
    "load_reason_code_registry",
]


def evaluate_rule4_empty(input_contract: dict) -> dict:
    validate_rule4_input_contract(input_contract)
    mode = input_contract.get("engine_mode", "off")
    if mode == "active":
        raise Rule4ConfigurationError("RULE4_ENGINE_MODE_ACTIVE_NOT_IMPLEMENTED")

    slots_out = []
    for slot in input_contract.get("formula_slots") or []:
        slots_out.append(
            {
                "formula_slot_id": slot["formula_slot_id"],
                "formula_target_id": slot.get("formula_target_id"),
                "potency_status": "NOT_EVALUATED",
                "selected_dilution": None,
                "selected_cascade": None,
                "reason_codes": ["RULE4_PHASE1_EVALUATOR_NOT_IMPLEMENTED"],
                "limitation_codes": ["PHASE1_NO_CLINICAL_EVALUATION"],
                "evidence_item_ids": list(slot.get("structured_evidence_item_ids") or []),
            }
        )

    core = {
        "contract_version": RULE4_CONTRACT_VERSION,
        "ruleset_version": input_contract["ruleset_version"],
        "execution_status": "NOT_IMPLEMENTED",
        "engine_mode": mode,
        "automatic_potency_runtime": False,
        "automatic_prescription_issuance_runtime": False,
        "current_runtime_potency_delta": "NONE",
        "current_runtime_issuance_delta": "NONE",
        "final_doctor_approval_required": True,
        "prescription_issue_allowed": False,
        "slots": slots_out,
        "reason_codes": ["RULE4_PHASE1_EVALUATOR_NOT_IMPLEMENTED"],
        "limitation_codes": ["PHASE1_NO_CLINICAL_EVALUATION"],
    }
    validate_rule4_output_codes(core)
    fp_body = {**core, "input_fingerprint": fingerprint(input_contract)}
    core["deterministic_fingerprint"] = fingerprint(fp_body)
    return core
