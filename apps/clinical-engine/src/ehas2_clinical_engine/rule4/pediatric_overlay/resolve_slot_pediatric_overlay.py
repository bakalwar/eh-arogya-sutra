from __future__ import annotations

import hashlib
import json

from ..safety.age_validator import resolve_verified_age
from ..selection.selection_fingerprint_v1 import fingerprint_from_selection_output
from .overlay_matrix import overlay_cell_for_band_and_dilution, pediatric_matrix_authority_for_dilution
from .pediatric_overlay_fingerprint_v1 import slot_pediatric_overlay_fingerprint_v1_hash

PHASE9_LIMITATION = "SHADOW_PEDIATRIC_DRAFT_OVERLAY_ONLY"


def _to_phase2_verified_age(ctx: dict | None) -> dict:
    if not ctx:
        return {"verification_status": "MISSING"}
    return {
        "age_years": ctx.get("age_years", ctx.get("ageYears")),
        "verification_status": ctx.get("verification_status")
        or ctx.get("verificationStatus")
        or "MISSING",
        "verified_date_of_birth": ctx.get("verified_date_of_birth") or ctx.get("verifiedDateOfBirth"),
        "consultation_assessment_date": ctx.get("consultation_assessment_date")
        or ctx.get("consultationAssessmentDate"),
        "age_source": ctx.get("age_source") or ctx.get("ageSource"),
        "upstream_verified_pediatric_band": ctx.get("upstream_verified_pediatric_band")
        or ctx.get("upstreamVerifiedPediatricBand"),
        "pediatric_band_verification_status": ctx.get("pediatric_band_verification_status")
        or ctx.get("pediatricBandVerificationStatus"),
    }


def _age_provenance_digest(context: dict) -> str:
    va = context.get("verified_age") or {}
    payload = {
        "consultation_assessment_date": va.get("consultation_assessment_date")
        or va.get("consultationAssessmentDate"),
        "verified_date_of_birth": va.get("verified_date_of_birth") or va.get("verifiedDateOfBirth"),
        "verification_status": va.get("verification_status") or va.get("verificationStatus"),
        "upstream_band": va.get("upstream_verified_pediatric_band")
        or va.get("upstreamVerifiedPediatricBand"),
    }
    return hashlib.sha256(json.dumps(payload, separators=(",", ":")).encode("utf-8")).hexdigest().upper()


def _all_gates_pass(rows: list[dict] | None) -> bool:
    if not rows:
        return False
    return all(r.get("outcome") == "PASS" for r in rows)


def _ledger_rows(ledger: dict | None, *keys: str) -> list[dict] | None:
    if not ledger:
        return None
    for key in keys:
        val = ledger.get(key)
        if val is not None:
            return val
    return None


def _restrict_gates_pass(
    band: str, dilution: str, ledger: dict | None
) -> tuple[bool, str, str | None]:
    lgr = ledger or {}
    if dilution == "D2" and band == "P13_C":
        if not _all_gates_pass(
            _ledger_rows(lgr, "q8_d_gates", "q8DGates", "q8_d_gates")
        ):
            return False, "FAIL", "PEDIATRIC_Q8_D_GATE_LEDGER_INCOMPLETE"
        return True, "PASS", None
    if dilution == "D1" and band == "P13_D":
        if not _all_gates_pass(
            _ledger_rows(lgr, "q8_cd_gates", "q8CDGates", "q8_c_d_gates")
        ):
            return False, "FAIL", "PEDIATRIC_Q8_CD_GATE_LEDGER_INCOMPLETE"
        return True, "PASS", None
    if dilution in {"D3", "D10"}:
        d13_block = lgr.get("d13_d_justification") or lgr.get("d13DJustification") or {}
        d13 = d13_block.get("status", "FAIL")
        if d13 != "PASS":
            return False, "FAIL", "PEDIATRIC_D13_D_JUSTIFICATION_REQUIRED"
        if dilution == "D10" and not _all_gates_pass(_ledger_rows(lgr, "d10f_gates", "d10fGates")):
            return False, "FAIL", "PEDIATRIC_D10F_GATE_LEDGER_INCOMPLETE"
        return True, "PASS", None
    if dilution == "D30" and band == "P13_D":
        d13_block = lgr.get("d13_d_justification") or lgr.get("d13DJustification") or {}
        d13 = d13_block.get("status", "FAIL")
        if d13 != "PASS" or not _all_gates_pass(_ledger_rows(lgr, "d30f_gates", "d30fGates")):
            return False, "FAIL", "PEDIATRIC_D30F_GATE_LEDGER_INCOMPLETE"
        return True, "PASS", None
    return False, "FAIL", "PEDIATRIC_OVERLAY_RESTRICT_UNCONFIGURED"


