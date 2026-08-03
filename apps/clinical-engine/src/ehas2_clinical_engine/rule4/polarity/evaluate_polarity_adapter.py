from __future__ import annotations

from ..registry_paths import RULE4_CONTRACT_VERSION_PHASE4_POLARITY
from ..registry_validation import validate_rule4_output_codes
from .binding_gate import (
    TRUSTED_SYNTHETIC_BINDING_BYPASS_LIMITATION,
    apply_polarity_binding_gate,
    trusted_synthetic_binding_bypass_active,
)
from .pathway_router import route_polarity_for_slots
from .polarity_fingerprint_v1 import fingerprint_from_polarity_output
from .quarantine_probe import (
    Rule4PolarityAdapterValidationError,
    evaluate_quarantine_probe,
    validate_quarantine_probe_shape,
)


def _validate_polarity_output_codes(output: dict) -> None:
    validate_rule4_output_codes(
        {
            "reason_codes": output["reason_codes"],
            "limitation_codes": output["limitation_codes"],
            "slots": [
                {
                    "reason_codes": slot["reason_codes"],
                    "limitation_codes": slot["limitation_codes"],
                }
                for slot in output["slot_routings"]
            ],
        }
    )


def validate_polarity_adapter_input(input_contract: dict) -> None:
    if input_contract.get("contract_version") != RULE4_CONTRACT_VERSION_PHASE4_POLARITY:
        raise Rule4PolarityAdapterValidationError(
            "contract_version not supported for Phase 4 polarity"
        )
    if not input_contract.get("ruleset_version") or not input_contract.get("registry_version"):
        raise Rule4PolarityAdapterValidationError("ruleset_version and registry_version required")
    if not isinstance(input_contract.get("formula_polarities"), list) or not isinstance(
        input_contract.get("formula_slot_ids"), list
    ):
        raise Rule4PolarityAdapterValidationError(
            "formula_polarities and formula_slot_ids required"
        )
    label = input_contract.get("label")
    if label not in {"SYNTHETIC", "PRODUCTION"}:
        raise Rule4PolarityAdapterValidationError("label must be SYNTHETIC or PRODUCTION")
    if input_contract.get("trusted_synthetic_binding_bypass") is True:
        if label != "SYNTHETIC":
            raise Rule4PolarityAdapterValidationError(
                "trusted_synthetic_binding_bypass requires label SYNTHETIC"
            )
    if label == "PRODUCTION" and input_contract.get("trusted_synthetic_binding_bypass") is True:
        raise Rule4PolarityAdapterValidationError(
            "trusted_synthetic_binding_bypass prohibited for PRODUCTION"
        )
    summary = input_contract.get("case_polarity_summary")
    if summary and summary.get("must_not_drive_selection") is False:
        raise Rule4PolarityAdapterValidationError("case_polarity_summary must not drive selection")
    validate_quarantine_probe_shape(input_contract.get("quarantine_probe"))


def _apply_safety_gate(routings: list[dict], safety_gate: dict | None) -> list[dict]:
    if not safety_gate:
        return routings
    if not (safety_gate.get("patient_wide_hold") or safety_gate.get("d13_hard_stop_active")):
        return routings
    sg_reason = list(safety_gate.get("reason_codes") or [])
    sg_lim = list(safety_gate.get("limitation_codes") or [])
    out: list[dict] = []
    for r in routings:
        out.append(
            {
                **r,
                "pathway": "BLOCKED_BY_SAFETY_GATE",
                "potency_status": "BLOCKED_BY_PATIENT_WIDE_SAFETY_GATE",
                "reason_codes": sorted(
                    set(["BLOCKED_BY_PATIENT_WIDE_SAFETY_GATE", *r["reason_codes"], *sg_reason])
                ),
                "limitation_codes": sorted(set([*r["limitation_codes"], *sg_lim])),
            }
        )
    return out


def evaluate_polarity_adapter(
    input_contract: dict,
    *,
    safety_gate: dict | None = None,
    evidence_adapter: dict | None = None,
    binding_gate_mandatory: bool = True,
) -> dict:
    validate_polarity_adapter_input(input_contract)
    quarantine = evaluate_quarantine_probe(input_contract.get("quarantine_probe"))
    routings = route_polarity_for_slots(
        list(input_contract["formula_slot_ids"]),
        list(input_contract.get("formula_polarities") or []),
    )
    routings = _apply_safety_gate(routings, safety_gate)
    routings = apply_polarity_binding_gate(
        routings,
        input_contract,
        evidence_adapter,
        binding_gate_mandatory=binding_gate_mandatory,
    )

    reason_codes = sorted(
        set([*quarantine["reason_codes"], *(c for r in routings for c in r["reason_codes"])])
    )
    limitation_codes = sorted(
        set(
            [
                *(["PHASE4_NO_NUMERIC_CASCADE"] if quarantine["blocked"] else []),
                *(c for r in routings for c in r["limitation_codes"]),
            ]
        )
    )
    if (
        not binding_gate_mandatory
        and trusted_synthetic_binding_bypass_active(input_contract)
        and any(
            TRUSTED_SYNTHETIC_BINDING_BYPASS_LIMITATION in r["limitation_codes"] for r in routings
        )
    ):
        limitation_codes = sorted(
            set([*limitation_codes, TRUSTED_SYNTHETIC_BINDING_BYPASS_LIMITATION])
        )

    core = {
        "contract_version": input_contract["contract_version"],
        "ruleset_version": input_contract["ruleset_version"],
        "registry_version": input_contract["registry_version"],
        "execution_status": "NOT_IMPLEMENTED",
        "current_runtime_potency_delta": "NONE",
        "slot_routings": routings,
        "reason_codes": reason_codes,
        "limitation_codes": limitation_codes,
        "deterministic_polarity_routing_fingerprint": "",
    }
    core["deterministic_polarity_routing_fingerprint"] = fingerprint_from_polarity_output(core)
    _validate_polarity_output_codes(core)
    return core
