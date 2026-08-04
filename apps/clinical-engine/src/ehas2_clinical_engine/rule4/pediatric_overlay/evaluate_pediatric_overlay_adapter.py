from __future__ import annotations

from ..registry_paths import RULE4_CONTRACT_VERSION_PHASE9_PEDIATRIC_OVERLAY
from .overlay_code_validation import validate_pediatric_overlay_output_codes
from .pediatric_overlay_fingerprint_v1 import fingerprint_from_pediatric_overlay_output
from .resolve_slot_pediatric_overlay import resolve_slot_pediatric_overlay

RULE4_OVERLAY_GATE_OUTCOMES = ("PASS", "FAIL")

RULE4_PEDIATRIC_OVERLAY_STATUS_VALUES = (
    "NOT_EVALUATED",
    "NOT_APPLICABLE",
    "NOT_APPLICABLE_UNDER_HARD_STOP",
    "BLOCKED_BY_SAFETY",
    "BLOCKED_D13_HS",
    "AGE_UNRESOLVED",
    "PHASE8_AUTH_FAILED",
    "OVERLAY_APPLIED",
    "OVERLAY_BLOCKED",
    "OVERLAY_UNRESOLVED",
)


class Rule4PediatricOverlayAdapterValidationError(ValueError):
    code = "RULE4_PEDIATRIC_OVERLAY_ADAPTER_VALIDATION_FAILED"


def validate_pediatric_overlay_adapter_input(input_contract: dict) -> None:
    if input_contract.get("contract_version") != RULE4_CONTRACT_VERSION_PHASE9_PEDIATRIC_OVERLAY:
        raise Rule4PediatricOverlayAdapterValidationError(
            "contractVersion not supported for Phase 9 pediatric overlay"
        )
    if not input_contract.get("ruleset_version") or not input_contract.get("registry_version"):
        raise Rule4PediatricOverlayAdapterValidationError(
            "rulesetVersion and registryVersion required"
        )
    if input_contract.get("label") not in {"SYNTHETIC", "PRODUCTION"}:
        raise Rule4PediatricOverlayAdapterValidationError("label must be SYNTHETIC or PRODUCTION")


def evaluate_pediatric_overlay_adapter(input_contract: dict, context: dict | None = None) -> dict:
    context = context or {}
    validate_pediatric_overlay_adapter_input(input_contract)
    by_slot = {
        r["formula_slot_id"]: r for r in input_contract.get("slot_overlay_records") or []
    }
    meta = {
        "ruleset_version": input_contract["ruleset_version"],
        "registry_version": input_contract["registry_version"],
    }

    slot_resolutions = [
        resolve_slot_pediatric_overlay(
            by_slot.get(slot_id), slot_id, input_contract["label"], context, meta
        )
        for slot_id in input_contract.get("formula_slot_ids") or []
    ]

    reason_codes = sorted(
        set(
            [
                "PEDIATRIC_OVERLAY_SHADOW_DRAFT_ONLY",
                "PEDIATRIC_OVERLAY_NOT_PRESCRIPTION_ISSUANCE",
                *(c for s in slot_resolutions for c in s.get("reason_codes") or []),
                *(
                    ["PRODUCTION_PEDIATRIC_OVERLAY_NOT_EVALUATED"]
                    if input_contract.get("label") == "PRODUCTION"
                    else []
                ),
            ]
        )
    )

    limitation_codes = sorted(
        set(
            [
                "SHADOW_PEDIATRIC_DRAFT_OVERLAY_ONLY",
                *(c for s in slot_resolutions for c in s.get("limitation_codes") or []),
            ]
        )
    )

    safety_gate = context.get("safety_gate") or {}
    safety_flags = {
        "d13_hs_active": bool(safety_gate.get("d13_hard_stop_active")),
        "patient_wide_hold": bool(safety_gate.get("patient_wide_hold")),
        "urgent_escalation_required": bool(safety_gate.get("urgent_escalation_required")),
    }

    core = {
        "contract_version": input_contract["contract_version"],
        "ruleset_version": input_contract["ruleset_version"],
        "registry_version": input_contract["registry_version"],
        "execution_status": "NOT_IMPLEMENTED",
        "automatic_pediatric_overlay_runtime": False,
        "automatic_prescription_issuance_runtime": False,
        "prescription_issue_allowed": False,
        "final_doctor_approval_required": True,
        "current_runtime_potency_delta": "NONE",
        "slot_resolutions": slot_resolutions,
        "reason_codes": reason_codes,
        "limitation_codes": limitation_codes,
        "deterministic_pediatric_overlay_fingerprint": "",
    }

    validate_pediatric_overlay_output_codes(core)
    core["deterministic_pediatric_overlay_fingerprint"] = fingerprint_from_pediatric_overlay_output(
        core, safety_flags
    )
    return core
