from __future__ import annotations

from ..polarity.quarantine_probe import evaluate_quarantine_probe, validate_quarantine_probe_shape
from ..registry_paths import RULE4_CONTRACT_VERSION_PHASE7_CANDIDATE_ELIGIBILITY
from .eligibility_code_validation import validate_eligibility_output_codes
from .eligibility_fingerprint_v1 import fingerprint_from_eligibility_output
from .resolve_slot_eligibility import resolve_slot_eligibility


class Rule4EligibilityAdapterValidationError(ValueError):
    code = "RULE4_ELIGIBILITY_ADAPTER_VALIDATION_FAILED"


def validate_eligibility_adapter_input(input_contract: dict) -> None:
    if input_contract.get("contract_version") != RULE4_CONTRACT_VERSION_PHASE7_CANDIDATE_ELIGIBILITY:
        raise Rule4EligibilityAdapterValidationError(
            "contract_version not supported for Phase 7 candidate eligibility"
        )
    if not input_contract.get("ruleset_version") or not input_contract.get("registry_version"):
        raise Rule4EligibilityAdapterValidationError("ruleset_version and registry_version required")
    if input_contract.get("label") not in {"SYNTHETIC", "PRODUCTION"}:
        raise Rule4EligibilityAdapterValidationError("label must be SYNTHETIC or PRODUCTION")
    if (
        input_contract.get("trusted_synthetic_eligibility_bypass") is True
        and input_contract.get("label") != "SYNTHETIC"
    ):
        raise Rule4EligibilityAdapterValidationError(
            "trusted_synthetic_eligibility_bypass requires label SYNTHETIC"
        )
    validate_quarantine_probe_shape(input_contract.get("quarantine_probe"))


def evaluate_eligibility_adapter(
    input_contract: dict,
    *,
    safety_gate: dict | None = None,
    evidence_adapter: dict | None = None,
    polarity_routing: dict | None = None,
    phase_resolution: dict | None = None,
    severity_resolution: dict | None = None,
    binding_gate_mandatory: bool = True,
) -> dict:
    validate_eligibility_adapter_input(input_contract)
    quarantine = evaluate_quarantine_probe(input_contract.get("quarantine_probe"))
    by_slot = {r["formula_slot_id"]: r for r in input_contract.get("formula_eligibility_records") or []}
    context = {
        "safety_gate": safety_gate,
        "evidence_adapter": evidence_adapter,
        "polarity_routing": polarity_routing,
        "phase_resolution": phase_resolution,
        "severity_resolution": severity_resolution,
        "binding_gate_mandatory": binding_gate_mandatory,
    }
    slot_resolutions = [
        resolve_slot_eligibility(by_slot.get(slot_id), slot_id, input_contract, context)
        for slot_id in input_contract.get("formula_slot_ids") or []
    ]

    reason_codes = sorted(
        set(
            [
                *quarantine["reason_codes"],
                *(c for s in slot_resolutions for c in s["reason_codes"]),
                "ELIGIBILITY_ALONE_NOT_A_POTENCY_SELECTOR",
                "FAMILY_ELIGIBILITY_NOT_NUMERIC_SELECTION",
            ]
        )
    )
    if input_contract.get("label") == "PRODUCTION":
        reason_codes = sorted(set([*reason_codes, "PRODUCTION_ELIGIBILITY_STRUCTURED_INPUT_REQUIRED"]))

    limitation_parts: list[str] = []
    if quarantine["blocked"]:
        limitation_parts.append("PHASE7_NO_NUMERIC_SELECTION")
    for slot in slot_resolutions:
        limitation_parts.extend(slot["limitation_codes"])
    limitation_parts.extend(
        [
            "PHASE7_NO_NUMERIC_SELECTION",
            "PHASE8_TEMPERAMENT_TIE_BREAK_DEFERRED",
        ]
    )
    limitation_codes = sorted(set(limitation_parts))
    if (
        input_contract.get("label") == "SYNTHETIC"
        and input_contract.get("trusted_synthetic_eligibility_bypass")
    ):
        limitation_codes = sorted(
            set([*limitation_codes, "TRUSTED_SYNTHETIC_ELIGIBILITY_BYPASS_TEST_ONLY"])
        )

    core = {
        "contract_version": input_contract["contract_version"],
        "ruleset_version": input_contract["ruleset_version"],
        "registry_version": input_contract["registry_version"],
        "execution_status": "NOT_IMPLEMENTED",
        "automatic_potency_runtime": False,
        "automatic_prescription_issuance_runtime": False,
        "prescription_issue_allowed": False,
        "current_runtime_potency_delta": "NONE",
        "final_doctor_approval_required": True,
        "selection_status": "NOT_STARTED",
        "slot_resolutions": slot_resolutions,
        "reason_codes": reason_codes,
        "limitation_codes": limitation_codes,
        "deterministic_candidate_eligibility_fingerprint": "",
    }
    core["deterministic_candidate_eligibility_fingerprint"] = fingerprint_from_eligibility_output(core)
    validate_eligibility_output_codes(core)
    return core
