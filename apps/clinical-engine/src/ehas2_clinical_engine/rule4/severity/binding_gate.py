from __future__ import annotations

TRUSTED_SYNTHETIC_SEVERITY_BINDING_BYPASS_LIMITATION = (
    "TRUSTED_SYNTHETIC_BINDING_BYPASS_TEST_ONLY"
)


def trusted_synthetic_severity_binding_bypass_active(input_contract: dict) -> bool:
    return (
        input_contract.get("label") == "SYNTHETIC"
        and input_contract.get("trusted_synthetic_binding_bypass") is True
    )


def _slot_evidence_binding(
    evidence_adapter: dict | None, slot_id: str
) -> tuple[int, str | None]:
    if not evidence_adapter:
        return 0, None
    for pool in evidence_adapter.get("formula_bound_pools") or []:
        if pool.get("formula_slot_id") == slot_id:
            usable = pool.get("usable_finding_ids") or []
            return len(usable), pool.get("formula_target_id")
    return 0, None


def _collapse_binding(slot: dict, reasons: list[str]) -> dict:
    return {
        **slot,
        "severity_status": "NOT_EVALUATED",
        "severity_score": None,
        "severity_band": None,
        "severity_resolution_source": "NONE",
        "binding_status": "NOT_EVALUATED",
        "reason_codes": sorted(set([*slot["reason_codes"], *reasons])),
        "limitation_codes": sorted(
            set([*slot["limitation_codes"], "PHASE6_NO_NUMERIC_CASCADE"])
        ),
    }


def apply_severity_binding_gate(
    slots: list[dict],
    input_contract: dict,
    evidence_adapter: dict | None,
    *,
    binding_gate_mandatory: bool,
) -> list[dict]:
    bypass = not binding_gate_mandatory and trusted_synthetic_severity_binding_bypass_active(
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
                                TRUSTED_SYNTHETIC_SEVERITY_BINDING_BYPASS_LIMITATION,
                            ]
                        )
                    ),
                }
            )
            continue
        if not evidence_adapter:
            reason = (
                "PRODUCTION_SEVERITY_RESOLUTION_NOT_CONNECTED"
                if input_contract.get("label") == "PRODUCTION"
                else "RULE3_BINDING_PORT_NOT_RESOLVED"
            )
            out.append(_collapse_binding(slot, [reason]))
            continue
        usable_count, evidence_target = _slot_evidence_binding(
            evidence_adapter, slot["formula_slot_id"]
        )
        if usable_count <= 0:
            out.append(_collapse_binding(slot, ["RULE3_BINDING_PORT_NOT_RESOLVED"]))
            continue
        if (
            not slot.get("formula_target_id")
            or not evidence_target
            or evidence_target != slot["formula_target_id"]
        ):
            collapsed = _collapse_binding(slot, ["CROSS_FORMULA_SEVERITY_LEAKAGE_BLOCKED"])
            collapsed["binding_status"] = "LEAKAGE_BLOCKED"
            out.append(collapsed)
            continue
        out.append({**slot, "binding_status": "BOUND"})
    return out
