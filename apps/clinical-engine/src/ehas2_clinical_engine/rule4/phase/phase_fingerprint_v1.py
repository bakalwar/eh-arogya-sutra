from __future__ import annotations

import hashlib

from ..canonical_json import canonical_stable_dumps

RULE4_PHASE_RESOLUTION_FINGERPRINT_V1 = "rule4-phase-resolution-fingerprint-v1"


def _slot_payload(slot: dict) -> dict:
    return {
        "formula_slot_id": slot["formula_slot_id"],
        "formula_target_id": slot["formula_target_id"],
        "phase_status": slot["phase_status"],
        "resolved_phase": slot["resolved_phase"],
        "phase_resolution_source": slot["phase_resolution_source"],
        "calculated_duration_days": slot["calculated_duration_days"],
        "supplied_duration_days": slot["supplied_duration_days"],
        "duration_consistency_status": slot["duration_consistency_status"],
        "baseline_phase": slot["baseline_phase"],
        "current_manifestation_phase": slot["current_manifestation_phase"],
        "target_role": slot["target_role"],
        "flare_status": slot["flare_status"],
        "evidence_item_ids": sorted(slot["evidence_item_ids"]),
        "selected_cascade": slot["selected_cascade"],
        "selected_dilution": slot["selected_dilution"],
        "reason_codes": sorted(slot["reason_codes"]),
        "limitation_codes": sorted(slot["limitation_codes"]),
    }


def build_rule4_phase_resolution_fingerprint_v1_payload(
    *,
    ruleset_version: str,
    registry_version: str,
    slot_resolutions: list[dict],
    reason_codes: list[str],
    limitation_codes: list[str],
) -> dict:
    slots = sorted(slot_resolutions, key=lambda s: s["formula_slot_id"])
    return {
        "fingerprint_version": RULE4_PHASE_RESOLUTION_FINGERPRINT_V1,
        "ruleset_version": ruleset_version,
        "registry_version": registry_version,
        "slot_resolutions": [_slot_payload(s) for s in slots],
        "reason_codes": sorted(set(reason_codes)),
        "limitation_codes": sorted(set(limitation_codes)),
    }


def rule4_phase_resolution_fingerprint_v1_hash(**kwargs) -> str:
    payload = canonical_stable_dumps(
        build_rule4_phase_resolution_fingerprint_v1_payload(**kwargs)
    )
    return hashlib.sha256(payload.encode("utf-8")).hexdigest().upper()


def fingerprint_from_phase_output(output: dict) -> str:
    return rule4_phase_resolution_fingerprint_v1_hash(
        ruleset_version=output["ruleset_version"],
        registry_version=output["registry_version"],
        slot_resolutions=list(output["slot_resolutions"]),
        reason_codes=list(output["reason_codes"]),
        limitation_codes=list(output["limitation_codes"]),
    )
