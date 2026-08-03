from __future__ import annotations

from .day_bands import fallback_phase_from_duration_days
from .duration_calendar import (
    inclusive_duration_days,
    is_valid_positive_integer_duration,
    parse_iso_date_only,
)

NON_EXECUTABLE_TIERS = frozenset(
    {
        "INVALID_ITEM",
        "VAGUE_TIMELINE",
        "REGISTRY_KEYWORD",
        "NEGATED",
        "UNVERIFIED",
        "STRUCTURED_PHASE_AMBIGUOUS",
    }
)

INVALID_ONLY_TIERS = frozenset({"INVALID_ITEM", "NEGATED", "UNVERIFIED"})


def _explicitly_ambiguous_assertions(assertions: list[dict]) -> list[dict]:
    return [a for a in assertions if a.get("source_tier") == "STRUCTURED_PHASE_AMBIGUOUS"]


def _is_invalid_only_pool(assertions: list[dict]) -> bool:
    if not assertions:
        return False
    return all(a.get("source_tier") in INVALID_ONLY_TIERS for a in assertions)


def _empty_slot(record: dict, partial: dict) -> dict:
    base = {
        "formula_slot_id": record["formula_slot_id"],
        "formula_target_id": record["formula_target_id"],
        "phase_status": "NOT_EVALUATED",
        "resolved_phase": None,
        "phase_resolution_source": "NONE",
        "calculated_duration_days": None,
        "supplied_duration_days": None,
        "duration_consistency_status": "NONE",
        "baseline_phase": record.get("baseline_phase"),
        "current_manifestation_phase": record.get("current_manifestation_phase"),
        "target_role": record["target_role"],
        "flare_status": "NOT_APPLICABLE",
        "evidence_item_ids": [],
        "selected_cascade": None,
        "selected_dilution": None,
        "reason_codes": [],
        "limitation_codes": ["PHASE5_NO_NUMERIC_CASCADE"],
    }
    return {**base, **partial}


def _executable_assertions(assertions: list[dict]) -> list[dict]:
    by_dedupe: dict[str, dict] = {}
    for a in assertions:
        if a.get("source_tier") in NON_EXECUTABLE_TIERS or not a.get("phase_label"):
            continue
        existing = by_dedupe.get(a["dedupe_key"])
        if not existing or a["sequence_token"] > existing["sequence_token"]:
            by_dedupe[a["dedupe_key"]] = a
    return list(by_dedupe.values())


def _count_by_phase(items: list[dict]) -> dict[str, int]:
    counts: dict[str, int] = {}
    for i in items:
        label = i.get("phase_label")
        if not label:
            continue
        counts[label] = counts.get(label, 0) + 1
    return counts


def _resolve_duration(record: dict) -> dict:
    onset = record.get("structured_onset_date")
    assess = record.get("consultation_assessment_date")
    raw = record.get("raw_duration_days")
    onset_present = onset is not None and onset != ""
    assess_present = assess is not None and assess != ""
    has_raw = raw is not None

    if onset_present and not parse_iso_date_only(onset):
        return {
            "calculated": None,
            "supplied": raw if has_raw and is_valid_positive_integer_duration(raw) else None,
            "consistency": "INVALID_DATES",
            "effective": None,
            "invalid_dates": True,
        }
    if assess_present and not parse_iso_date_only(assess):
        return {
            "calculated": None,
            "supplied": raw if has_raw and is_valid_positive_integer_duration(raw) else None,
            "consistency": "INVALID_DATES",
            "effective": None,
            "invalid_dates": True,
        }

    both_dates = onset_present and assess_present
    calc = (
        inclusive_duration_days(onset, assess)
        if both_dates
        else {"days": None, "invalid": False}
    )

    if calc["invalid"]:
        return {
            "calculated": None,
            "supplied": raw if has_raw and is_valid_positive_integer_duration(raw) else None,
            "consistency": "INVALID_DATES",
            "effective": None,
            "invalid_dates": True,
        }

    supplied = raw if has_raw and is_valid_positive_integer_duration(raw) else None

    if both_dates and calc["days"] is not None and supplied is not None:
        if calc["days"] != supplied:
            return {
                "calculated": calc["days"],
                "supplied": supplied,
                "consistency": "MISMATCH",
                "effective": None,
                "invalid_dates": False,
            }
        return {
            "calculated": calc["days"],
            "supplied": supplied,
            "consistency": "MATCH",
            "effective": calc["days"],
            "invalid_dates": False,
        }
    if both_dates and calc["days"] is not None:
        return {
            "calculated": calc["days"],
            "supplied": None,
            "consistency": "CALCULATED_ONLY",
            "effective": calc["days"],
            "invalid_dates": False,
        }
    if (onset_present != assess_present) and supplied is not None:
        return {
            "calculated": None,
            "supplied": supplied,
            "consistency": "INCOMPLETE_DATES",
            "effective": supplied,
            "invalid_dates": False,
        }
    if (onset_present != assess_present) and supplied is None:
        return {
            "calculated": None,
            "supplied": None,
            "consistency": "INCOMPLETE_DATES",
            "effective": None,
            "invalid_dates": False,
        }
    if supplied is not None:
        return {
            "calculated": None,
            "supplied": supplied,
            "consistency": "SUPPLIED_ONLY",
            "effective": supplied,
            "invalid_dates": False,
        }
    return {
        "calculated": None,
        "supplied": None,
        "consistency": "NONE",
        "effective": None,
        "invalid_dates": False,
    }


