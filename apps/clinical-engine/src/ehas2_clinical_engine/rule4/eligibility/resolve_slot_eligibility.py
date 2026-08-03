from __future__ import annotations

from typing import Any

from .formula_bp_gate import evaluate_formula_bp_stage_gate
from .gate_ledger import blocking_gate_codes_from, gate_result
from .types import Rule4CandidateFamily, Rule4EligibilityStatus, Rule4GateResult

PHASE7_LIMITATION = "PHASE7_NO_NUMERIC_SELECTION"


def _trusted_synthetic_bypass(input_contract: dict) -> bool:
    return (
        input_contract.get("label") == "SYNTHETIC"
        and input_contract.get("trusted_synthetic_eligibility_bypass") is True
    )


def _structured_allowed(input_contract: dict, context: dict) -> bool:
    if input_contract.get("label") == "PRODUCTION":
        return False
    if context.get("binding_gate_mandatory") is not False:
        return _trusted_synthetic_bypass(input_contract)
    return _trusted_synthetic_bypass(input_contract)


def _severity_score_for_slot(severity: dict | None, slot_id: str) -> dict[str, Any]:
    if not severity:
        return {"score": None, "band": None, "ok": False}
    slot = next(
        (s for s in severity.get("slot_resolutions") or [] if s["formula_slot_id"] == slot_id),
        None,
    )
    if not slot or (
        slot.get("severity_status") != "RESOLVED_NUMERIC"
        and slot.get("severity_status") != "RESOLVED_BAND_ONLY"
    ):
        return {"score": None, "band": None, "ok": False}
    if slot.get("severity_status") == "BLOCKED_BY_PATIENT_WIDE_SAFETY_GATE":
        return {"score": None, "band": None, "ok": False}
    return {
        "score": slot.get("severity_score"),
        "band": slot.get("severity_band"),
        "ok": True,
    }


def _phase_for_slot(phase: dict | None, slot_id: str) -> dict[str, Any]:
    if not phase:
        return {"phase": None, "ok": False}
    slot = next(
        (s for s in phase.get("slot_resolutions") or [] if s["formula_slot_id"] == slot_id),
        None,
    )
    if not slot or (
        slot.get("phase_status") != "RESOLVED_BY_DAY_BAND"
        and slot.get("phase_status") != "RESOLVED_BY_EVIDENCE"
        and slot.get("phase_status") != "RESOLVED_BY_CROSS_BOUNDARY_OVERRIDE"
    ):
        return {"phase": None, "ok": False}
    return {"phase": slot.get("resolved_phase"), "ok": True}


def _polarity_for_slot(polarity: dict | None, slot_id: str) -> dict | None:
    if not polarity:
        return None
    return next(
        (s for s in polarity.get("slot_routings") or [] if s["formula_slot_id"] == slot_id),
        None,
    )


def _is_high_severity(score: float | int | None, band: str | None) -> bool:
    if score is not None and score >= 7:
        return True
    return band == "HIGH"


def _is_low_moderate_severity(score: float | int | None, band: str | None) -> bool:
    if score is not None and 1 <= score <= 6:
        return True
    return band in {"LOW", "MODERATE"}


def _empty_slot_resolution(
    slot_id: str,
    target_id: str | None,
    status: Rule4EligibilityStatus,
    family: Rule4CandidateFamily,
    gates: list[Rule4GateResult],
    reason_codes: list[str],
) -> dict:
    return {
        "formula_slot_id": slot_id,
        "formula_target_id": target_id,
        "target_role": "STANDARD_FORMULA_TARGET",
        "eligibility_status": status,
        "candidate_family": family,
        "eligible_family_options": [] if family == "NONE" else [family],
        "family_gate_status": "COMPLETE",
        "gate_results": gates,
        "blocking_gate_codes": blocking_gate_codes_from(gates),
        "selection_status": "NOT_STARTED",
        "selected_cascade": None,
        "selected_dilution": None,
        "upstream_context_status": "NOT_EVALUATED",
        "reason_codes": sorted(set(reason_codes)),
        "limitation_codes": [PHASE7_LIMITATION],
    }


