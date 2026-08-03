from __future__ import annotations

import hashlib

from ..canonical_json import canonical_stable_dumps

RULE4_EVIDENCE_POOL_FINGERPRINT_V1 = "rule4-evidence-pool-fingerprint-v1"


def _pool_payload(pool: dict) -> dict:
    c = pool["contradiction"]
    return {
        "formula_slot_id": pool["formula_slot_id"],
        "formula_target_id": pool["formula_target_id"],
        "usable_finding_ids": sorted(pool["usable_finding_ids"]),
        "ignored_finding_ids": sorted(pool["ignored_finding_ids"]),
        "corroboration_distinct_parent_count": pool["corroboration_distinct_parent_count"],
        "corroborating_parent_source_ids": sorted(pool.get("corroborating_parent_source_ids") or []),
        "contradiction_evidence_status": c["evidence_status"],
        "contradiction_reason_codes": sorted(c["reason_codes"]),
        "contradiction_limitation_codes": sorted(c["limitation_codes"]),
    }


def build_rule4_evidence_pool_fingerprint_v1_payload(
    *,
    ruleset_version: str,
    registry_version: str,
    data_asset_version: str | None,
    formula_bound_pools: list[dict],
    reason_codes: list[str],
    limitation_codes: list[str],
) -> dict:
    pools = sorted(formula_bound_pools, key=lambda p: p["formula_slot_id"])
    return {
        "fingerprint_version": RULE4_EVIDENCE_POOL_FINGERPRINT_V1,
        "ruleset_version": ruleset_version,
        "registry_version": registry_version,
        "data_asset_version": data_asset_version,
        "formula_bound_pools": [_pool_payload(p) for p in pools],
        "reason_codes": sorted(set(reason_codes)),
        "limitation_codes": sorted(set(limitation_codes)),
    }


def rule4_evidence_pool_fingerprint_v1_hash(**kwargs) -> str:
    payload = canonical_stable_dumps(build_rule4_evidence_pool_fingerprint_v1_payload(**kwargs))
    return hashlib.sha256(payload.encode("utf-8")).hexdigest().upper()
