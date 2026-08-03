from __future__ import annotations

GROUP_PATHWAYS = {
    "POSITIVE_DISEASE_NEGATIVE_THERAPEUTIC_GROUP",
    "NEGATIVE_DISEASE_POSITIVE_THERAPEUTIC_GROUP",
}

NON_POTENCY_PATHWAYS = {"NEUTRAL_NON_POTENCY", "SUPPORT_ONLY_NON_POTENCY"}

UNRESOLVED_POLARITY_PATHWAYS = {
    "UNRESOLVED_NO_CASCADE",
    "POLARITY_CONTRADICTORY",
    "BLOCKED_BY_SAFETY_GATE",
    "NOT_EVALUATED",
}

RESOLVED_PHASE_STATUSES = {
    "RESOLVED_BY_DAY_BAND",
    "RESOLVED_BY_EVIDENCE",
    "RESOLVED_BY_CROSS_BOUNDARY_OVERRIDE",
}

UNRESOLVED_PHASE_STATUSES = {
    "PHASE_AMBIGUOUS",
    "PHASE_CONTRADICTORY",
    "PHASE_TARGET_CONTRADICTORY",
    "MISSING_EVIDENCE",
    "NOT_EVALUATED",
}


def _phase_is_resolved(phase_slot: dict | None) -> bool:
    if not phase_slot:
        return False
    return phase_slot.get("phase_status") in RESOLVED_PHASE_STATUSES


def _phase_is_unresolved(phase_slot: dict | None) -> bool:
    if not phase_slot:
        return False
    return phase_slot.get("phase_status") in UNRESOLVED_PHASE_STATUSES


def _derive_upstream_status(
    pathway: str | None,
    phase_slot: dict | None,
    polarity_provided: bool,
    phase_provided: bool,
) -> str:
    if not polarity_provided and not phase_provided:
        return "NOT_EVALUATED"

    if pathway and pathway in UNRESOLVED_POLARITY_PATHWAYS:
        return "AUDIT_ONLY_UPSTREAM_UNRESOLVED"

    if pathway and pathway in NON_POTENCY_PATHWAYS:
        return "AUDIT_ONLY_NON_POTENCY_CONTEXT"

    if pathway and pathway in GROUP_PATHWAYS:
        if phase_provided and _phase_is_unresolved(phase_slot):
            return "AUDIT_ONLY_UPSTREAM_UNRESOLVED"
        if phase_provided and _phase_is_resolved(phase_slot):
            return "READY_FOR_FUTURE_GATE_EVALUATION"
        if not phase_provided:
            return "AUDIT_ONLY_UPSTREAM_UNRESOLVED"

    if phase_provided and _phase_is_unresolved(phase_slot):
        return "AUDIT_ONLY_UPSTREAM_UNRESOLVED"

    return "NOT_EVALUATED"


def _find_polarity_slot(polarity: dict | None, slot: dict) -> dict | None:
    if not polarity:
        return None
    for r in polarity.get("slot_routings") or []:
        if r.get("formula_slot_id") == slot["formula_slot_id"] and (
            r.get("formula_target_id") is None
            or r.get("formula_target_id") == slot.get("formula_target_id")
        ):
            return r
    return None


def _find_phase_slot(phase: dict | None, slot: dict) -> dict | None:
    if not phase:
        return None
    for r in phase.get("slot_resolutions") or []:
        if r.get("formula_slot_id") == slot["formula_slot_id"] and (
            r.get("formula_target_id") is None
            or r.get("formula_target_id") == slot.get("formula_target_id")
        ):
            return r
    return None


def apply_upstream_context_boundary(
    slots: list[dict],
    polarity_routing: dict | None,
    phase_resolution: dict | None,
) -> list[dict]:
    polarity_provided = polarity_routing is not None
    phase_provided = phase_resolution is not None

    if not polarity_provided and not phase_provided:
        return [{**s, "upstream_context_status": "NOT_EVALUATED"} for s in slots]

    out: list[dict] = []
    for slot in slots:
        pol = _find_polarity_slot(polarity_routing, slot)
        ph = _find_phase_slot(phase_resolution, slot)

        if polarity_provided and pol is None:
            out.append(
                {
                    **slot,
                    "upstream_context_status": "NOT_EVALUATED",
                    "severity_status": "NOT_EVALUATED",
                    "severity_score": None,
                    "severity_band": None,
                    "severity_resolution_source": "NONE",
                    "selected_cascade": None,
                    "selected_dilution": None,
                    "reason_codes": sorted(
                        set([*slot["reason_codes"], "UPSTREAM_TARGET_POLARITY_NOT_RESOLVED"])
                    ),
                    "limitation_codes": sorted(
                        set([*slot["limitation_codes"], "PHASE6_UPSTREAM_CONTEXT_BOUNDARY"])
                    ),
                }
            )
            continue

        upstream_context_status = _derive_upstream_status(
            pol.get("pathway") if pol else None,
            ph,
            polarity_provided,
            phase_provided,
        )

        limitation_codes = list(slot["limitation_codes"])
        if upstream_context_status in {
            "AUDIT_ONLY_NON_POTENCY_CONTEXT",
            "AUDIT_ONLY_UPSTREAM_UNRESOLVED",
        }:
            limitation_codes = sorted(
                set([*limitation_codes, "PHASE6_UPSTREAM_CONTEXT_BOUNDARY"])
            )

        out.append(
            {
                **slot,
                "upstream_context_status": upstream_context_status,
                "selected_cascade": None,
                "selected_dilution": None,
                "limitation_codes": sorted(set(limitation_codes)),
            }
        )
    return out
