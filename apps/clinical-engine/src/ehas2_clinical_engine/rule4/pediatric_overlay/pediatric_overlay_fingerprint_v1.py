from __future__ import annotations

import hashlib

from ..canonical_json import canonical_stable_dumps

RULE4_PEDIATRIC_OVERLAY_FINGERPRINT_V1 = "rule4-pediatric-overlay-fingerprint-v1"


def _slot_payload(slot: dict) -> dict:
    overlay_gate_results = slot.get("overlay_gate_results") or []
    return {
        "age_provenance_digest": slot["age_provenance_digest"],
        "age_verification_status": slot["age_verification_status"],
        "base_selected_cascade": slot.get("base_selected_cascade"),
        "base_selected_dilution": slot.get("base_selected_dilution"),
        "d13_d_justification_status": slot["d13_d_justification_status"],
        "final_draft_cascade": slot.get("final_draft_cascade"),
        "final_draft_dilution": slot.get("final_draft_dilution"),
        "formula_slot_id": slot["formula_slot_id"],
        "formula_target_id": slot.get("formula_target_id"),
        "overlay_gate_results": [
            {
                "dilution": g.get("dilution"),
                "matrix_cell": g["matrix_cell"],
                "outcome": g["outcome"],
            }
            for g in overlay_gate_results
        ],
        "pediatric_matrix_authority": slot["pediatric_matrix_authority"],
        "pediatric_overlay_status": slot["pediatric_overlay_status"],
        "phase8_selection_fingerprint": slot.get("phase8_selection_fingerprint"),
        "prescription_issue_allowed": slot["prescription_issue_allowed"],
        "reason_codes": sorted(slot.get("reason_codes") or []),
        "limitation_codes": sorted(slot.get("limitation_codes") or []),
        "verified_age_band": slot.get("verified_age_band"),
    }


def rule4_pediatric_overlay_fingerprint_v1_payload(
    *,
    ruleset_version: str,
    registry_version: str,
    d13_hs_active: bool,
    patient_wide_hold: bool,
    urgent_escalation_required: bool,
    slot_resolutions: list[dict],
    reason_codes: list[str],
    limitation_codes: list[str],
) -> str:
    slots = sorted(slot_resolutions, key=lambda s: s["formula_slot_id"])
    return canonical_stable_dumps(
        {
            "d13_hs_active": d13_hs_active,
            "fingerprint_version": RULE4_PEDIATRIC_OVERLAY_FINGERPRINT_V1,
            "limitation_codes": sorted(set(limitation_codes)),
            "patient_wide_hold": patient_wide_hold,
            "reason_codes": sorted(set(reason_codes)),
            "registry_version": registry_version,
            "ruleset_version": ruleset_version,
            "slot_resolutions": [_slot_payload(s) for s in slots],
            "urgent_escalation_required": urgent_escalation_required,
        }
    )


def rule4_pediatric_overlay_fingerprint_v1_hash(
    *,
    ruleset_version: str,
    registry_version: str,
    d13_hs_active: bool,
    patient_wide_hold: bool,
    urgent_escalation_required: bool,
    slot_resolutions: list[dict],
    reason_codes: list[str],
    limitation_codes: list[str],
) -> str:
    payload = rule4_pediatric_overlay_fingerprint_v1_payload(
        ruleset_version=ruleset_version,
        registry_version=registry_version,
        d13_hs_active=d13_hs_active,
        patient_wide_hold=patient_wide_hold,
        urgent_escalation_required=urgent_escalation_required,
        slot_resolutions=slot_resolutions,
        reason_codes=reason_codes,
        limitation_codes=limitation_codes,
    )
    return hashlib.sha256(payload.encode("utf-8")).hexdigest().upper()


def fingerprint_from_pediatric_overlay_output(output: dict, safety: dict) -> str:
    return rule4_pediatric_overlay_fingerprint_v1_hash(
        ruleset_version=output["ruleset_version"],
        registry_version=output["registry_version"],
        d13_hs_active=bool(safety.get("d13_hs_active")),
        patient_wide_hold=bool(safety.get("patient_wide_hold")),
        urgent_escalation_required=bool(safety.get("urgent_escalation_required")),
        slot_resolutions=list(output["slot_resolutions"]),
        reason_codes=list(output["reason_codes"]),
        limitation_codes=list(output["limitation_codes"]),
    )


def slot_pediatric_overlay_fingerprint_v1_hash(slot: dict, meta: dict) -> str:
    return rule4_pediatric_overlay_fingerprint_v1_hash(
        ruleset_version=meta["ruleset_version"],
        registry_version=meta["registry_version"],
        d13_hs_active=meta["d13_hs_active"],
        patient_wide_hold=meta["patient_wide_hold"],
        urgent_escalation_required=meta["urgent_escalation_required"],
        slot_resolutions=[slot],
        reason_codes=list(meta["reason_codes"]),
        limitation_codes=list(meta["limitation_codes"]),
    )