def resolve_slot_pediatric_overlay(
    record: dict | None,
    slot_id: str,
    label: str,
    context: dict,
    meta: dict,
) -> dict:
    digest = _age_provenance_digest(context)
    safety = context.get("safety_gate") or {}
    d13_hs = bool(safety.get("d13_hard_stop_active") or safety.get("d13HardStopActive"))
    patient_hold = bool(safety.get("patient_wide_hold") or safety.get("patientWideHold"))

    verified_age = context.get("verified_age")
    age_res = resolve_verified_age(_to_phase2_verified_age(verified_age)) if verified_age else None
    band = (
        safety.get("pediatric_band")
        or safety.get("pediatricBand")
        or (age_res.pediatric_band if age_res else None)
    )
    age_status = (
        age_res.verification_status
        if age_res
        else (verified_age or {}).get("verification_status")
        or (verified_age or {}).get("verificationStatus")
        or "MISSING"
    )

    def finish(partial: dict) -> dict:
        fp = slot_pediatric_overlay_fingerprint_v1_hash(
            {**partial, "deterministic_pediatric_overlay_fingerprint": ""},
            {
                "ruleset_version": meta["ruleset_version"],
                "registry_version": meta["registry_version"],
                "d13_hs_active": d13_hs,
                "patient_wide_hold": patient_hold,
                "urgent_escalation_required": bool(
                    safety.get("urgent_escalation_required") or safety.get("urgentEscalationRequired")
                ),
                "reason_codes": partial["reason_codes"],
                "limitation_codes": partial["limitation_codes"],
            },
        )
        return {**partial, "deterministic_pediatric_overlay_fingerprint": fp}

    base_slot = {
        "formula_slot_id": slot_id,
        "formula_target_id": (record or {}).get("formula_target_id"),
        "verified_age_band": band,
        "age_verification_status": age_status,
        "age_provenance_digest": digest,
        "phase8_selection_fingerprint": None,
        "base_selected_cascade": None,
        "base_selected_dilution": None,
        "pediatric_matrix_authority": "NOT_APPLICABLE",
        "overlay_gate_results": [],
        "d13_d_justification_status": "NOT_APPLICABLE",
        "final_draft_cascade": None,
        "final_draft_dilution": None,
        "final_doctor_approval_required": True,
        "prescription_issue_allowed": False,
        "limitation_codes": [PHASE9_LIMITATION],
    }

    if label == "PRODUCTION":
        return finish(
            {
                **base_slot,
                "pediatric_overlay_status": "NOT_EVALUATED",
                "reason_codes": ["PRODUCTION_PEDIATRIC_OVERLAY_NOT_EVALUATED"],
            }
        )

    if d13_hs or band in {"P13_A", "P13_B"}:
        return finish(
            {
                **base_slot,
                "pediatric_overlay_status": "BLOCKED_D13_HS",
                "reason_codes": ["PEDIATRIC_D13_HS_BLOCKS_OVERLAY"],
            }
        )

    if patient_hold:
        return finish(
            {
                **base_slot,
                "pediatric_overlay_status": "BLOCKED_BY_SAFETY",
                "reason_codes": ["BLOCKED_BY_PATIENT_WIDE_SAFETY_GATE"],
            }
        )

    if age_status in {"MISSING", "INVALID", "CONTRADICTORY", "UNRESOLVED"} or band is None:
        reason_codes = (
            list(age_res.reason_codes)
            if age_res and age_res.reason_codes
            else ["VERIFIED_AGE_MISSING"]
        )
        return finish(
            {
                **base_slot,
                "verified_age_band": None,
                "pediatric_overlay_status": "AGE_UNRESOLVED",
                "reason_codes": reason_codes,
            }
        )

    sel = context.get("selection_resolution")
    if not sel:
        return finish(
            {
                **base_slot,
                "pediatric_overlay_status": "PHASE8_AUTH_FAILED",
                "reason_codes": ["PHASE8_SELECTION_RESOLUTION_MISSING"],
            }
        )

    phase8_slot = next(
        (s for s in sel.get("slot_resolutions") or [] if s["formula_slot_id"] == slot_id),
        None,
    )
    if not phase8_slot or not record:
        return finish(
            {
                **base_slot,
                "formula_target_id": (record or {}).get("formula_target_id")
                or (phase8_slot or {}).get("formula_target_id"),
                "pediatric_overlay_status": "PHASE8_AUTH_FAILED",
                "reason_codes": ["PHASE8_SELECTION_SLOT_MISSING"],
            }
        )

    expected_fp = fingerprint_from_selection_output(
        sel, context.get("upstream_eligibility_fingerprint")
    )
    record_fp = record.get("phase8_selection_fingerprint") or record.get(
        "phase8SelectionFingerprint"
    )
    if record_fp != expected_fp:
        return finish(
            {
                **base_slot,
                "formula_target_id": record["formula_target_id"],
                "phase8_selection_fingerprint": expected_fp,
                "base_selected_cascade": phase8_slot.get("selected_cascade"),
                "base_selected_dilution": phase8_slot.get("selected_dilution"),
                "pediatric_overlay_status": "PHASE8_AUTH_FAILED",
                "reason_codes": ["PHASE8_SELECTION_FINGERPRINT_MISMATCH"],
            }
        )

    if record.get("formula_slot_id") != slot_id or record.get("formula_target_id") != phase8_slot.get(
        "formula_target_id"
    ):
        return finish(
            {
                **base_slot,
                "formula_target_id": phase8_slot.get("formula_target_id"),
                "phase8_selection_fingerprint": expected_fp,
                "base_selected_cascade": phase8_slot.get("selected_cascade"),
                "base_selected_dilution": phase8_slot.get("selected_dilution"),
                "pediatric_overlay_status": "PHASE8_AUTH_FAILED",
                "reason_codes": ["PEDIATRIC_OVERLAY_SLOT_TARGET_MISMATCH"],
            }
        )

    if phase8_slot.get("selection_status") != "RESOLVED_DRAFT_CANDIDATE" or not phase8_slot.get(
        "selected_dilution"
    ):
        return finish(
            {
                **base_slot,
                "formula_target_id": phase8_slot.get("formula_target_id"),
                "phase8_selection_fingerprint": expected_fp,
                "base_selected_cascade": phase8_slot.get("selected_cascade"),
                "base_selected_dilution": phase8_slot.get("selected_dilution"),
                "pediatric_overlay_status": "PHASE8_AUTH_FAILED",
                "reason_codes": ["PHASE8_SELECTION_NOT_RESOLVED_DRAFT"],
            }
        )

    dilution = phase8_slot["selected_dilution"]
    authority = pediatric_matrix_authority_for_dilution(dilution)
    auth_base = {
        **base_slot,
        "formula_target_id": phase8_slot.get("formula_target_id"),
        "verified_age_band": band,
        "phase8_selection_fingerprint": expected_fp,
        "base_selected_cascade": phase8_slot.get("selected_cascade"),
        "base_selected_dilution": dilution,
        "pediatric_matrix_authority": authority,
    }

    if band == "P13_E":
        return finish(
            {
                **auth_base,
                "pediatric_matrix_authority": "NOT_APPLICABLE",
                "pediatric_overlay_status": "NOT_APPLICABLE",
                "overlay_gate_results": [
                    {"dilution": dilution, "matrix_cell": "NOT_APPLICABLE", "outcome": "RETAINED"}
                ],
                "d13_d_justification_status": "NOT_REQUIRED",
                "final_draft_cascade": phase8_slot.get("selected_cascade"),
                "final_draft_dilution": dilution,
                "reason_codes": ["PEDIATRIC_OVERLAY_NOT_APPLICABLE_P13_E"],
            }
        )

    cell = overlay_cell_for_band_and_dilution(band, dilution)

    if cell == "PROHIBIT":
        return finish(
            {
                **auth_base,
                "pediatric_overlay_status": "OVERLAY_BLOCKED",
                "overlay_gate_results": [
                    {"dilution": dilution, "matrix_cell": cell, "outcome": "BLOCKED"}
                ],
                "d13_d_justification_status": "NOT_REQUIRED",
                "reason_codes": ["PEDIATRIC_OVERLAY_PROHIBIT"],
            }
        )

    if cell == "ALLOW":
        return finish(
            {
                **auth_base,
                "pediatric_overlay_status": "OVERLAY_APPLIED",
                "overlay_gate_results": [
                    {"dilution": dilution, "matrix_cell": cell, "outcome": "RETAINED"}
                ],
                "d13_d_justification_status": "NOT_REQUIRED",
                "final_draft_cascade": phase8_slot.get("selected_cascade"),
                "final_draft_dilution": dilution,
                "reason_codes": ["PEDIATRIC_OVERLAY_ALLOW"],
            }
        )

    if cell == "RESTRICT":
        ledger = record.get("restrict_gate_ledger") or record.get("restrictGateLedger")
        gate = _restrict_gates_pass(band, dilution, ledger)
        if not gate[0]:
            return finish(
                {
                    **auth_base,
                    "pediatric_overlay_status": "OVERLAY_UNRESOLVED",
                    "overlay_gate_results": [
                        {"dilution": dilution, "matrix_cell": cell, "outcome": "BLOCKED"}
                    ],
                    "d13_d_justification_status": gate[1],
                    "reason_codes": [gate[2]] if gate[2] else ["PEDIATRIC_OVERLAY_RESTRICT_FAILED"],
                }
            )
        return finish(
            {
                **auth_base,
                "pediatric_overlay_status": "OVERLAY_APPLIED",
                "overlay_gate_results": [
                    {"dilution": dilution, "matrix_cell": cell, "outcome": "RETAINED"}
                ],
                "d13_d_justification_status": gate[1],
                "final_draft_cascade": phase8_slot.get("selected_cascade"),
                "final_draft_dilution": dilution,
                "reason_codes": ["PEDIATRIC_OVERLAY_RESTRICT_SATISFIED"],
            }
        )

    return finish(
        {
            **auth_base,
            "pediatric_overlay_status": "OVERLAY_UNRESOLVED",
            "reason_codes": ["PEDIATRIC_OVERLAY_CELL_NOT_APPLICABLE"],
        }
    )
