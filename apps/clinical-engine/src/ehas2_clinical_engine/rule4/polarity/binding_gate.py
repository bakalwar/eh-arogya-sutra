from __future__ import annotations

RULE4_POLARITY_GROUP_PATHWAYS = (
    "POSITIVE_DISEASE_NEGATIVE_THERAPEUTIC_GROUP",
    "NEGATIVE_DISEASE_POSITIVE_THERAPEUTIC_GROUP",
)

TRUSTED_SYNTHETIC_BINDING_BYPASS_LIMITATION = "TRUSTED_SYNTHETIC_BINDING_BYPASS_TEST_ONLY"


def _is_group_pathway(pathway: str) -> bool:
    return pathway in RULE4_POLARITY_GROUP_PATHWAYS


def _slot_evidence_binding(evidence: dict | None, slot_id: str) -> dict:
    if not evidence:
        return {"usable_count": 0, "evidence_target_id": None}
    for pool in evidence.get("formula_bound_pools") or []:
        if pool["formula_slot_id"] == slot_id:
            return {
                "usable_count": len(pool.get("usable_finding_ids") or []),
                "evidence_target_id": pool.get("formula_target_id"),
            }
    return {"usable_count": 0, "evidence_target_id": None}


def _collapse_group_route(routing: dict, reason_codes: list[str], extra_limitations: list | None = None) -> dict:
    lim = sorted(
        set([*routing["limitation_codes"], "PHASE4_NO_NUMERIC_CASCADE", *(extra_limitations or [])])
    )
    return {
        **routing,
        "pathway": "NOT_EVALUATED",
        "potency_status": "NOT_EVALUATED",
        "reason_codes": sorted(set([*routing["reason_codes"], *reason_codes])),
        "limitation_codes": lim,
    }


def trusted_synthetic_binding_bypass_active(input_contract: dict) -> bool:
    return (
        input_contract.get("label") == "SYNTHETIC"
        and input_contract.get("trusted_synthetic_binding_bypass") is True
    )


def apply_polarity_binding_gate(
    routings: list[dict],
    input_contract: dict,
    evidence_adapter: dict | None,
    *,
    binding_gate_mandatory: bool,
) -> list[dict]:
    bypass_allowed = not binding_gate_mandatory and trusted_synthetic_binding_bypass_active(
        input_contract
    )
    out: list[dict] = []
    for r in routings:
        if not _is_group_pathway(r["pathway"]):
            out.append(r)
            continue
        if bypass_allowed:
            out.append(
                {
                    **r,
                    "limitation_codes": sorted(
                        set(
                            [
                                *r["limitation_codes"],
                                TRUSTED_SYNTHETIC_BINDING_BYPASS_LIMITATION,
                            ]
                        )
                    ),
                }
            )
            continue
        if not evidence_adapter:
            reason = (
                "PRODUCTION_POLARITY_ROUTING_NOT_CONNECTED"
                if input_contract.get("label") == "PRODUCTION"
                else "RULE3_BINDING_PORT_NOT_RESOLVED"
            )
            out.append(_collapse_group_route(r, [reason]))
            continue
        binding = _slot_evidence_binding(evidence_adapter, r["formula_slot_id"])
        if binding["usable_count"] <= 0:
            out.append(_collapse_group_route(r, ["RULE3_BINDING_PORT_NOT_RESOLVED"]))
            continue
        polarity_target = r.get("formula_target_id")
        evidence_target = binding["evidence_target_id"]
        if not polarity_target or not evidence_target or evidence_target != polarity_target:
            out.append(_collapse_group_route(r, ["CROSS_FORMULA_POLARITY_LEAKAGE_BLOCKED"]))
            continue
        out.append(r)
    return out