def _evaluate_neg_d1_d2(
    record: dict,
    input_contract: dict,
    context: dict,
    sev: dict[str, Any],
) -> dict[str, Any]:
    gates: list[Rule4GateResult] = []
    allow_structured = _structured_allowed(input_contract, context)

    gates.append(
        gate_result(
            "COMMON_NEG_PRECONDITIONS",
            "PASS"
            if allow_structured and record.get("common_gate_bundle", {}).get("neg_complete")
            else "MISSING_INPUT",
            reason_codes=[]
            if allow_structured and record.get("common_gate_bundle", {}).get("neg_complete")
            else ["NEG_COMMON_GATES_INCOMPLETE"],
        )
    )

    if not sev["ok"]:
        gates.append(
            gate_result(
                "UPSTREAM_SEVERITY_READY",
                "MISSING_INPUT",
                reason_codes=["SEVERITY_UPSTREAM_MISSING"],
            )
        )
        return {"family": "NONE", "gates": gates, "status": "NO_FAMILY_ELIGIBLE"}

    gates.append(gate_result("UPSTREAM_SEVERITY_READY", "PASS"))

    high = _is_high_severity(sev["score"], sev["band"])
    if high:
        gates.append(
            gate_result(
                "NEG_HIGH_D1_PROHIBITED",
                "PASS",
                reason_codes=["D1_PROHIBITED_HIGH_SEVERITY"],
            )
        )

    d1_pass = False
    d2_pass = False

    if not high:
        hypo = record.get("structured_hypofunction_evidence")
        if allow_structured and hypo and hypo.get("pass"):
            gates.append(
                gate_result(
                    "NEG_D1_HYPOFUNCTION_EVIDENCE",
                    "PASS",
                    evidence_item_ids=list(hypo.get("evidence_item_ids") or []),
                )
            )
            if _is_low_moderate_severity(sev["score"], sev["band"]) and record.get(
                "common_gate_bundle", {}
            ).get("neg_complete"):
                gates.append(gate_result("NEG_D1_SEVERITY_BAND", "PASS"))
                d1_pass = True
            else:
                gates.append(gate_result("NEG_D1_SEVERITY_BAND", "FAIL"))
        else:
            gates.append(
                gate_result(
                    "NEG_D1_HYPOFUNCTION_EVIDENCE",
                    "MISSING_INPUT",
                    reason_codes=["D1_HYPOFUNCTION_EVIDENCE_MISSING"],
                )
            )
    else:
        gates.append(
            gate_result(
                "NEG_HIGH_D1_PROHIBITED",
                "PASS",
                reason_codes=["D1_PROHIBITED_HIGH_SEVERITY"],
            )
        )

    mod = record.get("structured_moderating_force_evidence")
    if allow_structured and mod and mod.get("pass"):
        gates.append(
            gate_result(
                "NEG_D2_MODERATING_EVIDENCE",
                "PASS",
                evidence_item_ids=list(mod.get("evidence_item_ids") or []),
            )
        )
        if high:
            gates.append(gate_result("NEG_D2_RESTRICTED_HIGH_SEVERITY", "PASS"))
            d2_pass = True
        elif _is_low_moderate_severity(sev["score"], sev["band"]):
            d2_pass = True
    elif high:
        gates.append(
            gate_result(
                "NEG_D2_MODERATING_EVIDENCE",
                "MISSING_INPUT",
                reason_codes=["D2_RESTRICTED_GATES_INCOMPLETE"],
            )
        )
    else:
        gates.append(
            gate_result(
                "NEG_D2_MODERATING_EVIDENCE",
                "MISSING_INPUT",
                reason_codes=["D2_MODERATING_EVIDENCE_MISSING"],
            )
        )

    if d1_pass and d2_pass:
        return {"family": "BOTH_D1_D2_ELIGIBLE", "gates": gates, "status": "FAMILY_ELIGIBLE"}
    if d1_pass:
        return {"family": "D1_ELIGIBLE", "gates": gates, "status": "FAMILY_ELIGIBLE"}
    if d2_pass:
        return {"family": "D2_ELIGIBLE", "gates": gates, "status": "FAMILY_ELIGIBLE"}
    return {"family": "NONE", "gates": gates, "status": "NO_FAMILY_ELIGIBLE"}


