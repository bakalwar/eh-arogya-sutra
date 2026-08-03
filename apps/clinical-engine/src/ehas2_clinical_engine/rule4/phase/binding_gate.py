from __future__ import annotations

from ..polarity.binding_gate import RULE4_POLARITY_GROUP_PATHWAYS

TRUSTED_SYNTHETIC_PHASE_BINDING_BYPASS_LIMITATION = (
    "TRUSTED_SYNTHETIC_BINDING_BYPASS_TEST_ONLY"
)


def trusted_synthetic_phase_binding_bypass_active(input_contract: dict) -> bool:
    return (
        input_contract.get("label") == "SYNTHETIC"
        and input_contract.get("trusted_synthetic_binding_bypass") is True
    )


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


def _polarity_for_slot(polarity: dict | None, slot_id: str) -> str | None:
    if not polarity:
        return None
    for row in polarity.get("slot_routings") or []:
        if row["formula_slot_id"] == slot_id:
            return row.get("pathway")
    return None


def _collapse_binding(slot: dict, reasons: list[str]) -> dict:
    return {
        **slot,
        "phase_status": "NOT_EVALUATED",
        "resolved_phase": None,
        "phase_resolution_source": "NONE",
        "reason_codes": sorted(set([*slot["reason_codes"], *reasons])),
        "limitation_codes": sorted(
            set([*slot["limitation_codes"], "PHASE5_NO_NUMERIC_CASCADE"])
        ),
    }


def apply_phase_binding_gate(
    slots: list[dict],
    input_contract: dict,
    evidence_adapter: dict | None,
    polarity_routing: dict | None,
    *,
    binding_gate_mandatory: bool,
) -> list[dict]:
    bypass = not binding_gate_mandatory and trusted_synthetic_phase_binding_bypass_active(
        input_contract
    )
    out: list[dict] = []
    for slot in slots:
        if bypass:
            out.append(
                {
                    **slot,
                    "limitation_codes": sorted(
                        set(
                            [
                                *slot["limitation_codes"],
                                TRUSTED_SYNTHETIC_PHASE_BINDING_BYPASS_LIMITATION,
                            ]
                        )
                    ),
                }
            )
            continue

        if not evidence_adapter:
            reason = (
                "PRODUCTION_PHASE_RESOLUTION_NOT_CONNECTED"
                if input_contract.get("label") == "PRODUCTION"
                else "RULE3_BINDING_PORT_NOT_RESOLVED"
            )
            out.append(_collapse_binding(slot, [reason]))
            continue

        binding = _slot_evidence_binding(evidence_adapter, slot["formula_slot_id"])
        if binding["usable_count"] <= 0:
            out.append(_collapse_binding(slot, ["RULE3_BINDING_PORT_NOT_RESOLVED"]))
            continue
        if (
            not slot.get("formula_target_id")
            or not binding["evidence_target_id"]
            or binding["evidence_target_id"] != slot["formula_target_id"]
        ):
            out.append(_collapse_binding(slot, ["CROSS_FORMULA_PHASE_LEAKAGE_BLOCKED"]))
            continue

        pathway = _polarity_for_slot(polarity_routing, slot["formula_slot_id"])
        if (
            pathway
            and pathway in RULE4_POLARITY_GROUP_PATHWAYS
            and not polarity_routing
        ):
            out.append(_collapse_binding(slot, ["PRODUCTION_POLARITY_ROUTING_NOT_CONNECTED"]))
            continue

        out.append(slot)
    return out


def apply_polarity_contradiction_block(
    slots: list[dict], polarity_routing: dict | None
) -> list[dict]:
    if not polarity_routing:
        return slots
    out: list[dict] = []
    for slot in slots:
        row = next(
            (
                s
                for s in polarity_routing.get("slot_routings") or []
                if s["formula_slot_id"] == slot["formula_slot_id"]
            ),
            None,
        )
        if row and row.get("pathway") == "POLARITY_CONTRADICTORY":
            out.append(
                {
                    **slot,
                    "phase_status": "BLOCKED_BY_POLARITY_CONTRADICTION",
                    "resolved_phase": None,
                    "phase_resolution_source": "NONE",
                    "reason_codes": sorted(
                        set([*slot["reason_codes"], "POLARITY_SAME_TARGET_CONTRADICTION"])
                    ),
                    "limitation_codes": slot["limitation_codes"],
                }
            )
        else:
            out.append(slot)
    return out
