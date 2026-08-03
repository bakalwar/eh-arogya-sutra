from __future__ import annotations

import hashlib

from ..canonical_json import canonical_stable_dumps

RULE4_POLARITY_ROUTING_FINGERPRINT_V1 = "rule4-polarity-routing-fingerprint-v1"


def _slot_payload(slot: dict) -> dict:
    return {
        "formula_slot_id": slot["formula_slot_id"],
        "formula_target_id": slot["formula_target_id"],
        "rule2_record_id": slot["rule2_record_id"],
        "disease_polarity": slot["disease_polarity"],
        "required_therapeutic_polarity": slot["required_therapeutic_polarity"],
        "resolution_status": slot["resolution_status"],
        "pathway": slot["pathway"],
        "potency_status": slot["potency_status"],
        "selected_cascade": slot["selected_cascade"],
        "selected_dilution": slot["selected_dilution"],
        "reason_codes": sorted(slot["reason_codes"]),
        "limitation_codes": sorted(slot["limitation_codes"]),
    }


def build_rule4_polarity_routing_fingerprint_v1_payload(
    *,
    ruleset_version: str,
    registry_version: str,
    slot_routings: list[dict],
    reason_codes: list[str],
    limitation_codes: list[str],
) -> dict:
    slots = sorted(slot_routings, key=lambda s: s["formula_slot_id"])
    return {
        "fingerprint_version": RULE4_POLARITY_ROUTING_FINGERPRINT_V1,
        "ruleset_version": ruleset_version,
        "registry_version": registry_version,
        "slot_routings": [_slot_payload(s) for s in slots],
        "reason_codes": sorted(set(reason_codes)),
        "limitation_codes": sorted(set(limitation_codes)),
    }


def rule4_polarity_routing_fingerprint_v1_hash(**kwargs) -> str:
    payload = canonical_stable_dumps(build_rule4_polarity_routing_fingerprint_v1_payload(**kwargs))
    return hashlib.sha256(payload.encode("utf-8")).hexdigest().upper()


def fingerprint_from_polarity_output(output: dict) -> str:
    return rule4_polarity_routing_fingerprint_v1_hash(
        ruleset_version=output["ruleset_version"],
        registry_version=output["registry_version"],
        slot_routings=list(output["slot_routings"]),
        reason_codes=list(output["reason_codes"]),
        limitation_codes=list(output["limitation_codes"]),
    )
