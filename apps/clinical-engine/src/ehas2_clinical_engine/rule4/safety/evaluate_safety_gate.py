from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any

from ..safety_fingerprint_v1 import rule4_safety_fingerprint_v1_hash
from .age_validator import AgeResolution, resolve_verified_age
from .structured_critical import evaluate_structured_critical_inputs

BP_CRISIS_SYSTOLIC_MIN = 180
BP_CRISIS_DIASTOLIC_MIN = 110
BP_CANONICAL_UNIT = "mmHg"

CRISIS_COMPARABLE = frozenset({"VERIFIED_CURRENT_READING", "REPEATED_CONFIRMED_READING"})

D13_HS_SAFETY_NOTICE_HI = (
    "एक वर्ष से कम आयु के बच्चों के लिए यह सिस्टम औषधि, फॉर्मूला, potency, dose या "
    "clinical prescription summary तैयार नहीं करता। बच्चे का मूल्यांकन योग्य बाल-चिकित्सक द्वारा कराया जाए।"
)


@dataclass
class BpCrisisEvaluation:
    crisis_detected: bool
    reason_codes: list[str] = field(default_factory=list)
    limitation_codes: list[str] = field(default_factory=list)


@dataclass
class SafetyGateResult:
    safety_gate_status: str
    safety_status: str
    prescription_status: str
    hold_status: str
    patient_wide_hold: bool
    urgent_escalation_required: bool
    analysis_status: str | None
    clinical_prescription_summary: str
    d13_hard_stop_active: bool
    safety_notice_key: str | None
    age_resolution: AgeResolution
    bp_crisis: BpCrisisEvaluation
    reason_codes: list[str]
    limitation_codes: list[str]
    safety_clear_for_future_cascade: bool
    deterministic_safety_fingerprint: str


def _normalize_readings(readings: list[dict[str, Any]]) -> list[dict[str, Any]]:
    out = []
    for r in readings:
        out.append(
            {
                "systolic": r.get("systolic"),
                "diastolic": r.get("diastolic"),
                "unit": r.get("unit"),
                "evidence_status": r.get("evidence_status") or r.get("evidenceStatus"),
            }
        )
    return out


def _normalize_unit(unit: str | None) -> str | None:
    if unit is None:
        return None
    u = str(unit).strip()
    if not u:
        return None
    if u.lower() == "mmhg":
        return BP_CANONICAL_UNIT
    return u


def evaluate_bp_crisis(readings: list[dict[str, Any]]) -> BpCrisisEvaluation:
    limitation: list[str] = []
    crisis = False
    for reading in readings:
        ev = reading.get("evidence_status")
        if ev not in CRISIS_COMPARABLE:
            if ev in {"MISSING", "INVALID", "CONTRADICTORY"}:
                limitation.append("BP_EVIDENCE_NOT_CRISIS_COMPARABLE")
            continue
        unit = _normalize_unit(reading.get("unit"))
        if unit != BP_CANONICAL_UNIT:
            limitation.append("BP_EVIDENCE_NOT_CRISIS_COMPARABLE")
            continue
        sys_val = reading.get("systolic")
        dia_val = reading.get("diastolic")
        sys_ok = isinstance(sys_val, (int, float)) and sys_val > 0
        dia_ok = isinstance(dia_val, (int, float)) and dia_val > 0
        if not sys_ok and not dia_ok:
            limitation.append("BP_EVIDENCE_NOT_CRISIS_COMPARABLE")
            continue
        if sys_ok and sys_val >= BP_CRISIS_SYSTOLIC_MIN:
            crisis = True
        if dia_ok and dia_val >= BP_CRISIS_DIASTOLIC_MIN:
            crisis = True
    reason = ["BP_CRISIS_PATIENT_WIDE"] if crisis else []
    return BpCrisisEvaluation(crisis, reason, sorted(set(limitation)))


