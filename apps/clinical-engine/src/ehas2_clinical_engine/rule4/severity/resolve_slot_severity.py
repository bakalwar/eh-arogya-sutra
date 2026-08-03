from __future__ import annotations

from .severity_scale import band_from_score, bands_match, is_valid_band, is_valid_integer_score

NON_EXECUTABLE_TIERS = frozenset(
    {
        "INVALID_ITEM",
        "INVALID_SCORE",
        "INVALID_BAND",
        "VAGUE_TEXT",
        "REGISTRY_KEYWORD",
        "NEGATED",
        "UNVERIFIED",
        "STRUCTURED_SEVERITY_AMBIGUOUS",
    }
)

INVALID_ONLY_TIERS = frozenset(
    {"INVALID_ITEM", "INVALID_SCORE", "INVALID_BAND", "NEGATED", "UNVERIFIED"}
)


def _empty_slot(record: dict, partial: dict) -> dict:
    base = {
        "formula_slot_id": record["formula_slot_id"],
        "formula_target_id": record["formula_target_id"],
        "target_role": record["target_role"],
        "severity_status": "NOT_EVALUATED",
        "severity_score": None,
        "severity_band": None,
        "severity_resolution_source": "NONE",
        "binding_status": "BOUND",
        "evidence_item_ids": [],
        "corroborating_source_ids": [],
        "selected_cascade": None,
        "selected_dilution": None,
        "reason_codes": [],
        "limitation_codes": ["PHASE6_NO_NUMERIC_CASCADE"],
        "upstream_context_status": "NOT_EVALUATED",
    }
    base.update(partial)
    return base


def _parse_assertion(a: dict) -> tuple[dict | None, bool]:
    if a.get("source_tier") in NON_EXECUTABLE_TIERS:
        return None, False
    score = a.get("severity_score")
    band = a.get("severity_band")
    score_ok = score is not None and is_valid_integer_score(score)
    band_ok = band is not None and is_valid_band(band)
    tier = a.get("source_tier")
    if tier in {"DOCTOR_STRUCTURED", "INDEPENDENT_USABLE"}:
        if score_ok and band_ok and not bands_match(score, band):
            return None, True
        if score_ok and band_ok:
            return (
                {
                    "evidence_item_id": a["evidence_item_id"],
                    "score": score,
                    "band": band,
                    "tier": tier,
                    "sequence_token": a["sequence_token"],
                    "dedupe_key": a["dedupe_key"],
                    "parent_source_id": a.get("parent_source_id"),
                },
                False,
            )
        if score_ok:
            return (
                {
                    "evidence_item_id": a["evidence_item_id"],
                    "score": score,
                    "band": band_from_score(score),
                    "tier": tier,
                    "sequence_token": a["sequence_token"],
                    "dedupe_key": a["dedupe_key"],
                    "parent_source_id": a.get("parent_source_id"),
                },
                False,
            )
        if band_ok:
            return (
                {
                    "evidence_item_id": a["evidence_item_id"],
                    "score": None,
                    "band": band,
                    "tier": tier,
                    "sequence_token": a["sequence_token"],
                    "dedupe_key": a["dedupe_key"],
                    "parent_source_id": a.get("parent_source_id"),
                },
                False,
            )
    return None, False


def _build_usable_pool(assertions: list[dict]) -> dict:
    by_dedupe: dict[str, dict] = {}
    has_score_band_mismatch = False
    has_explicit_ambiguous = False
    has_invalid_submitted = False
    for a in assertions:
        if a.get("source_tier") == "STRUCTURED_SEVERITY_AMBIGUOUS":
            has_explicit_ambiguous = True
            continue
        if a.get("source_tier") in INVALID_ONLY_TIERS:
            has_invalid_submitted = True
            continue
        usable, mismatch = _parse_assertion(a)
        if mismatch:
            has_score_band_mismatch = True
            continue
        if not usable:
            if a.get("source_tier") in {"DOCTOR_STRUCTURED", "INDEPENDENT_USABLE"}:
                has_invalid_submitted = True
            continue
        existing = by_dedupe.get(a["dedupe_key"])
        if not existing or a["sequence_token"] > existing["sequence_token"]:
            by_dedupe[a["dedupe_key"]] = usable
    return {
        "usable": list(by_dedupe.values()),
        "has_score_band_mismatch": has_score_band_mismatch,
        "has_explicit_ambiguous": has_explicit_ambiguous,
        "has_invalid_submitted": has_invalid_submitted,
    }


def _resolve_same_timestamp_group(entries: list[dict]) -> dict:
    scores = [e["score"] for e in entries if e["score"] is not None]
    bands = list({e["band"] for e in entries})
    if len(bands) > 1:
        return {
            "status": "SEVERITY_CONTRADICTORY",
            "score": None,
            "band": None,
            "contradictory": True,
        }
    band = bands[0]
    if not scores:
        return {
            "status": "RESOLVED_BAND_ONLY",
            "score": None,
            "band": band,
            "contradictory": False,
        }
    unique_scores = list(set(scores))
    if len(unique_scores) == 1:
        return {
            "status": "RESOLVED_NUMERIC",
            "score": unique_scores[0],
            "band": band,
            "contradictory": False,
        }
    if all(band_from_score(s) == band for s in unique_scores):
        return {
            "status": "RESOLVED_BAND_ONLY",
            "score": None,
            "band": band,
            "contradictory": False,
        }
    return {
        "status": "SEVERITY_CONTRADICTORY",
        "score": None,
        "band": None,
        "contradictory": True,
    }