def _try_cross_boundary_acute_sub_acute(
    fallback: str, counts: dict[str, int], doctor_structured: str | None
) -> dict:
    if fallback == "ACUTE":
        sub = counts.get("SUB_ACUTE", 0)
        ac = counts.get("ACUTE", 0)
        if doctor_structured == "SUB_ACUTE" or sub > ac:
            if doctor_structured == "SUB_ACUTE" or sub >= 2:
                return {"phase": "SUB_ACUTE", "source": "CROSS_BOUNDARY_OVERRIDE", "limitation": []}
            if sub == 1 and ac == 0:
                return {
                    "phase": fallback,
                    "source": "DAY_BAND",
                    "limitation": ["INSUFFICIENT_CORROBORATION_FOR_CROSS_BOUNDARY_OVERRIDE"],
                }
        if sub == ac and sub > 0:
            return {"phase": None, "source": "NONE", "limitation": []}
        return {"phase": fallback, "source": "DAY_BAND", "limitation": []}
    if fallback == "SUB_ACUTE":
        ac = counts.get("ACUTE", 0)
        sub = counts.get("SUB_ACUTE", 0)
        if doctor_structured == "ACUTE" or ac > sub:
            if doctor_structured == "ACUTE" or ac >= 2:
                return {"phase": "ACUTE", "source": "CROSS_BOUNDARY_OVERRIDE", "limitation": []}
            if ac == 1 and sub == 0:
                return {
                    "phase": fallback,
                    "source": "DAY_BAND",
                    "limitation": ["INSUFFICIENT_CORROBORATION_FOR_CROSS_BOUNDARY_OVERRIDE"],
                }
        if sub == ac and ac > 0:
            return {"phase": None, "source": "NONE", "limitation": []}
        return {"phase": fallback, "source": "DAY_BAND", "limitation": []}
    return {"phase": fallback, "source": "DAY_BAND", "limitation": []}


def _try_chronic_cross_boundary(
    fallback: str, counts: dict[str, int], doctor_structured: str | None
) -> dict:
    if fallback == "CHRONIC_MODERATE":
        deep = counts.get("DEEP_CHRONIC", 0)
        mod = counts.get("CHRONIC_MODERATE", 0)
        if deep > mod and deep >= 2:
            return {"phase": "DEEP_CHRONIC", "source": "CROSS_BOUNDARY_OVERRIDE", "limitation": []}
        if deep == mod and deep > 0:
            return {"phase": None, "source": "NONE", "limitation": []}
        if deep == 1 and mod == 0:
            return {
                "phase": fallback,
                "source": "DAY_BAND",
                "limitation": ["INSUFFICIENT_CORROBORATION_FOR_CROSS_BOUNDARY_OVERRIDE"],
            }
        return {"phase": fallback, "source": "DAY_BAND", "limitation": []}
    if fallback == "DEEP_CHRONIC":
        mod = counts.get("CHRONIC_MODERATE", 0)
        deep = counts.get("DEEP_CHRONIC", 0)
        if doctor_structured == "CHRONIC_MODERATE" or mod > deep:
            if doctor_structured == "CHRONIC_MODERATE" or mod >= 2:
                return {
                    "phase": "CHRONIC_MODERATE",
                    "source": "CROSS_BOUNDARY_OVERRIDE",
                    "limitation": [],
                }
        if mod == deep and mod > 0:
            return {"phase": None, "source": "NONE", "limitation": []}
        return {"phase": fallback, "source": "DAY_BAND", "limitation": []}
    return {"phase": fallback, "source": "DAY_BAND", "limitation": []}


def _resolve_from_evidence_only(usable: list[dict]) -> dict:
    counts = _count_by_phase(usable)
    labels = list(counts.keys())
    if not labels:
        return {"phase": None, "ambiguous": False, "contradictory": False}
    if len(labels) == 1:
        return {"phase": labels[0], "ambiguous": False, "contradictory": False}
    max_count = max(counts.values())
    top = [l for l in labels if counts[l] == max_count]
    if len(top) > 1:
        return {"phase": None, "ambiguous": False, "contradictory": True}
    top_label = top[0]
    others = [l for l in labels if l != top_label]
    second = max((counts[l] for l in others), default=0)
    if second == max_count:
        return {"phase": None, "ambiguous": False, "contradictory": True}
    return {"phase": top_label, "ambiguous": False, "contradictory": False}


