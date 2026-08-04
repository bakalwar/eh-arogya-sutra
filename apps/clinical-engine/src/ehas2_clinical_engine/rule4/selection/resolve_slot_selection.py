from __future__ import annotations

from typing import Any

from ..eligibility.eligibility_fingerprint_v1 import fingerprint_from_eligibility_output
from .validate_d3_d5_discriminator import validate_d3_d5_discriminator_envelope

PHASE8_LIMITATION = "SHADOW_DRAFT_NUMERIC_SELECTION_ONLY"

_AUDIT_DEFAULT: dict[str, Any] = {
    "d3_d5_discriminator_fingerprint": None,
    "temperament_tie_break_input": None,
}


def _empty_resolution(
    slot_id: str,
    target_id: str | None,
    status: str,
    reason_codes: list[str],
    **extra: Any,
) -> dict:
    base = {
        "formula_slot_id": slot_id,
        "formula_target_id": target_id,
        "selection_status": status,
        "selected_cascade": None,
        "selected_dilution": None,
        "selection_basis": None,
        "eligible_family_consumed": None,
        "family_options_before_selection": [],
        "tie_break_status": "NOT_APPLICABLE",
        "fallback_status": "NOT_APPLICABLE",
        "pre_pediatric_overlay_status": "NOT_APPLICABLE",
        "upstream_eligibility_fingerprint": None,
        **_AUDIT_DEFAULT,
        "reason_codes": sorted(set(reason_codes)),
        "limitation_codes": [PHASE8_LIMITATION],
    }
    base.update(extra)
    return base


def _all_mandatory_gates_pass(slot: dict) -> bool:
    if slot.get("blocking_gate_codes"):
        return False
    return all(g.get("outcome") == "PASS" for g in slot.get("gate_results") or [])


def _pediatric_overlay(context: dict) -> str:
    safety = context.get("safety_gate") or {}
    if safety.get("d13_hard_stop_active"):
        return "BLOCKED_D13_HS"
    age = context.get("verified_age") or {}
    if not age:
        return "AGE_UNRESOLVED"
    vs = age.get("verification_status")
    if vs in {"MISSING", "INVALID", "CONTRADICTORY", "UNRESOLVED"}:
        return "AGE_UNRESOLVED"
    years = age.get("age_years")
    if years is not None and years < 1:
        return "BLOCKED_D13_HS"
    if years is not None and 1 <= years <= 12:
        return "PEDIATRIC_OVERLAY_REQUIRED"
    return "NOT_APPLICABLE"


def _temperament_executable(ctx: dict | None) -> dict[str, Any]:
    if not ctx:
        return {"ok": False, "tie_status": "NO_PREFERENCE", "dilution": None}
    if ctx.get("stale_snapshot_flag") or ctx.get("consultation_confirmation_status") in {
        "STALE",
        "UNCONFIRMED",
        "MISSING",
    }:
        return {"ok": False, "tie_status": "UNRESOLVED", "dilution": None}
    status = ctx.get("primary_temperament_status")
    if (
        status != "CONFIRMED"
        or not ctx.get("current_consultation_id")
        or not ctx.get("temperament_consultation_id")
        or ctx.get("current_consultation_id") != ctx.get("temperament_consultation_id")
    ):
        tie_status = (
            "NO_PREFERENCE"
            if status
            in {
                "LOW_CONFIDENCE",
                "ADDITIONAL_INFO_REQUIRED",
                "FOLLOW_UP_REQUIRED",
                "MISSING",
            }
            else "UNRESOLVED"
        )
        return {"ok": False, "tie_status": tie_status, "dilution": None}
    t = ctx.get("primary_temperament")
    if t == "LYMPHATIC":
        return {"ok": True, "tie_status": "APPLIED", "dilution": "D1"}
    if t in {"SANGUINE", "NERVOUS", "BILIOUS_HEPATIC"}:
        return {"ok": True, "tie_status": "APPLIED", "dilution": "D2"}
    return {"ok": False, "tie_status": "UNRESOLVED", "dilution": None}


def _temperament_tie_break_input(
    ctx: dict | None,
    tie_status: str,
    tie_result: str | None,
) -> dict | None:
    if not ctx:
        return None
    return {
        "primary_temperament": ctx.get("primary_temperament"),
        "primary_temperament_status": ctx.get("primary_temperament_status"),
        "current_consultation_id": ctx.get("current_consultation_id"),
        "temperament_consultation_id": ctx.get("temperament_consultation_id"),
        "consultation_confirmation_status": ctx.get("consultation_confirmation_status"),
        "stale_snapshot_flag": ctx.get("stale_snapshot_flag"),
        "tie_break_status": tie_status,
        "tie_break_result": tie_result,
        "evidence_item_ids": sorted(ctx.get("evidence_item_ids") or []),
    }


