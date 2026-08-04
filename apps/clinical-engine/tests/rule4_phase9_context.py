"""Shared Phase 8 evaluation context builders for Rule 4 Phase 9 tests (mirrors TS fixture loaders)."""

from __future__ import annotations

from typing import Any


def _snake_to_camel_key(key: str) -> str:
    parts = key.split("_")
    return parts[0] + "".join(p.capitalize() for p in parts[1:])


def snake_to_camel_deep(obj: object) -> object:
    if obj is None or not isinstance(obj, (dict, list)):
        return obj
    if isinstance(obj, list):
        return [snake_to_camel_deep(x) for x in obj]
    return {_snake_to_camel_key(k): snake_to_camel_deep(v) for k, v in obj.items()}


def phase8_evaluation_context_complete(ctx: dict[str, Any] | None) -> dict[str, Any]:
    """Mirror TS selectionEvaluationContextFromPhase8Context + Phase 8 parity tests (snake_case keys)."""
    raw = ctx or {}
    mapped: dict[str, Any] = {
        "safety_gate": raw.get("safety_gate"),
        "verified_age": raw.get("verified_age"),
        "eligibility_resolution": raw.get("eligibility_resolution"),
        "binding_gate_mandatory": raw.get("binding_gate_mandatory", True),
    }
    if raw.get("evidence_items") is not None:
        mapped["evidence_items"] = raw["evidence_items"]
    if raw.get("evidence_resolution") is not None:
        mapped["evidence_adapter"] = raw["evidence_resolution"]
    for extra in (
        "polarity_context",
        "phase_context",
        "severity_context",
        "safety_context",
        "selection_records",
    ):
        if raw.get(extra) is not None:
            mapped[extra] = raw[extra]
    return mapped


def phase8_evaluation_context_incomplete(ctx: dict[str, Any] | None) -> dict[str, Any]:
    raw = ctx or {}
    return {
        "safety_gate": raw.get("safety_gate"),
        "verified_age": raw.get("verified_age"),
        "eligibility_resolution": raw.get("eligibility_resolution"),
        "binding_gate_mandatory": raw.get("binding_gate_mandatory", True),
    }


def evaluate_pediatric_overlay_from_fixture_scenario(
    scenario: dict[str, Any],
    *,
    phase8_context_builder=phase8_evaluation_context_complete,
    phase8_fixture_rows: list[dict[str, Any]] | None = None,
) -> tuple[dict[str, Any], dict[str, bool]]:
    """Evaluate one pediatric overlay fixture row (mirrors TS evaluatePediatricOverlayFromScenario)."""
    from pathlib import Path

    from ehas2_clinical_engine.rule4.pediatric_overlay.evaluate_pediatric_overlay_adapter import (
        evaluate_pediatric_overlay_adapter,
    )
    from ehas2_clinical_engine.rule4.selection.evaluate_selection_adapter import (
        evaluate_selection_adapter,
    )
    from ehas2_clinical_engine.rule4.selection.selection_fingerprint_v1 import (
        rule4_numeric_selection_fingerprint_v1_hash,
    )

    if phase8_fixture_rows is None:
        repo = Path(__file__).resolve().parents[3]
        p8_path = repo / "fixtures" / "rule4" / "numeric-selection-scenarios.v1.json"
        import json

        phase8_fixture_rows = json.loads(p8_path.read_text(encoding="utf-8"))["scenarios"]

    p8_row = next(s for s in phase8_fixture_rows if s["id"] == scenario["phase8_ref"])
    p8_in = p8_row.get("input") or {}
    p8_ctx = phase8_context_builder(p8_row.get("context"))
    sel_out = evaluate_selection_adapter(p8_in, p8_ctx)
    ss = sel_out["slot_resolutions"][0]
    fp = rule4_numeric_selection_fingerprint_v1_hash(
        ruleset_version=sel_out["ruleset_version"],
        registry_version=sel_out["registry_version"],
        upstream_eligibility_fingerprint=ss.get("upstream_eligibility_fingerprint"),
        slot_resolutions=sel_out["slot_resolutions"],
        reason_codes=sel_out["reason_codes"],
        limitation_codes=sel_out["limitation_codes"],
    )
    target = scenario.get("slot_target_override") or ss["formula_target_id"]
    record: dict[str, Any] = {
        "formula_slot_id": "s1",
        "formula_target_id": target,
        "phase8_selection_fingerprint": scenario.get("phase8_fingerprint_override") or fp,
    }
    if scenario.get("restrict_gate_ledger"):
        record["restrict_gate_ledger"] = snake_to_camel_deep(scenario["restrict_gate_ledger"])
    overlay_in = {
        "contract_version": "ehas2-rule4-contract-v1-phase9-pediatric-overlay",
        "ruleset_version": "ehas2-rule4-ruleset-v1-frozen-doc-4c35469",
        "registry_version": "rule4-reason-codes-phase9-pediatric-overlay-subset-v1",
        "label": scenario.get("overlay_label") or "SYNTHETIC",
        "formula_slot_ids": ["s1"],
        "slot_overlay_records": [record],
    }
    va = snake_to_camel_deep(scenario["verified_age"]) if scenario.get("verified_age") else None
    sg = scenario.get("safety_gate")
    sg_c = snake_to_camel_deep(sg) if sg else {}
    ctx = {
        "verified_age": va,
        "safety_gate": sg,
        "selection_resolution": sel_out,
        "upstream_eligibility_fingerprint": ss.get("upstream_eligibility_fingerprint"),
    }
    out = evaluate_pediatric_overlay_adapter(overlay_in, ctx)
    safety = {
        "d13_hs_active": bool(sg_c.get("d13HardStopActive")),
        "patient_wide_hold": bool(sg_c.get("patientWideHold")),
        "urgent_escalation_required": bool(sg_c.get("urgentEscalationRequired")),
    }
    return out, safety
