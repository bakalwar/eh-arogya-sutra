from __future__ import annotations

from ..registry_paths import RULE4_CONTRACT_VERSION_PHASE6_STRUCTURED_SEVERITY
from ..registry_validation import validate_rule4_output_codes
from ..polarity.quarantine_probe import evaluate_quarantine_probe, validate_quarantine_probe_shape
from .binding_gate import (
    TRUSTED_SYNTHETIC_SEVERITY_BINDING_BYPASS_LIMITATION,
    apply_severity_binding_gate,
    trusted_synthetic_severity_binding_bypass_active,
)
from .assertion_binding import validate_assertion_bound_target_roles
from .cross_role_leakage_guard import apply_cross_role_leakage_guard
from .upstream_context_boundary import apply_upstream_context_boundary
from .severity_fingerprint_v1 import fingerprint_from_severity_output
from .resolve_slot_severity import resolve_severity_for_slot


class Rule4SeverityAdapterValidationError(ValueError):
    code = "RULE4_SEVERITY_ADAPTER_VALIDATION_FAILED"


def _validate_severity_output_codes(output: dict) -> None:
    validate_rule4_output_codes(
        {
            "reason_codes": output["reason_codes"],
            "limitation_codes": output["limitation_codes"],
            "slots": [
                {
                    "reason_codes": slot["reason_codes"],
                    "limitation_codes": slot["limitation_codes"],
                }
                for slot in output["slot_resolutions"]
            ],
        }
    )


def validate_severity_adapter_input(input_contract: dict) -> None:
    if input_contract.get("contract_version") != RULE4_CONTRACT_VERSION_PHASE6_STRUCTURED_SEVERITY:
        raise Rule4SeverityAdapterValidationError(
            "contract_version not supported for Phase 6 structured severity"
        )
    if not input_contract.get("ruleset_version") or not input_contract.get("registry_version"):
        raise Rule4SeverityAdapterValidationError("ruleset_version and registry_version required")
    if not isinstance(input_contract.get("formula_severity_records"), list) or not isinstance(
        input_contract.get("formula_slot_ids"), list
    ):
        raise Rule4SeverityAdapterValidationError(
            "formula_severity_records and formula_slot_ids required"
        )
    label = input_contract.get("label")
    if label not in {"SYNTHETIC", "PRODUCTION"}:
        raise Rule4SeverityAdapterValidationError("label must be SYNTHETIC or PRODUCTION")
    if input_contract.get("trusted_synthetic_binding_bypass") is True and label != "SYNTHETIC":
        raise Rule4SeverityAdapterValidationError(
            "trusted_synthetic_binding_bypass requires label SYNTHETIC"
        )
    if label == "PRODUCTION" and input_contract.get("trusted_synthetic_binding_bypass") is True:
        raise Rule4SeverityAdapterValidationError(
            "trusted_synthetic_binding_bypass prohibited for PRODUCTION"
        )
    validate_quarantine_probe_shape(input_contract.get("quarantine_probe"))
    try:
        validate_assertion_bound_target_roles(input_contract["formula_severity_records"])
    except ValueError as exc:
        if str(exc) == "RULE4_SEVERITY_BOUND_TARGET_ROLE_INVALID":
            raise Rule4SeverityAdapterValidationError(
                "RULE4_SEVERITY_BOUND_TARGET_ROLE_INVALID"
            ) from exc
        raise


def _apply_safety_gate(slots: list[dict], safety_gate: dict | None) -> list[dict]:
    if not safety_gate:
        return slots
    if not (safety_gate.get("patient_wide_hold") or safety_gate.get("d13_hard_stop_active")):
        return slots
    sg_reason = list(safety_gate.get("reason_codes") or [])
    sg_lim = list(safety_gate.get("limitation_codes") or [])
    out: list[dict] = []
    for s in slots:
        out.append(
            {
                **s,
                "severity_status": "BLOCKED_BY_PATIENT_WIDE_SAFETY_GATE",
                "severity_score": None,
                "severity_band": None,
                "severity_resolution_source": "NONE",
                "reason_codes": sorted(
                    set(["BLOCKED_BY_PATIENT_WIDE_SAFETY_GATE", *s["reason_codes"], *sg_reason])
                ),
                "limitation_codes": sorted(set([*s["limitation_codes"], *sg_lim])),
            }
        )
    return out