def _evaluate_pos_families(
    record: dict,
    input_contract: dict,
    context: dict,
    sev: dict[str, Any],
    ph: dict[str, Any],
) -> dict[str, Any]:
    gates: list[Rule4GateResult] = []
    allow_structured = _structured_allowed(input_contract, context)
    options: list[Rule4CandidateFamily] = []

    gates.append(
        gate_result(
            "COMMON_POS_PRECONDITIONS",
            "PASS"
            if allow_structured and record.get("common_gate_bundle", {}).get("pos_complete")
            else "MISSING_INPUT",
        )
    )

    if not sev["ok"]:
        gates.append(gate_result("UPSTREAM_SEVERITY_READY", "MISSING_INPUT"))
        return {"family": "NONE", "gates": gates, "status": "NO_FAMILY_ELIGIBLE", "options": []}

    gates.append(gate_result("UPSTREAM_SEVERITY_READY", "PASS"))

    if not ph["ok"]:
        gates.append(gate_result("UPSTREAM_PHASE_READY", "MISSING_INPUT"))
        return {"family": "NONE", "gates": gates, "status": "NO_FAMILY_ELIGIBLE", "options": []}

    gates.append(gate_result("UPSTREAM_PHASE_READY", "PASS"))

    high = _is_high_severity(sev["score"], sev["band"])
    d30 = record.get("d30f_structured_bundle")

    if high and allow_structured and d30 and d30.get("complete"):
        gates.append(
            gate_result(
                "POS_D30F_COMPLETE",
                "PASS",
                evidence_item_ids=list(d30.get("evidence_item_ids") or []),
            )
        )
        options.append("D30_FAMILY_ELIGIBLE")
    elif high:
        gates.append(
            gate_result(
                "POS_D30F_COMPLETE",
                "FAIL" if d30 else "MISSING_INPUT",
                reason_codes=["D30F_INCOMPLETE"],
            )
        )

    phase_name = ph["phase"]
    if (
        not high
        and phase_name in {"SUB_ACUTE", "CHRONIC_MODERATE"}
        and allow_structured
        and record.get("d10_path_variant")
    ):
        sens = record.get("structured_sensitivity")
        path_ok = record.get("d10_path_variant") in {"PATH_B", "PATH_C"}
        sens_status = sens.get("executable_status") if sens else None
        gates.append(gate_result("POS_D10_PATH", "PASS" if path_ok else "FAIL"))
        if sens_status == "PASS":
            sens_outcome = "PASS"
        elif sens_status == "MISSING_INPUT":
            sens_outcome = "MISSING_INPUT"
        else:
            sens_outcome = "FAIL"
        gates.append(
            gate_result(
                "POS_D10_SENSITIVITY",
                sens_outcome,
                evidence_item_ids=list(sens.get("evidence_item_ids") or []) if sens else [],
            )
        )
        if (
            path_ok
            and sens_status == "PASS"
            and record.get("common_gate_bundle", {}).get("pos_complete")
        ):
            options.append("D10_FAMILY_ELIGIBLE")
    elif not high and phase_name in {"SUB_ACUTE", "CHRONIC_MODERATE"}:
        gates.append(gate_result("POS_D10_PATH", "MISSING_INPUT"))

    if not high and phase_name == "ACUTE":
        sens = record.get("structured_sensitivity")
        sens_status = sens.get("executable_status") if sens else None
        if sens_status == "PASS":
            sens_outcome = "PASS"
        elif sens_status == "NON_EXECUTABLE_PENDING_FREEZE":
            sens_outcome = "NON_EXECUTABLE_PENDING_FREEZE"
        else:
            sens_outcome = "MISSING_INPUT"
        gates.append(gate_result("POS_ACUTE_PHASE", "PASS"))
        gates.append(
            gate_result(
                "POS_SEVERITY_1_6",
                "PASS" if _is_low_moderate_severity(sev["score"], sev["band"]) else "FAIL",
            )
        )
        gates.append(
            gate_result(
                "POS_SENSITIVITY_CLOSE_D05",
                sens_outcome,
                evidence_item_ids=list(sens.get("evidence_item_ids") or []) if sens else [],
            )
        )
        if (
            sens_status == "PASS"
            and _is_low_moderate_severity(sev["score"], sev["band"])
            and record.get("common_gate_bundle", {}).get("pos_complete")
        ):
            options.append("D3_D5_FAMILY_ELIGIBLE")

    if not high and phase_name == "DEEP_CHRONIC":
        path = record.get("structured_pathology")
        d60 = record.get("d60_structured_bundle")
        fallback = record.get("d60_fallback_structured")
        if path and path.get("tier3_mapping_status") == "PENDING":
            gates.append(
                gate_result(
                    "POS_D60_TIER3_PATHOLOGY",
                    "NON_EXECUTABLE_PENDING_FREEZE",
                    reason_codes=["TIER3_PATHOLOGY_MAPPING_PENDING"],
                )
            )
        elif path and path.get("authority") == "TIER3_SUGGESTIVE_ONLY":
            gates.append(
                gate_result(
                    "POS_D60_TIER3_PATHOLOGY",
                    "FAIL",
                    reason_codes=["TIER3_SUGGESTIVE_ONLY"],
                )
            )
        elif (
            allow_structured
            and d60
            and d60.get("triple_gate_pass")
            and d60.get("extreme_hypersensitivity_verified")
        ):
            gates.append(
                gate_result(
                    "POS_D60_TRIPLE_GATE",
                    "PASS",
                    evidence_item_ids=list(d60.get("evidence_item_ids") or []),
                )
            )
            gates.append(gate_result("POS_D60_EXTREME_HYPERSENSITIVITY", "PASS"))
            day_band = d60.get("day_band_days")
            if day_band is not None and day_band >= 91 and not d60.get("triple_gate_pass"):
                gates.append(
                    gate_result(
                        "POS_D60_DAY_BAND_ONLY",
                        "FAIL",
                        reason_codes=["DAY_91_ALONE_INSUFFICIENT"],
                    )
                )
            else:
                options.append("D60_FAMILY_ELIGIBLE")
        elif fallback and fallback.get("ready"):
            gates.append(
                gate_result(
                    "POS_D60_FALLBACK_READY",
                    "PASS",
                    evidence_item_ids=list(fallback.get("evidence_item_ids") or []),
                )
            )
            options.append("D60_D10_FALLBACK_READY")
        else:
            gates.append(gate_result("POS_D60_TRIPLE_GATE", "MISSING_INPUT"))

    if not options:
        return {"family": "NONE", "gates": gates, "status": "NO_FAMILY_ELIGIBLE", "options": []}
    return {
        "family": options[0],
        "gates": gates,
        "status": "FAMILY_ELIGIBLE",
        "options": options,
    }


