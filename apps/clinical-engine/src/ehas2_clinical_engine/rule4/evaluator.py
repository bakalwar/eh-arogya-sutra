from __future__ import annotations

import copy

from ..fingerprints import fingerprint
from .empty_result_fingerprint_v1 import rule4_empty_result_fingerprint_v1_hash
from .registry_loader import load_reason_code_registry
from .registry_validation import validate_rule4_output_codes
from .safety.evaluate_safety_gate import evaluate_safety_gate
from .validate import RULE4_CONTRACT_VERSION, RULE4_CONTRACT_VERSION_PHASE2, validate_rule4_input_contract


class Rule4ConfigurationError(ValueError):
    code = "RULE4_CONFIGURATION_ERROR"


__all__ = [
    "Rule4ConfigurationError",
    "evaluate_rule4_empty",
    "load_reason_code_registry",
]


def _uses_phase2_safety(input_contract: dict) -> bool:
    if input_contract.get("contract_version") == RULE4_CONTRACT_VERSION_PHASE2:
        return True
    if input_contract.get("bp_readings") is not None:
        return True
    if input_contract.get("structured_critical_findings") is not None:
        return True
    if input_contract.get("structured_frozen_red_flags") is not None:
        return True
    if input_contract.get("raw_lab_keyword_present") is not None:
        return True
    return False


def _map_safety_gate(safety) -> dict:
    return {
        "safety_gate_status": safety.safety_gate_status,
        "safety_status": safety.safety_status,
        "prescription_status": safety.prescription_status,
        "hold_status": safety.hold_status,
        "patient_wide_hold": safety.patient_wide_hold,
        "urgent_escalation_required": safety.urgent_escalation_required,
        "analysis_status": safety.analysis_status,
        "clinical_prescription_summary": safety.clinical_prescription_summary,
        "d13_hard_stop_active": safety.d13_hard_stop_active,
        "safety_notice_key": safety.safety_notice_key,
        "safety_clear_for_future_cascade": safety.safety_clear_for_future_cascade,
        "deterministic_safety_fingerprint": safety.deterministic_safety_fingerprint,
        "reason_codes": safety.reason_codes,
        "limitation_codes": safety.limitation_codes,
        "age_verification_status": safety.age_resolution.verification_status,
        "pediatric_band": safety.age_resolution.pediatric_band,
    }


def _slot_template_from_safety(safety) -> dict:
    if safety.patient_wide_hold or safety.d13_hard_stop_active:
        return {
            "potency_status": "BLOCKED_BY_PATIENT_WIDE_SAFETY_GATE",
            "reason_codes": sorted(set(["BLOCKED_BY_PATIENT_WIDE_SAFETY_GATE", *safety.reason_codes])),
            "limitation_codes": safety.limitation_codes,
        }
    age = safety.age_resolution
    if age.verification_status in {"MISSING", "INVALID", "CONTRADICTORY", "UNRESOLVED"}:
        return {
            "potency_status": "UNRESOLVED",
            "reason_codes": sorted(set([*age.reason_codes, *safety.reason_codes])),
            "limitation_codes": safety.limitation_codes,
        }
    if safety.safety_clear_for_future_cascade:
        return {
            "potency_status": "NOT_EVALUATED",
            "reason_codes": sorted(
                set(["RULE4_PHASE1_EVALUATOR_NOT_IMPLEMENTED", *safety.reason_codes])
            ),
            "limitation_codes": sorted(
                set(["PHASE1_NO_CLINICAL_EVALUATION", *safety.limitation_codes])
            ),
        }
    return {
        "potency_status": "UNRESOLVED",
        "reason_codes": sorted(set(safety.reason_codes)),
        "limitation_codes": safety.limitation_codes,
    }


def _evaluate_phase2(input_contract: dict) -> dict:
    safety = evaluate_safety_gate(input_contract, fingerprint_fn=fingerprint)
    slot_tpl = _slot_template_from_safety(safety)
    slots_out = []
    for slot in input_contract.get("formula_slots") or []:
        slots_out.append(
            {
                "formula_slot_id": slot["formula_slot_id"],
                "formula_target_id": slot.get("formula_target_id"),
                "potency_status": slot_tpl["potency_status"],
                "selected_dilution": None,
                "selected_cascade": None,
                "reason_codes": slot_tpl["reason_codes"],
                "limitation_codes": slot_tpl["limitation_codes"],
                "evidence_item_ids": list(slot.get("structured_evidence_item_ids") or []),
            }
        )
    core = {
        "contract_version": input_contract.get("contract_version", RULE4_CONTRACT_VERSION_PHASE2),
        "ruleset_version": input_contract["ruleset_version"],
        "execution_status": "NOT_IMPLEMENTED",
        "engine_mode": input_contract.get("engine_mode", "shadow"),
        "automatic_potency_runtime": False,
        "automatic_prescription_issuance_runtime": False,
        "current_runtime_potency_delta": "NONE",
        "current_runtime_issuance_delta": "NONE",
        "final_doctor_approval_required": True,
        "prescription_issue_allowed": False,
        "slots": slots_out,
        "reason_codes": slot_tpl["reason_codes"],
        "limitation_codes": safety.limitation_codes,
        "safety_gate": _map_safety_gate(safety),
    }
    validate_rule4_output_codes(core)
    core["deterministic_fingerprint"] = rule4_empty_result_fingerprint_v1_hash(
        contract_version=core["contract_version"],
        ruleset_version=core["ruleset_version"],
        execution_status=core["execution_status"],
        engine_mode=core["engine_mode"],
        prescription_issue_allowed=core["prescription_issue_allowed"],
        deterministic_safety_fingerprint=safety.deterministic_safety_fingerprint,
        slots=slots_out,
    )
    return core


def evaluate_rule4_shadow_bundle(input_contract: dict) -> dict:
    result = evaluate_rule4_empty(input_contract)
    evidence = None
    if input_contract.get("engine_mode") == "shadow" and input_contract.get("evidence_adapter"):
        from .evidence.evaluate_evidence_adapter import evaluate_evidence_adapter

        evidence = evaluate_evidence_adapter(input_contract["evidence_adapter"])
    return {"result": result, "evidence_adapter": evidence}


def evaluate_rule4_empty(input_contract: dict) -> dict:
    validate_rule4_input_contract(input_contract)
    mode = input_contract.get("engine_mode", "off")
    if mode == "active":
        raise Rule4ConfigurationError("RULE4_ENGINE_MODE_ACTIVE_NOT_IMPLEMENTED")

    if _uses_phase2_safety(input_contract):
        return _evaluate_phase2(input_contract)

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
