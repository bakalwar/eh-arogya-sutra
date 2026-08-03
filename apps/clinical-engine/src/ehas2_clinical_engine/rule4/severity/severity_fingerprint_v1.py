from __future__ import annotations

import hashlib

from ..canonical_json import canonical_stable_dumps

RULE4_SEVERITY_RESOLUTION_FINGERPRINT_V1 = "rule4-severity-resolution-fingerprint-v1"


def _slot_payload(slot: dict) -> dict:
    return {
        "formula_slot_id": slot["formula_slot_id"],
        "formula_target_id": slot["formula_target_id"],
        "target_role": slot["target_role"],
        "severity_status": slot["severity_status"],
        "severity_score": slot["severity_score"],
        "severity_band": slot["severity_band"],
        "severity_resolution_source": slot["severity_resolution_source"],
        "binding_status": slot["binding_status"],
        "evidence_item_ids": sorted(slot["evidence_item_ids"]),
        "corroborating_source_ids": sorted(slot["corroborating_source_ids"]),
        "selected_cascade": slot["selected_cascade"],
        "selected_dilution": slot["selected_dilution"],
        "upstream_context_status": slot["upstream_context_status"],
        "reason_codes": sorted(slot["reason_codes"]),
        "limitation_codes": sorted(slot["limitation_codes"]),
    }


def rule4_severity_resolution_fingerprint_v1_payload(
    *,
    ruleset_version: str,
    registry_version: str,
    slot_resolutions: list[dict],
    reason_codes: list[str],
    limitation_codes: list[str],
) -> str:
    slots = sorted(slot_resolutions, key=lambda s: s["formula_slot_id"])
    return canonical_stable_dumps(
        {
            "fingerprint_version": RULE4_SEVERITY_RESOLUTION_FINGERPRINT_V1,
            "ruleset_version": ruleset_version,
            "registry_version": registry_version,
            "slot_resolutions": [_slot_payload(s) for s in slots],
            "reason_codes": sorted(set(reason_codes)),
            "limitation_codes": sorted(set(limitation_codes)),
        }
    )


def rule4_severity_resolution_fingerprint_v1_hash(
    *,
    ruleset_version: str,
    registry_version: str,
    slot_resolutions: list[dict],
    reason_codes: list[str],
    limitation_codes: list[str],
) -> str:
    payload = rule4_severity_resolution_fingerprint_v1_payload(
        ruleset_version=ruleset_version,
        registry_version=registry_version,
        slot_resolutions=slot_resolutions,
        reason_codes=reason_codes,
        limitation_codes=limitation_codes,
    )
    return hashlib.sha256(payload.encode("utf-8")).hexdigest().upper()


def fingerprint_from_severity_output(output: dict) -> str:
    return rule4_severity_resolution_fingerprint_v1_hash(
        ruleset_version=output["ruleset_version"],
        registry_version=output["registry_version"],
        slot_resolutions=list(output["slot_resolutions"]),
        reason_codes=list(output["reason_codes"]),
        limitation_codes=list(output["limitation_codes"]),
    )
