"""Integer severity scale 1–10 and bands — Phase 6 structured severity."""

from __future__ import annotations

RULE4_SEVERITY_BAND_VALUES = ("LOW", "MODERATE", "HIGH")


def is_valid_integer_score(value: object) -> bool:
    if not isinstance(value, int) or isinstance(value, bool):
        return False
    return 1 <= value <= 10


def is_valid_band(value: object) -> bool:
    return value in RULE4_SEVERITY_BAND_VALUES


def band_from_score(score: int) -> str:
    if 1 <= score <= 3:
        return "LOW"
    if 4 <= score <= 6:
        return "MODERATE"
    if 7 <= score <= 10:
        return "HIGH"
    raise ValueError("score out of range")


def bands_match(score: int, band: str) -> bool:
    return band_from_score(score) == band