def _resolve_corroboration(entries: list[dict]) -> dict:
    doctor = [e for e in entries if e["tier"] == "DOCTOR_STRUCTURED"]
    if len(doctor) == 1:
        d = doctor[0]
        return {
            "status": "RESOLVED_NUMERIC" if d["score"] is not None else "RESOLVED_BAND_ONLY",
            "score": d["score"],
            "band": d["band"],
            "source": "DOCTOR_STRUCTURED",
        }
    if len(doctor) > 1:
        g = _resolve_same_timestamp_group(doctor)
        if g["contradictory"]:
            return {"status": "SEVERITY_CONTRADICTORY", "score": None, "band": None, "source": "NONE"}
        return {
            "status": g["status"],
            "score": g["score"],
            "band": g["band"],
            "source": "DOCTOR_STRUCTURED",
        }
    independent = [e for e in entries if e["tier"] == "INDEPENDENT_USABLE"]
    if not independent:
        return {"status": "MISSING_EVIDENCE", "score": None, "band": None, "source": "NONE"}
    if len(independent) == 1:
        return {
            "status": "INSUFFICIENT_CORROBORATION",
            "score": None,
            "band": None,
            "source": "NONE",
        }
    by_time: dict[str, list[dict]] = {}
    for e in independent:
        by_time.setdefault(e["sequence_token"], []).append(e)
    if len(by_time) > 1:
        bands = {e["band"] for e in independent}
        if len(bands) > 1:
            return {
                "status": "SEVERITY_CONTRADICTORY",
                "score": None,
                "band": None,
                "source": "NONE",
            }
    g = _resolve_same_timestamp_group(independent)
    if g["contradictory"]:
        return {"status": "SEVERITY_CONTRADICTORY", "score": None, "band": None, "source": "NONE"}
    return {
        "status": g["status"],
        "score": g["score"],
        "band": g["band"],
        "source": "INDEPENDENT_CORROBORATION",
    }


def resolve_severity_for_slot(record: dict) -> dict:
    reason_codes: list[str] = []
    limitation_codes = ["PHASE6_NO_NUMERIC_CASCADE"]
    if record.get("patient_global_max_severity_label_only"):
        return _empty_slot(
            record,
            {
                "severity_status": "SEVERITY_CONTRADICTORY",
                "reason_codes": sorted([*reason_codes, "GLOBAL_SEVERITY_LEAKAGE_BLOCKED"]),
                "limitation_codes": limitation_codes,
            },
        )
    assertions = record.get("severity_evidence_assertions") or []
    if any(a.get("source_tier") == "VAGUE_TEXT" for a in assertions):
        reason_codes.append("VAGUE_TIMELINE_NOT_EXECUTABLE")
    if any(a.get("source_tier") == "REGISTRY_KEYWORD" for a in assertions):
        reason_codes.append("REGISTRY_Q13_SELECTOR_BLOCKED")
    pool = _build_usable_pool(assertions)
    if pool["has_score_band_mismatch"]:
        return _empty_slot(
            record,
            {
                "severity_status": "SEVERITY_CONTRADICTORY",
                "reason_codes": sorted([*reason_codes, "SEVERITY_SCORE_BAND_MISMATCH"]),
                "limitation_codes": limitation_codes,
            },
        )
    if pool["has_explicit_ambiguous"] and not pool["usable"]:
        return _empty_slot(
            record,
            {
                "severity_status": "INSUFFICIENT_CORROBORATION",
                "evidence_item_ids": [
                    a["evidence_item_id"]
                    for a in assertions
                    if a.get("source_tier") == "STRUCTURED_SEVERITY_AMBIGUOUS"
                ],
                "reason_codes": sorted([*reason_codes, "SEVERITY_EVIDENCE_AMBIGUOUS"]),
                "limitation_codes": sorted([*limitation_codes, "SEVERITY_AMBIGUOUS"]),
            },
        )
    if not pool["usable"]:
        if not assertions:
            return _empty_slot(
                record,
                {
                    "severity_status": "MISSING_EVIDENCE",
                    "reason_codes": sorted([*reason_codes, "SEVERITY_VALUE_MISSING"]),
                    "limitation_codes": limitation_codes,
                },
            )
        if pool["has_invalid_submitted"]:
            return _empty_slot(
                record,
                {
                    "severity_status": "INVALID_EVIDENCE",
                    "reason_codes": sorted([*reason_codes, "INVALID_SEVERITY_NUMERIC_VALUE"]),
                    "limitation_codes": limitation_codes,
                },
            )
        return _empty_slot(
            record,
            {
                "severity_status": "MISSING_EVIDENCE",
                "reason_codes": sorted([*reason_codes, "SEVERITY_VALUE_MISSING"]),
                "limitation_codes": limitation_codes,
            },
        )
    resolved = _resolve_corroboration(pool["usable"])
    extra = (
        []
        if resolved["status"] == "INSUFFICIENT_CORROBORATION"
        else ["SEVERITY_ALONE_NOT_A_POTENCY_SELECTOR"]
    )
    corroborating = sorted(
        {u["parent_source_id"] for u in pool["usable"] if u.get("parent_source_id")}
    )
    return _empty_slot(
        record,
        {
            "severity_status": resolved["status"],
            "severity_score": resolved["score"],
            "severity_band": resolved["band"],
            "severity_resolution_source": resolved["source"],
            "evidence_item_ids": [u["evidence_item_id"] for u in pool["usable"]],
            "corroborating_source_ids": corroborating,
            "reason_codes": sorted([*reason_codes, *extra]),
            "limitation_codes": limitation_codes,
        },
    )
