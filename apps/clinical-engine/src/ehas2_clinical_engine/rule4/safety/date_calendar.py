from __future__ import annotations

import json
import re
from dataclasses import dataclass
from datetime import date
from typing import Literal

ISO_DATE = re.compile(r"^(\d{4})-(\d{2})-(\d{2})$")

PediatricBand = Literal["P13_A", "P13_B", "P13_C", "P13_D", "P13_E"] | None


@dataclass(frozen=True)
class CalendarDate:
    year: int
    month: int
    day: int


def parse_iso_date_only(value: str | None) -> CalendarDate | None:
    if value is None or not isinstance(value, str):
        return None
    trimmed = value.strip()
    m = ISO_DATE.match(trimmed)
    if not m:
        return None
    year, month, day = int(m.group(1)), int(m.group(2)), int(m.group(3))
    try:
        date(year, month, day)
    except ValueError:
        return None
    return CalendarDate(year, month, day)


def _to_date(parts: CalendarDate) -> date:
    return date(parts.year, parts.month, parts.day)


def calendar_days_between(from_parts: CalendarDate, to_parts: CalendarDate) -> int:
    return (_to_date(to_parts) - _to_date(from_parts)).days


def first_birthday_date(dob: CalendarDate) -> CalendarDate:
    try:
        fb = date(dob.year + 1, dob.month, dob.day)
        return CalendarDate(fb.year, fb.month, fb.day)
    except ValueError:
        fb = date(dob.year + 1, dob.month, max(1, dob.day - 1))
        return CalendarDate(fb.year, fb.month, fb.day)


def is_strictly_before(left: CalendarDate, right: CalendarDate) -> bool:
    return _to_date(left) < _to_date(right)


def completed_years_between(dob: CalendarDate, on: CalendarDate) -> int:
    years = on.year - dob.year
    try:
        birthday_this_year = date(on.year, dob.month, dob.day)
    except ValueError:
        birthday_this_year = date(on.year, dob.month, max(1, dob.day - 1))
    if _to_date(on) < birthday_this_year:
        years -= 1
    return max(0, years)


def band_from_days_and_calendar(
    days_since_birth: int, dob: CalendarDate, assessment: CalendarDate
) -> PediatricBand:
    fb = first_birthday_date(dob)
    if is_strictly_before(assessment, fb):
        if 0 <= days_since_birth <= 28:
            return "P13_A"
        if days_since_birth >= 29:
            return "P13_B"
        return None
    completed = completed_years_between(dob, assessment)
    if 1 <= completed <= 5:
        return "P13_C"
    if 6 <= completed <= 12:
        return "P13_D"
    if completed >= 13:
        return "P13_E"
    return None