def evaluate_severity_adapter(
    input_contract: dict,
    *,
    safety_gate: dict | None = None,
    evidence_adapter: dict | None = None,
    polarity_routing: dict | None = None,
    phase_resolution: dict | None = None,
    binding_gate_mandatory: bool = True,
) -> dict:
    validate_severity_adapter_input(input_contract)
    quarantine = evaluate_quarantine_probe(input_contract.get("quarantine_probe"))
    by_slot = {r["formula_slot_id"]: r for r in input_contract["formula_severity_records"]}
    slots: list[dict] = []
    for slot_id in input_contract["formula_slot_ids"]:
        rec = by_slot.get(slot_id)
        if not rec:
            slots.append(
                {
                    "formula_slot_id": slot_id,
                    "formula_target_id": None,
                    "target_role": "STANDARD_FORMULA_TARGET",
                    "severity_status": "TARGET_BINDING_MISSING",
                    "severity_score": None,
                    "severity_band": None,
                    "severity_resolution_source": "NONE",
                    "binding_status": "NOT_EVALUATED",
                    "evidence_item_ids": [],
                    "corroborating_source_ids": [],
                    "selected_cascade": None,
                    "selected_dilution": None,
                    "reason_codes": ["SEVERITY_VALUE_MISSING"],
                    "limitation_codes": ["PHASE6_NO_NUMERIC_CASCADE"],
                    "upstream_context_status": "NOT_EVALUATED",
                }
            )
        else:
            slots.append(resolve_severity_for_slot(rec))
    slots = apply_cross_role_leakage_guard(
        slots, input_contract["formula_severity_records"], input_contract
    )
    slots = apply_severity_binding_gate(
        slots,
        input_contract,
        evidence_adapter,
        binding_gate_mandatory=binding_gate_mandatory,
    )
    slots = apply_upstream_context_boundary(slots, polarity_routing, phase_resolution)
    slots = _apply_safety_gate(slots, safety_gate)
    reason_codes = sorted(
        set([*quarantine["reason_codes"], *(c for s in slots for c in s["reason_codes"])])
    )
    limitation_codes = sorted(
        set(
            [
                *(["PHASE6_NO_NUMERIC_CASCADE"] if quarantine["blocked"] else []),
                *(c for s in slots for c in s["limitation_codes"]),
            ]
        )
    )
    if (
        not binding_gate_mandatory
        and trusted_synthetic_severity_binding_bypass_active(input_contract)
        and any(
            TRUSTED_SYNTHETIC_SEVERITY_BINDING_BYPASS_LIMITATION in s["limitation_codes"]
            for s in slots
        )
    ):
        limitation_codes = sorted(
            set([*limitation_codes, TRUSTED_SYNTHETIC_SEVERITY_BINDING_BYPASS_LIMITATION])
        )
    core = {
        "contract_version": input_contract["contract_version"],
        "ruleset_version": input_contract["ruleset_version"],
        "registry_version": input_contract["registry_version"],
        "execution_status": "NOT_IMPLEMENTED",
        "automatic_severity_runtime": False,
        "automatic_free_text_severity_runtime": False,
        "automatic_lab_vital_severity_runtime": False,
        "automatic_potency_runtime": False,
        "automatic_prescription_issuance_runtime": False,
        "prescription_issue_allowed": False,
        "current_runtime_potency_delta": "NONE",
        "final_doctor_approval_required": True,
        "registry_q13_selector_status": "NOT_EXECUTABLE_AS_Q13_SELECTOR",
        "slot_resolutions": slots,
        "reason_codes": reason_codes,
        "limitation_codes": limitation_codes,
        "deterministic_severity_resolution_fingerprint": "",
    }
    core["deterministic_severity_resolution_fingerprint"] = fingerprint_from_severity_output(core)
    _validate_severity_output_codes(core)
    return core
