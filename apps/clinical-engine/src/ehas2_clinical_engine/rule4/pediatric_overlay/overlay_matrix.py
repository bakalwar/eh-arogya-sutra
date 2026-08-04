from __future__ import annotations

POSITIVE_DILUTIONS = frozenset({"D3", "D5", "D10", "D30", "D60"})
NEGATIVE_DILUTIONS = frozenset({"D1", "D2"})

D13_C_MATRIX: dict[str, dict[str, str]] = {
    "P13_C": {
        "D3": "RESTRICT",
        "D5": "ALLOW",
        "D10": "RESTRICT",
        "D30": "PROHIBIT",
        "D60": "PROHIBIT",
    },
    "P13_D": {
        "D3": "RESTRICT",
        "D5": "ALLOW",
        "D10": "RESTRICT",
        "D30": "RESTRICT",
        "D60": "PROHIBIT",
    },
}

Q8_H_MATRIX: dict[str, dict[str, str]] = {
    "P13_C": {"D1": "PROHIBIT", "D2": "RESTRICT"},
    "P13_D": {"D1": "RESTRICT", "D2": "ALLOW"},
}


def pediatric_matrix_authority_for_dilution(dilution: str) -> str:
    if dilution in POSITIVE_DILUTIONS:
        return "D13_C_POSITIVE"
    if dilution in NEGATIVE_DILUTIONS:
        return "Q8_H_NEGATIVE"
    return "NOT_APPLICABLE"


def overlay_cell_for_band_and_dilution(band: str | None, dilution: str) -> str:
    if band in {"P13_A", "P13_B"}:
        return "NOT_APPLICABLE_UNDER_HARD_STOP"
    if band in {None, "P13_E"}:
        return "NOT_APPLICABLE"
    if dilution in {"D1", "D2"}:
        return Q8_H_MATRIX[band][dilution]
    if dilution in POSITIVE_DILUTIONS:
        return D13_C_MATRIX[band][dilution]
    return "NOT_APPLICABLE"
