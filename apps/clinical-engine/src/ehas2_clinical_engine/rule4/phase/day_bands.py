from __future__ import annotations


def fallback_phase_from_duration_days(days: int) -> str:
    if 1 <= days <= 14:
        return "ACUTE"
    if 15 <= days <= 45:
        return "SUB_ACUTE"
    if 46 <= days <= 90:
        return "CHRONIC_MODERATE"
    return "DEEP_CHRONIC"
