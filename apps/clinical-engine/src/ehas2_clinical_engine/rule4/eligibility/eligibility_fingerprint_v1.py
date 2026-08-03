from __future__ import annotations

import hashlib

from ..canonical_json import canonical_stable_dumps

RULE4_CANDIDATE_ELIGIBILITY_FINGERPRINT_V1 = "rule4-candidate-eligibility-fingerprint-v1"


def _gate_payload(gate: dict) -> dict:
    return {
        "gate_id": gate["gate_id"],
        "outcome": gate["outcome"],
        "evidence_item_ids": sorted(gate.get("evidence_item_ids") or []),
        "reason_codes": sorted(gate.get("reason_codes") or []),
        "limitation_codes": sorted(gate.get("limitation_codes") or []),
    }


def _slot_payload(slot: dict) -> dict:
    gates = sorted(slot.get("gate_results") or [], key=lambda g: g["gate_id"])
    return {
        "formula_slot_id": slot["formula_slot_id"],
        "formula_target_id": slot.get("formula_target_id"),
        "target_role": slot["target_role"],
        "eligibility_status": slot["eligibility_status"],
        "candidate_family": slot["candidate_family"],
        "eligible_family_options": sorted(slot.get("eligible_family_options") or []),
        "family_gate_status": slot["family_gate_status"],
        "gate_results": [_gate_payload(g) for g in gates],
        "blocking_gate_codes": sorted(slot.get("blocking_gate_codes") or []),
        "upstream_context_status": slot["upstream_context_status"],
        "selection_status": slot["selection_status"],
        "selected_cascade": slot.get("selected_cascade"),
        "selected_dilution": slot.get("selected_dilution"),
        "reason_codes": sorted(slot.get("reason_codes") or []),
        "limitation_codes": sorted(slot.get("limitation_codes") or []),
    }


def rule4_candidate_eligibility_fingerprint_v1_payload(
    *,
    ruleset_version: str,
    registry_version: str,
    selection_status: str,
    slot_resolutions: list[dict],
    reason_codes: list[str],
    limitation_codes: list[str],
) -> str:
    slots = sorted(slot_resolutions, key=lambda s: s["formula_slot_id"])
    return canonical_stable_dumps(
        {
            "fingerprint_version": RULE4_CANDIDATE_ELIGIBILITY_FINGERPRINT_V1,
            "ruleset_version": ruleset_version,
            "registry_version": registry_version,
            "selection_status": selection_status,
            "slot_resolutions": [_slot_payload(s) for s in slots],
            "reason_codes": sorted(set(reason_codes)),
            "limitation_codes": sorted(set(limitation_codes)),
        }
    )


def rule4_candidate_eligibility_fingerprint_v1_hash(
    *,
    ruleset_version: str,
    registry_version: str,
    selection_status: str,
    slot_resolutions: list[dict],
    reason_codes: list[str],
    limitation_codes: list[str],
) -> str:
    payload = rule4_candidate_eligibility_fingerprint_v1_payload(
        ruleset_version=ruleset_version,
        registry_version=registry_version,
        selection_status=selection_status,
        slot_resolutions=slot_resolutions,
        reason_codes=reason_codes,
        limitation_codes=limitation_codes,
    )
    return hashlib.sha256(payload.encode("utf-8")).hexdigest().upper()


def fingerprint_from_eligibility_output(output: dict) -> str:
    return rule4_candidate_eligibility_fingerprint_v1_hash(
        ruleset_version=output["ruleset_version"],
        registry_version=output["registry_version"],
        selection_status=output["selection_status"],
        slot_resolutions=list(output["slot_resolutions"]),
        reason_codes=list(output["reason_codes"]),
        limitation_codes=list(output["limitation_codes"]),
    )
