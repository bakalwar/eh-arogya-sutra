from __future__ import annotations

from ..polarity.quarantine_probe import evaluate_quarantine_probe, validate_quarantine_probe_shape
from ..registry_paths import RULE4_CONTRACT_VERSION_PHASE8_NUMERIC_SELECTION
from .resolve_slot_selection import resolve_slot_selection
from .selection_code_validation import validate_selection_output_codes
from .selection_fingerprint_v1 import fingerprint_from_selection_output
from ..eligibility.eligibility_fingerprint_v1 import fingerprint_from_eligibility_output


class Rule4SelectionAdapterValidationError(ValueError):
    code = "RULE4_SELECTION_ADAPTER_VALIDATION_FAILED"


def validate_selection_adapter_input(input_contract: dict) -> None:
    if input_contract.get("contract_version") != RULE4_CONTRACT_VERSION_PHASE8_NUMERIC_SELECTION:
        raise Rule4SelectionAdapterValidationError(
            "contractVersion not supported for Phase 8 numeric selection"
        )
    if not input_contract.get("ruleset_version") or not input_contract.get("registry_version"):
        raise Rule4SelectionAdapterValidationError("rulesetVersion and registryVersion required")
    if input_contract.get("label") not in {"SYNTHETIC", "PRODUCTION"}:
        raise Rule4SelectionAdapterValidationError("label must be SYNTHETIC or PRODUCTION")
    if (
        input_contract.get("trusted_synthetic_selection_bypass") is True
        and input_contract.get("label") != "SYNTHETIC"
    ):
        raise Rule4SelectionAdapterValidationError(
            "trustedSyntheticSelectionBypass requires label SYNTHETIC"
        )
    validate_quarantine_probe_shape(input_contract.get("quarantine_probe"))


def evaluate_selection_adapter(input_contract: dict, context: dict | None = None) -> dict:
    context = context or {}
    validate_selection_adapter_input(input_contract)
    quarantine = evaluate_quarantine_probe(input_contract.get("quarantine_probe"))
    by_slot = {r["formula_slot_id"]: r for r in input_contract.get("slot_selection_records") or []}

    slot_resolutions = [
        resolve_slot_selection(by_slot.get(slot_id), slot_id, input_contract, context)
        for slot_id in input_contract.get("formula_slot_ids") or []
    ]

    eligibility_out = context.get("eligibility_resolution")
    upstream_fp = fingerprint_from_eligibility_output(eligibility_out) if eligibility_out else None

    reason_codes = sorted(
        set(
            [
                *quarantine.get("reason_codes", []),
                *(c for s in slot_resolutions for c in s.get("reason_codes") or []),
                "NUMERIC_SELECTION_SHADOW_DRAFT_ONLY",
                "SELECTION_NOT_PRESCRIPTION_ISSUANCE",
                *(
                    ["PRODUCTION_SELECTION_UPSTREAM_CHAIN_NOT_CONNECTED"]
                    if input_contract.get("label") == "PRODUCTION"
                    else []
                ),
            ]
        )
    )

    limitation_codes = sorted(
        set(
            [
                *(
                    ["SHADOW_DRAFT_NUMERIC_SELECTION_ONLY"]
                    if quarantine.get("blocked")
                    else []
                ),
                *(c for s in slot_resolutions for c in s.get("limitation_codes") or []),
                "SHADOW_DRAFT_NUMERIC_SELECTION_ONLY",
                *(
                    ["TRUSTED_SYNTHETIC_SELECTION_BYPASS_TEST_ONLY"]
                    if input_contract.get("label") == "SYNTHETIC"
                    and input_contract.get("trusted_synthetic_selection_bypass")
                    else []
                ),
            ]
        )
    )

    core = {
        "contract_version": input_contract["contract_version"],
        "ruleset_version": input_contract["ruleset_version"],
        "registry_version": input_contract["registry_version"],
        "execution_status": "NOT_IMPLEMENTED",
        "automatic_numeric_potency_runtime": False,
        "automatic_prescription_issuance_runtime": False,
        "prescription_issue_allowed": False,
        "final_doctor_approval_required": True,
        "current_runtime_potency_delta": "NONE",
        "slot_resolutions": slot_resolutions,
        "reason_codes": reason_codes,
        "limitation_codes": limitation_codes,
        "deterministic_numeric_selection_fingerprint": "",
    }

    core["deterministic_numeric_selection_fingerprint"] = fingerprint_from_selection_output(
        core, upstream_fp
    )
    validate_selection_output_codes(core)
    return core