def _is_dual_d1_d2(options: list[str]) -> bool:
    if "BOTH_D1_D2_ELIGIBLE" in options:
        return True
    return "D1_ELIGIBLE" in options and "D2_ELIGIBLE" in options


def _contradictory_multi_family(options: list[str]) -> bool:
    families = sorted(set(f for f in options if f != "NONE"))
    if len(families) <= 1:
        return False
    if _is_dual_d1_d2(families):
        return len(families) > 2
    if "D3_D5_FAMILY_ELIGIBLE" in families and len(families) > 1:
        return True
    if "D60_FAMILY_ELIGIBLE" in families and "D60_D10_FALLBACK_READY" in families:
        return True
    return True


def _single_family_from_options(options: list[str]) -> str | None:
    families = sorted(set(f for f in options if f != "NONE"))
    if len(families) == 1:
        return families[0]
    if _is_dual_d1_d2(families) and len(families) <= 2:
        return "BOTH_D1_D2_ELIGIBLE"
    return None


def _draft_from_family(
    family: str, record: dict, eligibility: dict, context: dict
) -> dict[str, Any]:
    options = list(eligibility.get("eligible_family_options") or [])
    base_reasons: list[str] = []
    upstream_fp = record["upstream_eligibility_fingerprint"]
    base_audit = {**_AUDIT_DEFAULT, "upstream_eligibility_fingerprint": upstream_fp}

    if family == "D1_ELIGIBLE":
        return {
            "selection_status": "RESOLVED_DRAFT_CANDIDATE",
            "selected_cascade": "NEGATIVE_D1_D2_SELECTION",
            "selected_dilution": "D1",
            "selection_basis": "SINGLE_FAMILY",
            "eligible_family_consumed": "D1_ELIGIBLE",
            "family_options_before_selection": options,
            "tie_break_status": "NOT_APPLICABLE",
            "fallback_status": "NOT_APPLICABLE",
            "pre_pediatric_overlay_status": "NOT_APPLICABLE",
            **base_audit,
            "reason_codes": base_reasons,
        }
    if family == "D2_ELIGIBLE":
        return {
            "selection_status": "RESOLVED_DRAFT_CANDIDATE",
            "selected_cascade": "NEGATIVE_D1_D2_SELECTION",
            "selected_dilution": "D2",
            "selection_basis": "SINGLE_FAMILY",
            "eligible_family_consumed": "D2_ELIGIBLE",
            "family_options_before_selection": options,
            "tie_break_status": "NOT_APPLICABLE",
            "fallback_status": "NOT_APPLICABLE",
            "pre_pediatric_overlay_status": "NOT_APPLICABLE",
            **base_audit,
            "reason_codes": base_reasons,
        }
    if family == "BOTH_D1_D2_ELIGIBLE":
        tie = _temperament_executable(record.get("temperament_context"))
        tie_input = _temperament_tie_break_input(
            record.get("temperament_context"), tie["tie_status"], tie["dilution"]
        )
        if not tie["ok"] or not tie["dilution"]:
            return {
                "selection_status": "TIE_UNRESOLVED",
                "selected_cascade": None,
                "selected_dilution": None,
                "selection_basis": None,
                "eligible_family_consumed": "BOTH_D1_D2_ELIGIBLE",
                "family_options_before_selection": options,
                "tie_break_status": tie["tie_status"],
                "fallback_status": "NOT_APPLICABLE",
                "pre_pediatric_overlay_status": "NOT_APPLICABLE",
                **base_audit,
                "temperament_tie_break_input": tie_input,
                "reason_codes": ["TEMPERAMENT_TIE_UNRESOLVED"],
            }
        return {
            "selection_status": "RESOLVED_DRAFT_CANDIDATE",
            "selected_cascade": "NEGATIVE_D1_D2_SELECTION",
            "selected_dilution": tie["dilution"],
            "selection_basis": "D1_D2_TEMPERAMENT_TIE_BREAK",
            "eligible_family_consumed": "BOTH_D1_D2_ELIGIBLE",
            "family_options_before_selection": options,
            "tie_break_status": tie["tie_status"],
            "fallback_status": "NOT_APPLICABLE",
            "pre_pediatric_overlay_status": "NOT_APPLICABLE",
            **base_audit,
            "temperament_tie_break_input": tie_input,
            "reason_codes": base_reasons,
        }
    if family == "D3_D5_FAMILY_ELIGIBLE":
        if record.get("d3_d5_selection") and not record.get("d3_d5_discriminator_envelope"):
            return {
                "selection_status": "UNRESOLVED",
                "selected_cascade": None,
                "selected_dilution": None,
                "selection_basis": None,
                "eligible_family_consumed": "D3_D5_FAMILY_ELIGIBLE",
                "family_options_before_selection": options,
                "tie_break_status": "NOT_APPLICABLE",
                "fallback_status": "NOT_APPLICABLE",
                "pre_pediatric_overlay_status": "NOT_APPLICABLE",
                **base_audit,
                "reason_codes": ["D3_D5_LEGACY_BOOLEAN_AUTHORITY_REJECTED"],
            }
        d35 = validate_d3_d5_discriminator_envelope(
            record.get("d3_d5_discriminator_envelope"),
            {
                "formula_slot_id": record["formula_slot_id"],
                "formula_target_id": record["formula_target_id"],
                "upstream_phase7_eligibility_fingerprint": upstream_fp,
                "evidence_adapter": context.get("evidence_adapter"),
                "evidence_items": context.get("evidence_items"),
            },
        )
        if d35["status"] != "resolved" or not d35["dilution"]:
            return {
                "selection_status": "UNRESOLVED",
                "selected_cascade": None,
                "selected_dilution": None,
                "selection_basis": None,
                "eligible_family_consumed": "D3_D5_FAMILY_ELIGIBLE",
                "family_options_before_selection": options,
                "tie_break_status": "NOT_APPLICABLE",
                "fallback_status": "NOT_APPLICABLE",
                "pre_pediatric_overlay_status": "NOT_APPLICABLE",
                **base_audit,
                "d3_d5_discriminator_fingerprint": d35["discriminator_fingerprint"],
                "reason_codes": d35["reason_codes"],
            }
        return {
            "selection_status": "RESOLVED_DRAFT_CANDIDATE",
            "selected_cascade": "POSITIVE_ACUTE_D3_D5_SELECTION",
            "selected_dilution": d35["dilution"],
            "selection_basis": "CLOSE_D05",
            "eligible_family_consumed": "D3_D5_FAMILY_ELIGIBLE",
            "family_options_before_selection": options,
            "tie_break_status": "NOT_APPLICABLE",
            "fallback_status": "NOT_APPLICABLE",
            "pre_pediatric_overlay_status": "NOT_APPLICABLE",
            **base_audit,
            "d3_d5_discriminator_fingerprint": d35["discriminator_fingerprint"],
            "reason_codes": d35["reason_codes"],
        }
    if family == "D10_FAMILY_ELIGIBLE":
        return {
            "selection_status": "RESOLVED_DRAFT_CANDIDATE",
            "selected_cascade": "POSITIVE_D10_SELECTION",
            "selected_dilution": "D10",
            "selection_basis": "DIRECT_D10",
            "eligible_family_consumed": "D10_FAMILY_ELIGIBLE",
            "family_options_before_selection": options,
            "tie_break_status": "NOT_APPLICABLE",
            "fallback_status": "NOT_APPLICABLE",
            "pre_pediatric_overlay_status": "NOT_APPLICABLE",
            **base_audit,
            "reason_codes": base_reasons,
        }
    if family == "D30_FAMILY_ELIGIBLE":
        return {
            "selection_status": "RESOLVED_DRAFT_CANDIDATE",
            "selected_cascade": "POSITIVE_D30_SELECTION",
            "selected_dilution": "D30",
            "selection_basis": "DIRECT_D30",
            "eligible_family_consumed": "D30_FAMILY_ELIGIBLE",
            "family_options_before_selection": options,
            "tie_break_status": "NOT_APPLICABLE",
            "fallback_status": "NOT_APPLICABLE",
            "pre_pediatric_overlay_status": "NOT_APPLICABLE",
            **base_audit,
            "reason_codes": base_reasons,
        }
    if family == "D60_FAMILY_ELIGIBLE":
        return {
            "selection_status": "RESOLVED_DRAFT_CANDIDATE",
            "selected_cascade": "POSITIVE_D60_SELECTION",
            "selected_dilution": "D60",
            "selection_basis": "DIRECT_D60",
            "eligible_family_consumed": "D60_FAMILY_ELIGIBLE",
            "family_options_before_selection": options,
            "tie_break_status": "NOT_APPLICABLE",
            "fallback_status": "NOT_APPLICABLE",
            "pre_pediatric_overlay_status": "NOT_APPLICABLE",
            **base_audit,
            "reason_codes": base_reasons,
        }
    if family == "D60_D10_FALLBACK_READY":
        return {
            "selection_status": "RESOLVED_DRAFT_CANDIDATE",
            "selected_cascade": "POSITIVE_D60_TO_D10_FALLBACK",
            "selected_dilution": "D10",
            "selection_basis": "D60_D10_FALLBACK",
            "eligible_family_consumed": "D60_D10_FALLBACK_READY",
            "family_options_before_selection": options,
            "tie_break_status": "NOT_APPLICABLE",
            "fallback_status": "SELECTED_D10_FALLBACK",
            "pre_pediatric_overlay_status": "NOT_APPLICABLE",
            **base_audit,
            "reason_codes": ["D60_D10_FALLBACK_SELECTED"],
        }
    return {
        "selection_status": "UNRESOLVED",
        "selected_cascade": None,
        "selected_dilution": None,
        "selection_basis": None,
        "eligible_family_consumed": None,
        "family_options_before_selection": options,
        "tie_break_status": "NOT_APPLICABLE",
        "fallback_status": "NOT_APPLICABLE",
        "pre_pediatric_overlay_status": "NOT_APPLICABLE",
        **base_audit,
        "reason_codes": ["UNKNOWN_CANDIDATE_FAMILY"],
    }


