from __future__ import annotations

from typing import Literal, TypedDict


class FormulaBpReading(TypedDict, total=False):
    formula_slot_id: str
    formula_target_id: str
    systolic_mm_hg: float
    diastolic_mm_hg: float
    unit: Literal["mmHg"]
    verification_status: str
    reading_role: str
    evidence_item_id: str | None
    organ_target_binding_status: str
    cardiac_target_class: str | None


class FormulaBpGateResult(TypedDict):
    outcome: Literal["PASS", "FAIL", "MISSING_INPUT", "CONTRADICTORY"]
    reason_codes: list[str]


def _mm_hg_numeric(value: object) -> float | None:
    if isinstance(value, bool):
        return None
    if isinstance(value, int | float):
        return float(value)
    return None


def evaluate_formula_bp_stage_gate(
    reading: FormulaBpReading | None,
    required_stage: Literal[1, 2],
) -> FormulaBpGateResult:
    if not reading:
        return {"outcome": "MISSING_INPUT", "reason_codes": ["FORMULA_BP_READING_MISSING"]}
    if reading.get("unit") != "mmHg":
        return {"outcome": "MISSING_INPUT", "reason_codes": ["FORMULA_BP_NOT_VERIFIED"]}
    if reading.get("verification_status") != "VERIFIED":
        return {"outcome": "MISSING_INPUT", "reason_codes": ["FORMULA_BP_NOT_VERIFIED"]}
    if reading.get("organ_target_binding_status") == "MISMATCH":
        return {"outcome": "CONTRADICTORY", "reason_codes": ["FORMULA_BP_TARGET_MISMATCH"]}
    if reading.get("organ_target_binding_status") == "MISSING":
        return {"outcome": "MISSING_INPUT", "reason_codes": ["FORMULA_BP_BINDING_MISSING"]}
    sys_val = _mm_hg_numeric(reading.get("systolic_mm_hg"))
    dia_val = _mm_hg_numeric(reading.get("diastolic_mm_hg"))
    if sys_val is None or dia_val is None:
        return {"outcome": "MISSING_INPUT", "reason_codes": ["FORMULA_BP_READING_MISSING"]}
    sys = sys_val
    dia = dia_val
    if required_stage == 1:
        stage1 = (140 <= sys <= 159) or (90 <= dia <= 99)
        if stage1:
            return {"outcome": "PASS", "reason_codes": []}
        return {"outcome": "FAIL", "reason_codes": ["FORMULA_BP_STAGE1_NOT_MET"]}
    stage2 = (160 <= sys <= 179) or (100 <= dia <= 109)
    if stage2:
        return {"outcome": "PASS", "reason_codes": []}
    return {"outcome": "FAIL", "reason_codes": ["FORMULA_BP_STAGE2_NOT_MET"]}