def resolve_slot_eligibility(
    record: dict | None,
    slot_id: str,
    input_contract: dict,
    context: dict | None = None,
) -> dict:
    context = context or {}
    safety = context.get("safety_gate")
    if safety and (safety.get("patient_wide_hold") or safety.get("d13_hard_stop_active")):
        return _empty_slot_resolution(
            slot_id,
            record.get("formula_target_id") if record else None,
            "BLOCKED_BY_SAFETY",
            "NONE",
            [
                gate_result(
                    "SAFETY_PATIENT_WIDE",
                    "BLOCKED_BY_SAFETY",
                    reason_codes=list(safety.get("reason_codes") or []),
                )
            ],
            ["BLOCKED_BY_PATIENT_WIDE_SAFETY_GATE"],
        )

    routing = _polarity_for_slot(context.get("polarity_routing"), slot_id)
    if not routing:
        return _empty_slot_resolution(
            slot_id,
            record.get("formula_target_id") if record else None,
            "NOT_EVALUATED",
            "NONE",
            [gate_result("UPSTREAM_POLARITY_READY", "NOT_EVALUATED")],
            ["UPSTREAM_POLARITY_MISSING"],
        )

    pathway = routing.get("pathway")
    if pathway == "NEUTRAL_NON_POTENCY":
        return _empty_slot_resolution(
            slot_id,
            routing.get("formula_target_id"),
            "NON_POTENCY",
            "NONE",
            [
                gate_result(
                    "POLARITY_NEUTRAL",
                    "PASS",
                    reason_codes=["POTENCY_NOT_APPLICABLE_FOR_NEUTRAL_TARGET"],
                )
            ],
            ["POTENCY_NOT_APPLICABLE_FOR_NEUTRAL_TARGET"],
        )
    if pathway == "SUPPORT_ONLY_NON_POTENCY":
        return _empty_slot_resolution(
            slot_id,
            routing.get("formula_target_id"),
            "NON_POTENCY",
            "NONE",
            [gate_result("POLARITY_SUPPORT_ONLY", "PASS")],
            ["POTENCY_NOT_APPLICABLE_FOR_SUPPORT_ONLY_SLOT"],
        )
    if pathway in {"UNRESOLVED_NO_CASCADE", "POLARITY_CONTRADICTORY"}:
        return _empty_slot_resolution(
            slot_id,
            routing.get("formula_target_id"),
            "BLOCKED_BY_UPSTREAM",
            "NONE",
            [gate_result("UPSTREAM_POLARITY_READY", "BLOCKED_BY_UPSTREAM")],
            list(routing.get("reason_codes") or []),
        )

    if not record or record.get("formula_slot_id") != slot_id:
        return _empty_slot_resolution(
            slot_id,
            routing.get("formula_target_id"),
            "NOT_EVALUATED",
            "NONE",
            [
                gate_result(
                    "ELIGIBILITY_RECORD_BINDING",
                    "MISSING_INPUT",
                    reason_codes=["TARGET_BINDING_MISSING"],
                )
            ],
            ["TARGET_BINDING_MISSING"],
        )
    if record.get("formula_target_id") != routing.get("formula_target_id"):
        return _empty_slot_resolution(
            slot_id,
            routing.get("formula_target_id"),
            "BLOCKED_BY_UPSTREAM",
            "NONE",
            [
                gate_result(
                    "ELIGIBILITY_TARGET_MISMATCH",
                    "CONTRADICTORY",
                    reason_codes=["CROSS_FORMULA_ELIGIBILITY_LEAKAGE_BLOCKED"],
                )
            ],
            ["CROSS_FORMULA_ELIGIBILITY_LEAKAGE_BLOCKED"],
        )

    sev = _severity_score_for_slot(context.get("severity_resolution"), slot_id)
    ph = _phase_for_slot(context.get("phase_resolution"), slot_id)

    if pathway == "NEGATIVE_DISEASE_POSITIVE_THERAPEUTIC_GROUP":
        neg = _evaluate_neg_d1_d2(record, input_contract, context, sev)
        return {
            "formula_slot_id": slot_id,
            "formula_target_id": record["formula_target_id"],
            "target_role": record.get("target_role", "STANDARD_FORMULA_TARGET"),
            "eligibility_status": neg["status"],
            "candidate_family": neg["family"],
            "eligible_family_options": [] if neg["family"] == "NONE" else [neg["family"]],
            "family_gate_status": "COMPLETE",
            "gate_results": neg["gates"],
            "blocking_gate_codes": blocking_gate_codes_from(neg["gates"]),
            "selection_status": "NOT_STARTED",
            "selected_cascade": None,
            "selected_dilution": None,
            "upstream_context_status": "READY_FOR_FUTURE_GATE_EVALUATION",
            "reason_codes": sorted({c for g in neg["gates"] for c in g["reason_codes"]}),
            "limitation_codes": [PHASE7_LIMITATION],
        }

    if pathway == "POSITIVE_DISEASE_NEGATIVE_THERAPEUTIC_GROUP":
        pos = _evaluate_pos_families(record, input_contract, context, sev, ph)
        bp_reading = record.get("formula_bp_reading")
        if bp_reading:
            bp_gate = evaluate_formula_bp_stage_gate(bp_reading, 2)
            if bp_gate["outcome"] == "PASS":
                bp_outcome = "PASS"
            elif bp_gate["outcome"] == "MISSING_INPUT":
                bp_outcome = "MISSING_INPUT"
            else:
                bp_outcome = "FAIL"
            ev_ids = [bp_reading["evidence_item_id"]] if bp_reading.get("evidence_item_id") else []
            pos["gates"].append(
                gate_result(
                    "FORMULA_BP_STAGE2",
                    bp_outcome,
                    reason_codes=bp_gate["reason_codes"],
                    evidence_item_ids=ev_ids,
                )
            )
        return {
            "formula_slot_id": slot_id,
            "formula_target_id": record["formula_target_id"],
            "target_role": record.get("target_role", "STANDARD_FORMULA_TARGET"),
            "eligibility_status": pos["status"],
            "candidate_family": pos["family"],
            "eligible_family_options": pos["options"],
            "family_gate_status": "COMPLETE",
            "gate_results": pos["gates"],
            "blocking_gate_codes": blocking_gate_codes_from(pos["gates"]),
            "selection_status": "NOT_STARTED",
            "selected_cascade": None,
            "selected_dilution": None,
            "upstream_context_status": "READY_FOR_FUTURE_GATE_EVALUATION",
            "reason_codes": sorted({c for g in pos["gates"] for c in g["reason_codes"]}),
            "limitation_codes": [PHASE7_LIMITATION],
        }

    return _empty_slot_resolution(
        slot_id,
        record["formula_target_id"],
        "NOT_EVALUATED",
        "NONE",
        [gate_result("POLARITY_PATHWAY", "NOT_EVALUATED")],
        ["ELIGIBILITY_PATHWAY_NOT_EVALUATED"],
    )
