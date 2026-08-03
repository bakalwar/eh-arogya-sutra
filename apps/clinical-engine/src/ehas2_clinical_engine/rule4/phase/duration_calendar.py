from __future__ import annotations

import re
from dataclasses import dataclass
from datetime import date

ISO_DATE = re.compile(r"^(\d{4})-(\d{2})-(\d{2})$")


@dataclass(frozen=True)
class ParsedIsoDate:
    y: int
    m: int
    d: int


def parse_iso_date_only(value: str | None) -> ParsedIsoDate | None:
    if value is None or not isinstance(value, str):
        return None
    trimmed = value.strip()
    m = ISO_DATE.match(trimmed)
    if not m:
        return None
    y, mo, d = int(m.group(1)), int(m.group(2)), int(m.group(3))
    try:
        date(y, mo, d)
    except ValueError:
        return None
    return ParsedIsoDate(y=y, m=mo, d=d)


def _day_number(parts: ParsedIsoDate) -> int:
    """UTC calendar day number for stable arithmetic (matches TS dayNumber)."""
    y2, m2 = parts.y, parts.m
    if m2 <= 2:
        y2 -= 1
        m2 += 12
    era = y2 // 400
    yoe = y2 - era * 400
    doy = (153 * (m2 - 3) + 2) // 5 + parts.d - 1
    doe = yoe * 365 + yoe // 4 - yoe // 100 + doy
    return era * 146097 + doe - 719468


def inclusive_duration_days(
    onset: str | None, assessment: str | None
) -> dict:
    o = parse_iso_date_only(onset)
    a = parse_iso_date_only(assessment)
    if not o or not a:
        return {"days": None, "invalid": False}
    diff = _day_number(a) - _day_number(o)
    if diff < 0:
        return {"days": None, "invalid": True}
    return {"days": diff + 1, "invalid": False}


def is_valid_positive_integer_duration(raw: object) -> bool:
    return isinstance(raw, int) and not isinstance(raw, bool) and raw > 0