def resolve_phase_for_slot(record: dict) -> dict:
    reason_codes: list[str] = []
    limitation_codes = ["PHASE5_NO_NUMERIC_CASCADE"]

    if record.get("patient_global_acute_on_chronic_label_only"):
        return _empty_slot(
            record,
            {
                "phase_status": "PHASE_TARGET_CONTRADICTORY",
                "reason_codes": [*reason_codes, "ACUTE_CHRONIC_TARGET_SEPARATION_FAILED"],
                "limitation_codes": limitation_codes,
            },
        )

    assertions = record.get("phase_evidence_assertions") or []
    has_vague = any(a.get("source_tier") == "VAGUE_TIMELINE" for a in assertions)
    has_registry = any(a.get("source_tier") == "REGISTRY_KEYWORD" for a in assertions)
    if has_vague:
        reason_codes.append("VAGUE_TIMELINE_NOT_EXECUTABLE")
    if has_registry:
        reason_codes.append("REGISTRY_Q12_SELECTOR_BLOCKED")

    if record.get("target_role") == "CURRENT_ACUTE_FLARE":
        if not record.get("verified_chronic_baseline") or record.get("flare_separation_safe") is False:
            return _empty_slot(
                record,
                {
                    "phase_status": "PHASE_TARGET_CONTRADICTORY",
                    "flare_status": "SEPARATION_FAILED",
                    "reason_codes": [*reason_codes, "ACUTE_CHRONIC_TARGET_SEPARATION_FAILED"],
                    "limitation_codes": limitation_codes,
                },
            )

    dur = _resolve_duration(record)
    if dur["consistency"] == "MISMATCH":
        return _empty_slot(
            record,
            {
                "phase_status": "PHASE_CONTRADICTORY",
                "calculated_duration_days": dur["calculated"],
                "supplied_duration_days": dur["supplied"],
                "duration_consistency_status": "MISMATCH",
                "reason_codes": [*reason_codes, "PHASE_CONTRADICTORY"],
                "limitation_codes": limitation_codes,
            },
        )

    if dur["invalid_dates"]:
        usable = _executable_assertions(assertions)
        ev = _resolve_from_evidence_only(usable)
        if ev["phase"]:
            return _empty_slot(
                record,
                {
                    "phase_status": "RESOLVED_BY_EVIDENCE",
                    "resolved_phase": ev["phase"],
                    "phase_resolution_source": "STRUCTURED_EVIDENCE",
                    "duration_consistency_status": "INVALID_DATES",
                    "evidence_item_ids": [u["evidence_item_id"] for u in usable],
                    "limitation_codes": [*limitation_codes, "INVALID_DURATION_IGNORED"],
                    "reason_codes": reason_codes,
                },
            )
        return _empty_slot(
            record,
            {
                "phase_status": "INVALID_DURATION",
                "duration_consistency_status": "INVALID_DATES",
                "reason_codes": [*reason_codes, "PHASE_EVIDENCE_INVALID"],
                "limitation_codes": limitation_codes,
            },
        )

    usable = _executable_assertions(assertions)
    doctor_structured = next(
        (a["phase_label"] for a in usable if a.get("source_tier") == "DOCTOR_STRUCTURED"),
        None,
    )
    counts = _count_by_phase(usable)

    if dur["effective"] is None and not usable:
        explicit_ambiguous = _explicitly_ambiguous_assertions(assertions)
        if explicit_ambiguous:
            return _empty_slot(
                record,
                {
                    "phase_status": "PHASE_AMBIGUOUS",
                    "duration_consistency_status": dur["consistency"],
                    "evidence_item_ids": [a["evidence_item_id"] for a in explicit_ambiguous],
                    "reason_codes": [*reason_codes, "PHASE_EVIDENCE_AMBIGUOUS"],
                    "limitation_codes": limitation_codes,
                },
            )
        if _is_invalid_only_pool(assertions):
            return _empty_slot(
                record,
                {
                    "phase_status": "INVALID_EVIDENCE",
                    "duration_consistency_status": dur["consistency"],
                    "reason_codes": [*reason_codes, "PHASE_EVIDENCE_INVALID"],
                    "limitation_codes": limitation_codes,
                },
            )
        return _empty_slot(
            record,
            {
                "phase_status": "MISSING_EVIDENCE",
                "duration_consistency_status": dur["consistency"],
                "reason_codes": [*reason_codes, "PHASE_EVIDENCE_MISSING"],
                "limitation_codes": limitation_codes,
            },
        )

    if dur["effective"] is None and usable:
        ev = _resolve_from_evidence_only(usable)
        if ev["contradictory"]:
            return _empty_slot(
                record,
                {
                    "phase_status": "PHASE_CONTRADICTORY",
                    "duration_consistency_status": dur["consistency"],
                    "evidence_item_ids": [u["evidence_item_id"] for u in usable],
                    "reason_codes": [*reason_codes, "PHASE_CONTRADICTORY"],
                    "limitation_codes": limitation_codes,
                },
            )
        if ev["ambiguous"] or not ev["phase"]:
            return _empty_slot(
                record,
                {
                    "phase_status": "PHASE_AMBIGUOUS",
                    "duration_consistency_status": dur["consistency"],
                    "evidence_item_ids": [u["evidence_item_id"] for u in usable],
                    "reason_codes": [*reason_codes, "PHASE_EVIDENCE_AMBIGUOUS"],
                    "limitation_codes": limitation_codes,
                },
            )
        return _empty_slot(
            record,
            {
                "phase_status": "RESOLVED_BY_EVIDENCE",
                "resolved_phase": ev["phase"],
                "phase_resolution_source": "STRUCTURED_EVIDENCE",
                "duration_consistency_status": dur["consistency"],
                "evidence_item_ids": [u["evidence_item_id"] for u in usable],
                "reason_codes": reason_codes,
                "limitation_codes": limitation_codes,
            },
        )

    fallback = fallback_phase_from_duration_days(dur["effective"])
    resolved: str | None = fallback
    source = "DAY_BAND"
    extra_lim: list[str] = []

    if usable:
        acute_sub = _try_cross_boundary_acute_sub_acute(fallback, counts, doctor_structured)
        if (
            acute_sub["phase"] is None
            and fallback not in ("CHRONIC_MODERATE", "DEEP_CHRONIC")
        ):
            return _empty_slot(
                record,
                {
                    "phase_status": "PHASE_CONTRADICTORY",
                    "calculated_duration_days": dur["calculated"],
                    "supplied_duration_days": dur["supplied"],
                    "duration_consistency_status": dur["consistency"],
                    "evidence_item_ids": [u["evidence_item_id"] for u in usable],
                    "reason_codes": [*reason_codes, "PHASE_CONTRADICTORY"],
                    "limitation_codes": limitation_codes,
                },
            )
        if acute_sub["phase"] is not None and fallback in ("ACUTE", "SUB_ACUTE"):
            resolved = acute_sub["phase"]
            source = acute_sub["source"]
            extra_lim = acute_sub["limitation"]
        else:
            chronic = _try_chronic_cross_boundary(fallback, counts, doctor_structured)
            if chronic["phase"] is None:
                return _empty_slot(
                    record,
                    {
                        "phase_status": "PHASE_CONTRADICTORY",
                        "calculated_duration_days": dur["calculated"],
                        "supplied_duration_days": dur["supplied"],
                        "duration_consistency_status": dur["consistency"],
                        "evidence_item_ids": [u["evidence_item_id"] for u in usable],
                        "reason_codes": [*reason_codes, "PHASE_CONTRADICTORY"],
                        "limitation_codes": limitation_codes,
                    },
                )
            resolved = chronic["phase"]
            source = chronic["source"]
            extra_lim = chronic["limitation"]

    flare_status = "NOT_APPLICABLE"
    if record.get("target_role") == "CURRENT_ACUTE_FLARE" and record.get("verified_chronic_baseline"):
        flare_status = "ACUTE_EXACERBATION_ON_CHRONIC"
    elif record.get("current_manifestation_phase") == "STABLE_BASELINE":
        flare_status = "STABLE_BASELINE"

    if source == "CROSS_BOUNDARY_OVERRIDE":
        phase_status = "RESOLVED_BY_CROSS_BOUNDARY_OVERRIDE"
    elif source == "STRUCTURED_EVIDENCE":
        phase_status = "RESOLVED_BY_EVIDENCE"
    else:
        phase_status = "RESOLVED_BY_DAY_BAND"

    return _empty_slot(
        record,
        {
            "phase_status": phase_status,
            "resolved_phase": resolved,
            "phase_resolution_source": source,
            "calculated_duration_days": dur["calculated"],
            "supplied_duration_days": dur["supplied"],
            "duration_consistency_status": dur["consistency"],
            "evidence_item_ids": [u["evidence_item_id"] for u in usable],
            "flare_status": flare_status,
            "reason_codes": [*reason_codes, "PHASE_ALONE_NOT_A_POTENCY_SELECTOR"],
            "limitation_codes": sorted(set([*limitation_codes, *extra_lim])),
        },
    )
