from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any

from .date_calendar import (
    band_from_days_and_calendar,
    calendar_days_between,
    first_birthday_date,
    is_strictly_before,
    parse_iso_date_only,
)

UPSTREAM_AGE_SOURCES = frozenset(
    {
        "VERIFIED_DOB_CALENDAR",
        "DOCTOR_STRUCTURED",
        "APPROVED_UPSTREAM",
        "VERIFIED_IDENTITY_REGISTRATION",
    }
)
P13_BANDS = frozenset({"P13_A", "P13_B", "P13_C", "P13_D", "P13_E"})


@dataclass
class AgeResolution:
    verification_status: str
    pediatric_band: str | None
    days_since_birth: int | None
    is_under_one_year: bool
    reason_codes: list[str] = field(default_factory=list)
    limitation_codes: list[str] = field(default_factory=list)


def _normalize_age_ctx(ctx: dict[str, Any]) -> dict[str, Any]:
    if not ctx:
        return {"verification_status": "MISSING"}
    return {
        "verification_status": ctx.get("verification_status")
        or ctx.get("verificationStatus")
        or "MISSING",
        "verified_date_of_birth": ctx.get("verified_date_of_birth") or ctx.get("verifiedDateOfBirth"),
        "consultation_assessment_date": ctx.get("consultation_assessment_date")
        or ctx.get("consultationAssessmentDate"),
        "age_years": ctx.get("age_years", ctx.get("ageYears")),
        "age_source": ctx.get("age_source") or ctx.get("ageSource"),
        "pediatric_band_verification_status": ctx.get("pediatric_band_verification_status")
        or ctx.get("pediatricBandVerificationStatus"),
        "upstream_verified_pediatric_band": ctx.get("upstream_verified_pediatric_band")
        or ctx.get("upstreamVerifiedPediatricBand"),
    }


def _band_from_dob_calendar(ctx: dict[str, Any]) -> AgeResolution | None:
    dob = parse_iso_date_only(ctx.get("verified_date_of_birth"))
    assessment = parse_iso_date_only(ctx.get("consultation_assessment_date"))
    if not dob or not assessment:
        return None
    days = calendar_days_between(dob, assessment)
    if days < 0:
        return AgeResolution("INVALID", None, days, False, ["VERIFIED_AGE_INVALID"], [])
    fb = first_birthday_date(dob)
    is_under = is_strictly_before(assessment, fb)
    band = band_from_days_and_calendar(days, dob, assessment)
    return AgeResolution("VERIFIED", band, days, is_under, [], [])


def _upstream_band_candidate(ctx: dict[str, Any]) -> str | None:
    if ctx.get("pediatric_band_verification_status") != "VERIFIED":
        return None
    band = ctx.get("upstream_verified_pediatric_band")
    if band not in P13_BANDS:
        return None
    return band


def _resolve_from_upstream_band(ctx: dict[str, Any]) -> AgeResolution | None:
    band = _upstream_band_candidate(ctx)
    if band is None:
        return None
    age_source = (ctx.get("age_source") or "").strip()
    if not age_source:
        return AgeResolution(
            "UNRESOLVED",
            None,
            None,
            False,
            ["UPSTREAM_AGE_BAND_PROVENANCE_MISSING"],
            ["UPSTREAM_AGE_BAND_PROVENANCE_REQUIRED"],
        )
    if age_source == "OWNER_STRUCTURED" or age_source not in UPSTREAM_AGE_SOURCES:
        return AgeResolution(
            "UNRESOLVED",
            None,
            None,
            False,
            ["UPSTREAM_AGE_SOURCE_NOT_AUTHORIZED"],
            ["UPSTREAM_AGE_BAND_PROVENANCE_REQUIRED"],
        )
    is_under = band in {"P13_A", "P13_B"}
    return AgeResolution("VERIFIED", band, None, is_under, [], [])


def resolve_verified_age(ctx: dict[str, Any]) -> AgeResolution:
    ctx = _normalize_age_ctx(ctx)
    status = ctx.get("verification_status") or "MISSING"
    if status == "CONTRADICTORY":
        return AgeResolution("CONTRADICTORY", None, None, False, ["VERIFIED_AGE_CONTRADICTORY"], [])
    if status == "INVALID":
        return AgeResolution("INVALID", None, None, False, ["VERIFIED_AGE_INVALID"], [])
    if status == "MISSING":
        return AgeResolution("MISSING", None, None, False, ["VERIFIED_AGE_MISSING"], [])

    dob_raw = ctx.get("verified_date_of_birth")
    assess_raw = ctx.get("consultation_assessment_date")
    if dob_raw and str(dob_raw).strip() and not parse_iso_date_only(dob_raw):
        return AgeResolution("INVALID", None, None, False, ["VERIFIED_AGE_INVALID"], [])
    if assess_raw and str(assess_raw).strip() and not parse_iso_date_only(assess_raw):
        return AgeResolution("INVALID", None, None, False, ["VERIFIED_AGE_INVALID"], [])

    from_dob = _band_from_dob_calendar(ctx)
    upstream_band = _upstream_band_candidate(ctx)
    has_dob_pair = parse_iso_date_only(ctx.get("verified_date_of_birth")) and parse_iso_date_only(
        ctx.get("consultation_assessment_date")
    )

    if has_dob_pair and from_dob:
        if from_dob.verification_status == "INVALID":
            return from_dob
        if upstream_band is not None and from_dob.pediatric_band != upstream_band:
            return AgeResolution(
                "CONTRADICTORY",
                None,
                from_dob.days_since_birth,
                False,
                ["VERIFIED_AGE_CONTRADICTORY"],
                ["DOB_UPSTREAM_PEDIATRIC_BAND_CONFLICT"],
            )
        return from_dob

    if upstream_band is not None and ctx.get("pediatric_band_verification_status") == "VERIFIED":
        resolved = _resolve_from_upstream_band(ctx)
        if resolved:
            return resolved
        return AgeResolution(
            "UNRESOLVED",
            None,
            None,
            False,
            ["UPSTREAM_AGE_BAND_INVALID_SUPPORTING"],
            [],
        )

    if has_dob_pair and not from_dob:
        return AgeResolution("INVALID", None, None, False, ["VERIFIED_AGE_INVALID"], [])

    from_upstream = _resolve_from_upstream_band(ctx)
    if from_upstream:
        return from_upstream

    if ctx.get("age_years") is not None:
        return AgeResolution("UNRESOLVED", None, None, False, ["VERIFIED_AGE_MISSING"], [])

    mapped = {
        "MISSING": "VERIFIED_AGE_MISSING",
        "INVALID": "VERIFIED_AGE_INVALID",
        "CONTRADICTORY": "VERIFIED_AGE_CONTRADICTORY",
    }.get(status)
    codes = [mapped] if mapped else ["VERIFIED_AGE_MISSING"]
    return AgeResolution(status, None, None, False, codes, [])
