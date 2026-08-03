from __future__ import annotations

from .rule2_validate import find_same_target_polarity_contradictions, validate_rule2_record


def _empty_routing(
    slot_id: str,
    target_id: str | None,
    pathway: str,
    potency_status: str,
    reason_codes: list[str],
    limitation_codes: list[str],
) -> dict:
    return {
        "formula_slot_id": slot_id,
        "formula_target_id": target_id,
        "rule2_record_id": None,
        "disease_polarity": None,
        "required_therapeutic_polarity": None,
        "resolution_status": None,
        "pathway": pathway,
        "potency_status": potency_status,
        "selected_cascade": None,
        "selected_dilution": None,
        "reason_codes": sorted(set(reason_codes)),
        "limitation_codes": sorted(set(limitation_codes)),
    }


def _route_validated_record(record: dict, contradictory_targets: set[str]) -> dict:
    base_limitation = ["PHASE4_NO_NUMERIC_CASCADE"]
    target = record["formula_target_id"]
    if target in contradictory_targets:
        return {
            "formula_slot_id": record["formula_slot_id"],
            "formula_target_id": target,
            "rule2_record_id": record["rule2_record_id"],
            "disease_polarity": record["disease_polarity"],
            "required_therapeutic_polarity": record["required_therapeutic_polarity"],
            "resolution_status": record["resolution_status"],
            "pathway": "POLARITY_CONTRADICTORY",
            "potency_status": "UNRESOLVED",
            "selected_cascade": None,
            "selected_dilution": None,
            "reason_codes": ["POLARITY_SAME_TARGET_CONTRADICTION"],
            "limitation_codes": base_limitation,
        }

    disease = record["disease_polarity"]
    therapeutic = record["required_therapeutic_polarity"]
    status = record["resolution_status"]

    if status in {"CONTRADICTORY", "AMBIGUOUS"}:
        return {
            "formula_slot_id": record["formula_slot_id"],
            "formula_target_id": target,
            "rule2_record_id": record["rule2_record_id"],
            "disease_polarity": disease,
            "required_therapeutic_polarity": therapeutic,
            "resolution_status": status,
            "pathway": "POLARITY_CONTRADICTORY"
            if status == "CONTRADICTORY"
            else "UNRESOLVED_NO_CASCADE",
            "potency_status": "UNRESOLVED",
            "selected_cascade": None,
            "selected_dilution": None,
            "reason_codes": [
                "POLARITY_SAME_TARGET_CONTRADICTION"
                if status == "CONTRADICTORY"
                else "RULE2_POLARITY_STATUS_AMBIGUOUS"
            ],
            "limitation_codes": base_limitation,
        }

    if disease == "SUPPORT_ONLY":
        return {
            "formula_slot_id": record["formula_slot_id"],
            "formula_target_id": target,
            "rule2_record_id": record["rule2_record_id"],
            "disease_polarity": disease,
            "required_therapeutic_polarity": therapeutic,
            "resolution_status": status,
            "pathway": "SUPPORT_ONLY_NON_POTENCY",
            "potency_status": "UNRESOLVED",
            "selected_cascade": None,
            "selected_dilution": None,
            "reason_codes": ["POTENCY_NOT_APPLICABLE_FOR_SUPPORT_ONLY_SLOT"],
            "limitation_codes": base_limitation,
        }

    if (
        disease == "UNRESOLVED"
        or status == "UNRESOLVED"
        or status == "NEUTRAL_FALLBACK_PENDING_REVIEW"
    ):
        return {
            "formula_slot_id": record["formula_slot_id"],
            "formula_target_id": target,
            "rule2_record_id": record["rule2_record_id"],
            "disease_polarity": disease,
            "required_therapeutic_polarity": therapeutic,
            "resolution_status": status,
            "pathway": "UNRESOLVED_NO_CASCADE",
            "potency_status": "UNRESOLVED",
            "selected_cascade": None,
            "selected_dilution": None,
            "reason_codes": ["UPSTREAM_TARGET_POLARITY_NOT_RESOLVED"],
            "limitation_codes": base_limitation,
        }

    if disease == "NEUTRAL" and status == "RESOLVED":
        return {
            "formula_slot_id": record["formula_slot_id"],
            "formula_target_id": target,
            "rule2_record_id": record["rule2_record_id"],
            "disease_polarity": disease,
            "required_therapeutic_polarity": therapeutic,
            "resolution_status": status,
            "pathway": "NEUTRAL_NON_POTENCY",
            "potency_status": "NOT_EVALUATED",
            "selected_cascade": None,
            "selected_dilution": None,
            "reason_codes": ["POTENCY_NOT_APPLICABLE_FOR_NEUTRAL_TARGET"],
            "limitation_codes": base_limitation,
        }

    if disease == "MIXED":
        return {
            "formula_slot_id": record["formula_slot_id"],
            "formula_target_id": target,
            "rule2_record_id": record["rule2_record_id"],
            "disease_polarity": disease,
            "required_therapeutic_polarity": therapeutic,
            "resolution_status": status,
            "pathway": "UNRESOLVED_NO_CASCADE",
            "potency_status": "UNRESOLVED",
            "selected_cascade": None,
            "selected_dilution": None,
            "reason_codes": [
                "UPSTREAM_TARGET_POLARITY_NOT_RESOLVED",
                "REGISTRY_Q9_SELECTOR_BLOCKED",
            ],
            "limitation_codes": base_limitation,
        }

    if disease == "NEGATIVE" and therapeutic == "POSITIVE" and status == "RESOLVED":
        return {
            "formula_slot_id": record["formula_slot_id"],
            "formula_target_id": target,
            "rule2_record_id": record["rule2_record_id"],
            "disease_polarity": disease,
            "required_therapeutic_polarity": therapeutic,
            "resolution_status": status,
            "pathway": "NEGATIVE_DISEASE_POSITIVE_THERAPEUTIC_GROUP",
            "potency_status": "NOT_EVALUATED",
            "selected_cascade": None,
            "selected_dilution": None,
            "reason_codes": ["RULE4_POLARITY_PATHWAY_ROUTED"],
            "limitation_codes": base_limitation,
        }

    if disease == "POSITIVE" and therapeutic == "NEGATIVE" and status == "RESOLVED":
        return {
            "formula_slot_id": record["formula_slot_id"],
            "formula_target_id": target,
            "rule2_record_id": record["rule2_record_id"],
            "disease_polarity": disease,
            "required_therapeutic_polarity": therapeutic,
            "resolution_status": status,
            "pathway": "POSITIVE_DISEASE_NEGATIVE_THERAPEUTIC_GROUP",
            "potency_status": "NOT_EVALUATED",
            "selected_cascade": None,
            "selected_dilution": None,
            "reason_codes": ["RULE4_POLARITY_PATHWAY_ROUTED"],
            "limitation_codes": base_limitation,
        }

    return {
        "formula_slot_id": record["formula_slot_id"],
        "formula_target_id": target,
        "rule2_record_id": record["rule2_record_id"],
        "disease_polarity": disease,
        "required_therapeutic_polarity": therapeutic,
        "resolution_status": status,
        "pathway": "POLARITY_CONTRADICTORY",
        "potency_status": "UNRESOLVED",
        "selected_cascade": None,
        "selected_dilution": None,
        "reason_codes": ["RULE2_THERAPEUTIC_POLARITY_MISMATCH"],
        "limitation_codes": base_limitation,
    }


def route_polarity_for_slots(formula_slot_ids: list[str], records: list[dict]) -> list[dict]:
    contradictory_targets = find_same_target_polarity_contradictions(records)
    by_slot = {r["formula_slot_id"]: r for r in records}
    routings: list[dict] = []
    for slot_id in sorted(formula_slot_ids):
        record = by_slot.get(slot_id)
        if not record:
            routings.append(
                _empty_routing(
                    slot_id,
                    None,
                    "UNRESOLVED_NO_CASCADE",
                    "UNRESOLVED",
                    ["RULE2_POLARITY_RECORD_MISSING"],
                    ["PHASE4_NO_NUMERIC_CASCADE"],
                )
            )
            continue
        validated = validate_rule2_record(record)
        if not validated["ok"]:
            routings.append(
                _empty_routing(
                    slot_id,
                    record.get("formula_target_id"),
                    "UNRESOLVED_NO_CASCADE",
                    "UNRESOLVED",
                    validated["reason_codes"],
                    ["PHASE4_NO_NUMERIC_CASCADE"],
                )
            )
            continue
        routings.append(_route_validated_record(record, contradictory_targets))
    return sorted(routings, key=lambda r: r["formula_slot_id"])
