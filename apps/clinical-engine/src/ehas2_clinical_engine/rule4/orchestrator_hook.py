from __future__ import annotations

import os
from collections.abc import Callable
from typing import Any

from .evaluator import Rule4ConfigurationError, evaluate_rule4_empty
from .mode import parse_rule4_engine_mode
from .validate import RULE4_CONTRACT_VERSION

RULE4_RULESET_VERSION = "ehas2-rule4-ruleset-v1-frozen-doc-4c35469"
RULE4_SHADOW_ENVELOPE_LABEL = "RULE4_SHADOW_PHASE1"
RULE4_SHADOW_COLLECTOR_PROTOCOL_VERSION = "rule4-shadow-collector-v1"

Rule4ShadowCollector = Callable[[dict[str, Any]], None]


class Rule4ShadowCollectorError(Rule4ConfigurationError):
    """Collector failed — stable code only; do not swallow as successful orchestration."""


def build_rule4_input_from_orchestrator_payload(payload: dict, *, engine_mode: str) -> dict:
    slots = payload.get("formula_slots") or payload.get("formulaSlots") or []
    return {
        "contract_version": RULE4_CONTRACT_VERSION,
        "case_id": payload.get("case_id") or payload.get("caseId"),
        "consultation_id": payload.get("consultation_id") or payload.get("consultationId"),
        "ruleset_version": payload.get("ruleset_version") or RULE4_RULESET_VERSION,
        "engine_mode": engine_mode,
        "label": "SYNTHETIC",
        "formula_slots": slots,
        "verified_age": payload.get("verified_age")
        or {"age_years": None, "verification_status": "MISSING"},
        "patient_wide_safety": payload.get("patient_wide_safety")
        or {"crisis_hold": False, "prescription_hold": False, "d13_hard_stop_under_one_year": False},
        "structured_evidence_item_ids": payload.get("structured_evidence_item_ids") or [],
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
    shadow = evaluate_rule4_empty(rule4_input)
    _deliver_shadow_envelope(shadow, shadow_collector)
    return result
