from __future__ import annotations

import re
from datetime import datetime
from typing import Any

ISO_TS = re.compile(
    r"^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})?)?$"
)


def supersession_comparable_source_class(source_type: str) -> str:
    if source_type in {"DOCTOR_STRUCTURED_ENTRY", "DOCTOR_STRUCTURED_PHOTO_OBSERVATION"}:
        return source_type
    return source_comparability_tier(source_type)


def source_comparability_tier(source_type: str) -> str:
    if source_type in {"DOCTOR_STRUCTURED_ENTRY", "DOCTOR_STRUCTURED_PHOTO_OBSERVATION"}:
        return "TIER1_DOCTOR_STRUCTURED"
    if source_type == "DIGITAL_STRUCTURED_REPORT":
        return "TIER2_DIGITAL_STRUCTURED"
    if source_type == "OCR_EXTRACTED_DOCUMENT_IMAGE":
        return "TIER3_OCR_DOCUMENT_IMAGE"
    if source_type == "DOCTOR_FREE_TEXT_NLP_EXTRACTION":
        return "TIER4A_EXTRACTED_CANDIDATE"
    if source_type == "DATASET_TAXONOMY_ALIGNMENT":
        return "TIER4B_SUPPORTING_ONLY"
    return "NOT_COMPARABLE"


def normalize_laterality(laterality: str | None) -> str:
    if laterality is None or str(laterality).strip() == "":
        return ""
    return str(laterality).strip().upper()


def normalized_finding_signature(item: dict[str, Any]) -> str:
    v = item.get("value")
    val = "" if v is None else str(v)
    unit = item.get("unit") or ""
    return f"{val}|{unit}|{item.get('assertion_status')}"


def is_comparable_timestamp(ts: str | None) -> bool:
    if ts is None or str(ts).strip() == "":
        return False
    t = str(ts).strip()
    if not ISO_TS.match(t):
        return False
    try:
        datetime.fromisoformat(t.replace("Z", "+00:00"))
        return True
    except ValueError:
        return False


def supersession_group_key(item: dict[str, Any]) -> str:
    source_class = supersession_comparable_source_class(item.get("source_type", ""))
    test_id = item.get("test_panel_identity") or item.get("finding_identity_key") or item["finding_id"]
    return "|".join(
        [
            item["formula_target_id"],
            item["target_organ_system"],
            item["anatomical_site"],
            normalize_laterality(item.get("laterality")),
            item["target_pathology_id"],
            test_id,
            source_class,
        ]
    )


def apply_supersession(usable_items: list[dict[str, Any]]) -> list[dict[str, Any]]:
    by_group: dict[str, list[dict[str, Any]]] = {}
    for item in usable_items:
        by_group.setdefault(supersession_group_key(item), []).append(item)

    decisions: list[dict[str, Any]] = []
    for group in by_group.values():
        invalid_ts: list[dict[str, Any]] = []
        valid_ts: list[dict[str, Any]] = []
        for item in group:
            if is_comparable_timestamp(item.get("timestamp_or_case_context")):
                valid_ts.append(item)
            else:
                invalid_ts.append(item)

        for item in invalid_ts:
            decisions.append(
                {
                    "finding_id": item["finding_id"],
                    "superseded_by_finding_id": None,
                    "active": True,
                    "reason_codes": ["SUPERSESSION_TIMESTAMP_NOT_COMPARABLE"],
                    "limitation_codes": ["SUPERSESSION_SKIPPED_INVALID_TIMESTAMP"],
                }
            )

        if not valid_ts:
            continue

        sorted_g = sorted(valid_ts, key=lambda x: (x["timestamp_or_case_context"], x["finding_id"]))
        max_ts = sorted_g[-1]["timestamp_or_case_context"]
        at_max = [i for i in sorted_g if i["timestamp_or_case_context"] == max_ts]
        below_max = [i for i in sorted_g if i["timestamp_or_case_context"] != max_ts]
        signatures = {normalized_finding_signature(i) for i in at_max}
        anchor = sorted(at_max, key=lambda x: x["finding_id"])[0]["finding_id"]

        lim = ["SUPERSESSION_SAME_TIMESTAMP_NO_CLINICAL_WINNER"] if len(signatures) > 1 else []
        for item in at_max:
            decisions.append(
                {
                    "finding_id": item["finding_id"],
                    "superseded_by_finding_id": None,
                    "active": True,
                    "reason_codes": [],
                    "limitation_codes": lim,
                }
            )
        for item in below_max:
            decisions.append(
                {
                    "finding_id": item["finding_id"],
                    "superseded_by_finding_id": anchor,
                    "active": False,
                    "reason_codes": ["EVIDENCE_SUPERSEDED"],
                    "limitation_codes": [],
                }
            )

    return sorted(decisions, key=lambda d: d["finding_id"])
