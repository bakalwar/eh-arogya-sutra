from __future__ import annotations

RULE2_DISEASE_POLARITY_VALUES = (
    "POSITIVE",
    "NEGATIVE",
    "NEUTRAL",
    "MIXED",
    "UNRESOLVED",
    "SUPPORT_ONLY",
)
RULE2_THERAPEUTIC_POLARITY_VALUES = ("POSITIVE", "NEGATIVE", "NEUTRAL")
RULE2_RESOLUTION_STATUS_VALUES = (
    "RESOLVED",
    "RESOLVED_SUPPORT_ROLE",
    "NEUTRAL_FALLBACK_PENDING_REVIEW",
    "UNRESOLVED",
    "CONTRADICTORY",
    "AMBIGUOUS",
)


def _is_enum(value: str, allowed: tuple[str, ...]) -> bool:
    return value in allowed


def validate_rule2_record(record: dict) -> dict:
    reason_codes: list[str] = []
    if not str(record.get("formula_slot_id") or "").strip():
        reason_codes.append("RULE2_POLARITY_RECORD_INVALID")
    if not str(record.get("formula_target_id") or "").strip():
        reason_codes.append("RULE2_POLARITY_RECORD_INVALID")
    if not str(record.get("rule2_record_id") or "").strip():
        reason_codes.append("RULE2_POLARITY_RECORD_INVALID")
    if not _is_enum(str(record.get("disease_polarity")), RULE2_DISEASE_POLARITY_VALUES):
        reason_codes.append("RULE2_DISEASE_POLARITY_INVALID")
    if not _is_enum(
        str(record.get("required_therapeutic_polarity")),
        RULE2_THERAPEUTIC_POLARITY_VALUES,
    ):
        reason_codes.append("RULE2_THERAPEUTIC_POLARITY_INVALID")
    if not _is_enum(str(record.get("resolution_status")), RULE2_RESOLUTION_STATUS_VALUES):
        reason_codes.append("RULE2_RESOLUTION_STATUS_INVALID")
    if reason_codes:
        return {"ok": False, "reason_codes": sorted(set(reason_codes))}
    return {"ok": True, "record": record}


def find_same_target_polarity_contradictions(records: list[dict]) -> set[str]:
    by_target: dict[str, set[str]] = {}
    for r in records:
        validated = validate_rule2_record(r)
        if not validated["ok"]:
            continue
        disease = r.get("disease_polarity")
        if disease in {"UNRESOLVED", "SUPPORT_ONLY"}:
            continue
        target = r["formula_target_id"]
        by_target.setdefault(target, set()).add(disease)
    contradictory: set[str] = set()
    for target, polarities in by_target.items():
        if "POSITIVE" in polarities and "NEGATIVE" in polarities:
            contradictory.add(target)
    return contradictory
