from __future__ import annotations

import hashlib

from ..canonical_json import canonical_stable_dumps

RULE4_NUMERIC_SELECTION_FINGERPRINT_V1 = "rule4-numeric-selection-fingerprint-v1"


def _tie_break_input_payload(input_data: dict | None) -> dict | None:
    if not input_data:
        return None
    return {
        "primary_temperament": input_data.get("primary_temperament"),
        "primary_temperament_status": input_data.get("primary_temperament_status"),
        "current_consultation_id": input_data.get("current_consultation_id"),
        "temperament_consultation_id": input_data.get("temperament_consultation_id"),
        "consultation_confirmation_status": input_data.get("consultation_confirmation_status"),
        "stale_snapshot_flag": input_data.get("stale_snapshot_flag"),
        "tie_break_status": input_data.get("tie_break_status"),
        "tie_break_result": input_data.get("tie_break_result"),
        "evidence_item_ids": sorted(input_data.get("evidence_item_ids") or []),
    }


def _slot_payload(slot: dict) -> dict:
    return {
        "formula_slot_id": slot["formula_slot_id"],
        "formula_target_id": slot.get("formula_target_id"),
        "selection_status": slot["selection_status"],
        "selected_cascade": slot.get("selected_cascade"),
        "selected_dilution": slot.get("selected_dilution"),
        "selection_basis": slot.get("selection_basis"),
        "eligible_family_consumed": slot.get("eligible_family_consumed"),
        "family_options_before_selection": sorted(
            slot.get("family_options_before_selection") or []
        ),
        "tie_break_status": slot["tie_break_status"],
        "fallback_status": slot["fallback_status"],
        "pre_pediatric_overlay_status": slot["pre_pediatric_overlay_status"],
        "upstream_eligibility_fingerprint": slot.get("upstream_eligibility_fingerprint"),
        "d3_d5_discriminator_fingerprint": slot.get("d3_d5_discriminator_fingerprint"),
        "temperament_tie_break_input": _tie_break_input_payload(
            slot.get("temperament_tie_break_input")
        ),
        "reason_codes": sorted(slot.get("reason_codes") or []),
        "limitation_codes": sorted(slot.get("limitation_codes") or []),
    }


def rule4_numeric_selection_fingerprint_v1_payload(
    *,
    ruleset_version: str,
    registry_version: str,
    upstream_eligibility_fingerprint: str | None,
    slot_resolutions: list[dict],
    reason_codes: list[str],
    limitation_codes: list[str],
) -> str:
    slots = sorted(slot_resolutions, key=lambda s: s["formula_slot_id"])
    return canonical_stable_dumps(
        {
            "fingerprint_version": RULE4_NUMERIC_SELECTION_FINGERPRINT_V1,
            "ruleset_version": ruleset_version,
            "registry_version": registry_version,
            "upstream_eligibility_fingerprint": upstream_eligibility_fingerprint,
            "slot_resolutions": [_slot_payload(s) for s in slots],
            "reason_codes": sorted(set(reason_codes)),
            "limitation_codes": sorted(set(limitation_codes)),
        }
    )


def rule4_numeric_selection_fingerprint_v1_hash(
    *,
    ruleset_version: str,
    registry_version: str,
    upstream_eligibility_fingerprint: str | None,
    slot_resolutions: list[dict],
    reason_codes: list[str],
    limitation_codes: list[str],
) -> str:
    payload = rule4_numeric_selection_fingerprint_v1_payload(
        ruleset_version=ruleset_version,
        registry_version=registry_version,
        upstream_eligibility_fingerprint=upstream_eligibility_fingerprint,
        slot_resolutions=slot_resolutions,
        reason_codes=reason_codes,
        limitation_codes=limitation_codes,
    )
    return hashlib.sha256(payload.encode("utf-8")).hexdigest().upper()


def fingerprint_from_selection_output(
    output: dict, upstream_eligibility_fingerprint: str | None
) -> str:
    return rule4_numeric_selection_fingerprint_v1_hash(
        ruleset_version=output["ruleset_version"],
        registry_version=output["registry_version"],
        upstream_eligibility_fingerprint=upstream_eligibility_fingerprint,
        slot_resolutions=list(output["slot_resolutions"]),
        reason_codes=list(output["reason_codes"]),
        limitation_codes=list(output["limitation_codes"]),
    )