def aggregate_patient_wide_holds(
    *,
    bp_crisis: BpCrisisEvaluation,
    age_resolution: AgeResolution,
    critical_evaluation: dict,
    explicit_prescription_hold: bool,
    explicit_contraindication_hold: bool,
    explicit_crisis_hold: bool,
    raw_lab_keyword_present: bool,
    fingerprint_fn,
) -> SafetyGateResult:
    reason_codes = ["RULE4_SAFETY_GATE_EVALUATED"]
    limitation_codes = ["PHASE2_NO_POTENCY_CASCADE"]

    if raw_lab_keyword_present:
        reason_codes.extend(["RAW_LAB_KEYWORD_NOT_EXECUTABLE"])
        limitation_codes.append("NON_BP_CRITICAL_CATALOG_NOT_EXECUTABLE")

    crisis = bp_crisis.crisis_detected or explicit_crisis_hold is True
    reason_codes.extend(bp_crisis.reason_codes)
    limitation_codes.extend(bp_crisis.limitation_codes)
    limitation_codes.extend(age_resolution.limitation_codes)
    reason_codes.extend(critical_evaluation.get("reason_codes") or [])
    limitation_codes.extend(critical_evaluation.get("limitation_codes") or [])

    structured_critical = critical_evaluation.get("escalation_eligible") is True
    critical_input_blocked = critical_evaluation.get("has_unknown_codes") or critical_evaluation.get(
        "has_invalid_entries"
    )

    age_fail = age_resolution.verification_status in {
        "MISSING",
        "INVALID",
        "CONTRADICTORY",
        "UNRESOLVED",
    }
    if age_fail:
        reason_codes.extend(age_resolution.reason_codes)

    d13_active = age_resolution.verification_status == "VERIFIED" and age_resolution.is_under_one_year

    safety_gate_status = "SAFETY_CLEAR_FOR_FUTURE_CASCADE"
    safety_status = "NORMAL"
    prescription_status = "OPEN"
    hold_status = "NONE"
    patient_wide_hold = False
    urgent = False
    analysis_status: str | None = "NOT_EVALUATED"
    clinical_summary = "NOT_APPLICABLE"
    d13_hard = False
    notice_key: str | None = None

    if crisis or structured_critical:
        safety_status = "ACUTE_RED_FLAG"
        safety_gate_status = "ACUTE_RED_FLAG"
        patient_wide_hold = True
        hold_status = "PRESCRIPTION_HOLD"
        prescription_status = "PRESCRIPTION_HOLD" if prescription_status != "BLOCKED" else "BLOCKED"
        urgent = True
        reason_codes.append("PRESCRIPTION_HOLD")

    if explicit_prescription_hold:
        patient_wide_hold = True
        hold_status = "PRESCRIPTION_HOLD"
        if prescription_status != "BLOCKED":
            prescription_status = "PRESCRIPTION_HOLD"
        if safety_gate_status == "SAFETY_CLEAR_FOR_FUTURE_CASCADE":
            safety_gate_status = "PRESCRIPTION_HOLD"
        reason_codes.extend(["EXPLICIT_PRESCRIPTION_HOLD", "PRESCRIPTION_HOLD"])

    if explicit_contraindication_hold:
        patient_wide_hold = True
        hold_status = "PRESCRIPTION_HOLD"
        if prescription_status != "BLOCKED":
            prescription_status = "PRESCRIPTION_HOLD"
        reason_codes.extend(["PATIENT_WIDE_CONTRAINDICATION_HOLD", "PRESCRIPTION_HOLD"])
        if safety_gate_status == "SAFETY_CLEAR_FOR_FUTURE_CASCADE":
            safety_gate_status = "PRESCRIPTION_HOLD"

    if d13_active:
        d13_hard = True
        analysis_status = "PEDIATRIC_UNDER_ONE_NOT_SUPPORTED"
        prescription_status = "BLOCKED"
        clinical_summary = "NOT_GENERATED"
        notice_key = "D13_HS_UNDER_ONE"
        safety_gate_status = "D13_HS_BLOCKED"
        reason_codes.append("D13_HS_UNDER_ONE_HARD_STOP")
        limitation_codes.append("PEDIATRIC_UNDER_ONE_HARD_STOP")
        if crisis or structured_critical:
            patient_wide_hold = True
            hold_status = "PRESCRIPTION_HOLD"
            urgent = True
            reason_codes.append("PRESCRIPTION_HOLD")

    if (age_fail or critical_input_blocked) and not patient_wide_hold and not d13_hard:
        safety_gate_status = "UNRESOLVED"

    if (
        raw_lab_keyword_present
        and not patient_wide_hold
        and not d13_hard
        and safety_gate_status == "SAFETY_CLEAR_FOR_FUTURE_CASCADE"
    ):
        safety_gate_status = "UNRESOLVED"

    safety_clear = (
        not patient_wide_hold
        and not d13_hard
        and not age_fail
        and not crisis
        and not structured_critical
        and not critical_input_blocked
        and not explicit_prescription_hold
        and not explicit_contraindication_hold
        and not raw_lab_keyword_present
    )
    if safety_clear:
        reason_codes.append("RULE4_SAFETY_GATE_CLEAR_FOR_FUTURE_CASCADE")

    unique_reason = sorted(set(reason_codes))
    unique_limitation = sorted(set(limitation_codes))
    safety_fp = rule4_safety_fingerprint_v1_hash(
        safety_gate_status=safety_gate_status,
        safety_status=safety_status,
        prescription_status=prescription_status,
        hold_status=hold_status,
        patient_wide_hold=patient_wide_hold,
        urgent_escalation_required=urgent,
        analysis_status=analysis_status,
        d13_hard_stop_active=d13_hard,
        age_verification=age_resolution.verification_status,
        pediatric_band=age_resolution.pediatric_band,
        bp_crisis=crisis,
        reason_codes=unique_reason,
        limitation_codes=unique_limitation,
    )
    return SafetyGateResult(
        safety_gate_status=safety_gate_status,
        safety_status=safety_status,
        prescription_status=prescription_status,
        hold_status=hold_status,
        patient_wide_hold=patient_wide_hold,
        urgent_escalation_required=urgent,
        analysis_status=analysis_status,
        clinical_prescription_summary=clinical_summary,
        d13_hard_stop_active=d13_hard,
        safety_notice_key=notice_key,
        age_resolution=age_resolution,
        bp_crisis=bp_crisis,
        reason_codes=unique_reason,
        limitation_codes=unique_limitation,
        safety_clear_for_future_cascade=safety_clear,
        deterministic_safety_fingerprint=safety_fp,
    )


def evaluate_safety_gate(input_contract: dict[str, Any], *, fingerprint_fn) -> SafetyGateResult:
    readings = _normalize_readings(input_contract.get("bp_readings") or [])
    bp = evaluate_bp_crisis(readings)
    age = resolve_verified_age(input_contract.get("verified_age") or {})
    critical = evaluate_structured_critical_inputs(
        list(input_contract.get("structured_critical_findings") or []),
        list(input_contract.get("structured_frozen_red_flags") or []),
    )
    flags = input_contract.get("patient_wide_safety") or {}
    return aggregate_patient_wide_holds(
        bp_crisis=bp,
        age_resolution=age,
        critical_evaluation=critical,
        explicit_prescription_hold=flags.get("prescription_hold") is True,
        explicit_contraindication_hold=flags.get("contraindication_hold") is True,
        explicit_crisis_hold=flags.get("crisis_hold") is True,
        raw_lab_keyword_present=input_contract.get("raw_lab_keyword_present") is True,
        fingerprint_fn=fingerprint_fn,
    )