def resolve_slot_selection(
    record: dict | None,
    slot_id: str,
    input_contract: dict,
    context: dict,
) -> dict:
    safety = context.get("safety_gate") or {}
    if safety.get("patient_wide_hold") or safety.get("d13_hard_stop_active"):
        return _empty_resolution(
            slot_id,
            record.get("formula_target_id") if record else None,
            "BLOCKED_BY_SAFETY",
            ["BLOCKED_BY_PATIENT_WIDE_SAFETY_GATE"],
        )

    pediatric = _pediatric_overlay(context)
    if pediatric == "BLOCKED_D13_HS":
        return _empty_resolution(
            slot_id,
            record.get("formula_target_id") if record else None,
            "BLOCKED_BY_SAFETY",
            ["PEDIATRIC_D13_HS_BLOCKS_SELECTION"],
            pre_pediatric_overlay_status=pediatric,
        )

    if input_contract.get("label") == "PRODUCTION":
        return _empty_resolution(
            slot_id,
            record.get("formula_target_id") if record else None,
            "NOT_EVALUATED",
            ["PRODUCTION_SELECTION_UPSTREAM_CHAIN_NOT_CONNECTED"],
        )

    trusted = (
        input_contract.get("label") == "SYNTHETIC"
        and input_contract.get("trusted_synthetic_selection_bypass") is True
    )
    if context.get("binding_gate_mandatory") is not False and not trusted:
        return _empty_resolution(
            slot_id,
            record.get("formula_target_id") if record else None,
            "NOT_EVALUATED",
            ["SYNTHETIC_SELECTION_BYPASS_REQUIRED"],
        )

    eligibility_out = context.get("eligibility_resolution")
    if not eligibility_out:
        return _empty_resolution(
            slot_id,
            record.get("formula_target_id") if record else None,
            "NOT_EVALUATED",
            ["SELECTION_UPSTREAM_ELIGIBILITY_MISSING"],
        )

    expected_fp = fingerprint_from_eligibility_output(eligibility_out)
    if record and record.get("upstream_eligibility_fingerprint") != expected_fp:
        return _empty_resolution(
            slot_id,
            record.get("formula_target_id"),
            "UNRESOLVED",
            ["SELECTION_UPSTREAM_ELIGIBILITY_FINGERPRINT_INVALID"],
        )

    eligibility = next(
        (
            s
            for s in eligibility_out.get("slot_resolutions") or []
            if s["formula_slot_id"] == slot_id
        ),
        None,
    )
    if not eligibility:
        return _empty_resolution(
            slot_id,
            record.get("formula_target_id") if record else None,
            "NOT_EVALUATED",
            ["SELECTION_ELIGIBILITY_SLOT_MISSING"],
        )

    if not record or record.get("formula_slot_id") != slot_id:
        return _empty_resolution(
            slot_id,
            eligibility.get("formula_target_id"),
            "NOT_EVALUATED",
            ["SELECTION_RECORD_BINDING_MISSING"],
        )
    if record.get("formula_target_id") != eligibility.get("formula_target_id"):
        return _empty_resolution(
            slot_id,
            eligibility.get("formula_target_id"),
            "UNRESOLVED",
            ["CROSS_FORMULA_SELECTION_LEAKAGE_BLOCKED"],
        )

    if (
        eligibility.get("eligibility_status") != "FAMILY_ELIGIBLE"
        or eligibility.get("family_gate_status") != "COMPLETE"
        or not _all_mandatory_gates_pass(eligibility)
    ):
        return _empty_resolution(
            slot_id,
            eligibility.get("formula_target_id"),
            "UNRESOLVED",
            ["SELECTION_ENTRY_GATE_NOT_SATISFIED"],
            family_options_before_selection=list(eligibility.get("eligible_family_options") or []),
            upstream_eligibility_fingerprint=record.get("upstream_eligibility_fingerprint"),
        )

    options = list(eligibility.get("eligible_family_options") or [])
    if _contradictory_multi_family(options):
        return _empty_resolution(
            slot_id,
            eligibility.get("formula_target_id"),
            "UNRESOLVED",
            ["SELECTION_INPUT_CONTRADICTORY"],
            family_options_before_selection=options,
            upstream_eligibility_fingerprint=record.get("upstream_eligibility_fingerprint"),
        )

    family = _single_family_from_options(options)
    if not family:
        return _empty_resolution(
            slot_id,
            eligibility.get("formula_target_id"),
            "UNRESOLVED",
            ["SELECTION_FAMILY_OPTIONS_EMPTY"],
            family_options_before_selection=options,
            upstream_eligibility_fingerprint=record.get("upstream_eligibility_fingerprint"),
        )

    draft = _draft_from_family(family, record, eligibility, context)
    pre_ped = (
        pediatric
        if draft["selection_status"] == "RESOLVED_DRAFT_CANDIDATE"
        else draft["pre_pediatric_overlay_status"]
    )

    if pediatric == "AGE_UNRESOLVED" and draft["selection_status"] == "RESOLVED_DRAFT_CANDIDATE":
        return {
            "formula_slot_id": slot_id,
            "formula_target_id": eligibility.get("formula_target_id"),
            "selection_status": "UNRESOLVED",
            "selected_cascade": None,
            "selected_dilution": None,
            "selection_basis": None,
            "eligible_family_consumed": draft["eligible_family_consumed"],
            "family_options_before_selection": draft["family_options_before_selection"],
            "tie_break_status": draft["tie_break_status"],
            "fallback_status": draft["fallback_status"],
            "pre_pediatric_overlay_status": "AGE_UNRESOLVED",
            "upstream_eligibility_fingerprint": record.get("upstream_eligibility_fingerprint"),
            "d3_d5_discriminator_fingerprint": draft.get("d3_d5_discriminator_fingerprint"),
            "temperament_tie_break_input": draft.get("temperament_tie_break_input"),
            "reason_codes": sorted(
                set([*draft["reason_codes"], "VERIFIED_AGE_REQUIRED_FOR_SELECTION"])
            ),
            "limitation_codes": [PHASE8_LIMITATION],
        }

    return {
        "formula_slot_id": slot_id,
        "formula_target_id": eligibility.get("formula_target_id"),
        "selection_status": draft["selection_status"],
        "selected_cascade": draft["selected_cascade"],
        "selected_dilution": draft["selected_dilution"],
        "selection_basis": draft["selection_basis"],
        "eligible_family_consumed": draft["eligible_family_consumed"],
        "family_options_before_selection": draft["family_options_before_selection"],
        "tie_break_status": draft["tie_break_status"],
        "fallback_status": draft["fallback_status"],
        "pre_pediatric_overlay_status": pre_ped,
        "upstream_eligibility_fingerprint": record.get("upstream_eligibility_fingerprint"),
        "d3_d5_discriminator_fingerprint": draft.get("d3_d5_discriminator_fingerprint"),
        "temperament_tie_break_input": draft.get("temperament_tie_break_input"),
        "reason_codes": sorted(set(draft["reason_codes"])),
        "limitation_codes": [PHASE8_LIMITATION],
    }
