from __future__ import annotations

import os
from collections.abc import Callable
from typing import Any

from .evaluator import Rule4ConfigurationError, evaluate_rule4_empty, evaluate_rule4_shadow_bundle
from .mode import parse_rule4_engine_mode
from .validate import RULE4_CONTRACT_VERSION, RULE4_CONTRACT_VERSION_PHASE2

RULE4_RULESET_VERSION = "ehas2-rule4-ruleset-v1-frozen-doc-4c35469"
RULE4_SHADOW_ENVELOPE_LABEL = "RULE4_SHADOW_PHASE2"
RULE4_SHADOW_ENVELOPE_LABEL_PHASE3 = "RULE4_SHADOW_PHASE3"
RULE4_SHADOW_COLLECTOR_PROTOCOL_VERSION = "rule4-shadow-collector-v1"

Rule4ShadowCollector = Callable[[dict[str, Any]], None]


class Rule4ShadowCollectorError(Rule4ConfigurationError):
    """Collector failed — stable code only; do not swallow as successful orchestration."""


def build_rule4_input_from_orchestrator_payload(payload: dict, *, engine_mode: str) -> dict:
    slots = payload.get("formula_slots") or payload.get("formulaSlots") or []
    verified_age = payload.get("verified_age")
    patient_wide = payload.get("patient_wide_safety")
    return {
        "contract_version": payload.get("contract_version") or RULE4_CONTRACT_VERSION_PHASE2,
        "case_id": payload.get("case_id") or payload.get("caseId"),
        "consultation_id": payload.get("consultation_id") or payload.get("consultationId"),
        "ruleset_version": payload.get("ruleset_version") or RULE4_RULESET_VERSION,
        "engine_mode": engine_mode,
        "label": "SYNTHETIC",
        "formula_slots": slots,
        "verified_age": verified_age
        if verified_age is not None
        else {"age_years": None, "verification_status": "MISSING"},
        "patient_wide_safety": patient_wide if patient_wide is not None else {},
        "structured_evidence_item_ids": payload.get("structured_evidence_item_ids") or [],
        "bp_readings": payload.get("bp_readings"),
        "structured_critical_findings": payload.get("structured_critical_findings"),
        "structured_frozen_red_flags": payload.get("structured_frozen_red_flags"),
        "raw_lab_keyword_present": payload.get("raw_lab_keyword_present"),
    }


def _deliver_shadow_envelope(
    shadow: dict[str, Any],
    shadow_collector: Rule4ShadowCollector | None,
) -> None:
    if shadow_collector is None:
        return
    envelope = {
        "label": RULE4_SHADOW_ENVELOPE_LABEL,
        "collector_protocol_version": RULE4_SHADOW_COLLECTOR_PROTOCOL_VERSION,
        "result": shadow,
    }
    try:
        shadow_collector(envelope)
    except Rule4ShadowCollectorError:
        raise
    except Exception as exc:
        raise Rule4ShadowCollectorError("RULE4_SHADOW_COLLECTOR_FAILED") from exc


def apply_rule4_orchestrator_hook(
    result: dict[str, Any],
    payload: dict,
    *,
    shadow_collector: Rule4ShadowCollector | None = None,
) -> dict[str, Any]:
    """
    Phase 1 hook — default off leaves result unchanged.
    Shadow runs empty evaluator; envelope is passed only to an injected collector (if any).
    No module-global retention. Public result is never mutated.
    """
    mode = parse_rule4_engine_mode(os.environ.get("RULE4_ENGINE_MODE"))
    if mode == "off":
        return result
    if mode == "active":
        raise Rule4ConfigurationError("RULE4_ENGINE_MODE_ACTIVE_NOT_IMPLEMENTED")
    if mode != "shadow":
        return result

    rule4_input = build_rule4_input_from_orchestrator_payload(payload, engine_mode=mode)
    bundle = evaluate_rule4_shadow_bundle(rule4_input)
    shadow = bundle["result"]
    if bundle.get("evidence_adapter"):
        shadow = {**shadow, "evidence_adapter_shadow": bundle["evidence_adapter"]}
    _deliver_shadow_envelope(shadow, shadow_collector)
    return result
