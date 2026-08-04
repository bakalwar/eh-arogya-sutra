from __future__ import annotations

from typing import Any


def _gate(gate_id: str, outcome: str, reason_codes: list[str] | None = None) -> dict[str, Any]:
    codes = sorted(set(reason_codes or []))
    return {"gate_id": gate_id, "outcome": outcome, "reason_codes": codes}


def build_issuance_gate_ledger(
    input_contract: dict[str, Any],
    context: dict[str, Any],
    *,
    authority_ok: bool,
    authority_reasons: list[str],
    idempotency_blocked: bool,
    idempotency_reasons: list[str],
    modification_valid: bool,
    modification_reasons: list[str],
    auth_eval: dict[str, Any],
) -> list[dict[str, Any]]:
    upstream = context.get("upstream") or {}
    auth_mismatch = auth_eval.get("mismatch_codes") or []
    is_production = input_contract.get("label") == "PRODUCTION"
    action = input_contract.get("doctor_action")

    missing_expected = (
        ["EXPECTED_DRAFT_AUTHENTICITY_MISSING"]
        if auth_eval.get("expected_missing")
        else ["EXPECTED_AUTHENTICITY_FIELD_MISSING"]
        if auth_eval.get("expected_field_missing")
        else []
    )

    reval_status = upstream.get("engine_revalidation_status") or "NOT_REQUIRED"
    reval_outcome = "PASS"
    reval_reasons: list[str] = []
    if action in ("MODIFY", "EXCLUDE_UNRESOLVED_SLOT"):
        reval_outcome = "FAIL"
        reval_reasons.append("MODIFY_REVALIDATION_REQUIRED")
        if action == "EXCLUDE_UNRESOLVED_SLOT":
            reval_reasons.append("EXCLUDE_SLOT_REVALIDATION_REQUIRED")
    elif reval_status == "REQUIRED_PENDING":
        reval_outcome = "FAIL"
        reval_reasons.append("ENGINE_REVALIDATION_PENDING")
    elif reval_status == "FAILED":
        reval_outcome = "FAIL"
        reval_reasons.append("ENGINE_REVALIDATION_FAILED")
    elif reval_status not in ("PASSED", "NOT_REQUIRED"):
        reval_outcome = "MISSING_INPUT"

    final_approval = "NOT_EVALUATED"
    final_reasons: list[str] = []
    if auth_eval.get("approval_path_requires_expected") and auth_eval.get("expected_missing"):
        final_approval = "MISSING_INPUT"
        final_reasons.append("EXPECTED_DRAFT_AUTHENTICITY_MISSING")
    elif auth_eval.get("approval_path_requires_expected") and auth_eval.get("expected_field_missing"):
        final_approval = "MISSING_INPUT"
        final_reasons.append("EXPECTED_AUTHENTICITY_FIELD_MISSING")
    elif (
        action == "APPROVE"
        and authority_ok
        and not auth_eval.get("binding_mismatch_codes")
        and not auth_mismatch
    ):
        final_approval = "PASS"
    elif action == "APPROVE":
        final_approval = "FAIL"
        final_reasons.extend(
            sorted(
                set(
                    [
                        *authority_reasons,
                        *(auth_eval.get("binding_mismatch_codes") or []),
                        *auth_mismatch,
                    ]
                )
            )
        )
        if not final_reasons:
            final_reasons.append("MISSING_DOCTOR_APPROVAL")
    elif action not in ("REJECT", "REQUEST_REASSESSMENT"):
        final_approval = "FAIL"
        final_reasons.append("MISSING_DOCTOR_APPROVAL")

    crisis = (
        _gate("Q06C_CRISIS", "FAIL", ["NON_OVERRIDABLE_SAFETY_BLOCK"])
        if upstream.get("urgent_escalation_required")
        else _gate("Q06C_CRISIS", "PASS")
    )
    d13 = (
        _gate("D13_HS", "FAIL", ["NON_OVERRIDABLE_SAFETY_BLOCK"])
        if upstream.get("d13_hard_stop_active")
        else _gate("D13_HS", "PASS")
    )
    hold = (
        _gate("Q15_PATIENT_HOLD", "FAIL", ["NON_OVERRIDABLE_SAFETY_BLOCK"])
        if upstream.get("patient_wide_hold")
        else _gate("Q15_PATIENT_HOLD", "PASS")
    )
    rule3 = (
        _gate("RULE3_ISSUE_FLAG", "FAIL", ["ISSUANCE_GATE_MANDATORY_FAIL"])
        if upstream.get("rule3_prescription_issue_allowed") is False
        else _gate("RULE3_ISSUE_FLAG", "PASS")
    )
    d13d = (
        _gate("D13_RESTRICT_D13D", "FAIL", ["ISSUANCE_GATE_MANDATORY_FAIL"])
        if upstream.get("d13_restrict_justification_missing")
        else _gate("D13_RESTRICT_D13D", "PASS")
    )
    if upstream.get("pediatric_prohibit_active"):
        pediatric = _gate("PEDIATRIC_OVERLAY_COMPLETE", "FAIL", ["PEDIATRIC_PROHIBIT_BLOCKS_ISSUANCE"])
    elif upstream.get("phase8_auth_failed"):
        pediatric = _gate("PEDIATRIC_OVERLAY_COMPLETE", "FAIL", ["PHASE8_PHASE9_AUTH_FAILURE"])
    else:
        pediatric = _gate("PEDIATRIC_OVERLAY_COMPLETE", "PASS")

    if auth_eval.get("approval_path_requires_expected") and auth_eval.get("expected_missing"):
        evidence = _gate("EVIDENCE_CURRENT", "MISSING_INPUT", ["EXPECTED_DRAFT_AUTHENTICITY_MISSING"])
    elif auth_eval.get("approval_path_requires_expected") and auth_eval.get("expected_field_missing"):
        evidence = _gate("EVIDENCE_CURRENT", "MISSING_INPUT", ["EXPECTED_AUTHENTICITY_FIELD_MISSING"])
    elif auth_mismatch:
        evidence = _gate("EVIDENCE_CURRENT", "FAIL", auth_mismatch)
    else:
        evidence = _gate("EVIDENCE_CURRENT", "PASS")

    if auth_eval.get("approval_path_requires_expected") and auth_eval.get("expected_missing"):
        summary = _gate("SUMMARY_FP_MATCH", "MISSING_INPUT", ["EXPECTED_DRAFT_AUTHENTICITY_MISSING"])
    elif auth_eval.get("approval_path_requires_expected") and auth_eval.get("expected_field_missing"):
        summary = _gate("SUMMARY_FP_MATCH", "MISSING_INPUT", ["EXPECTED_AUTHENTICITY_FIELD_MISSING"])
    elif auth_mismatch:
        summary = _gate("SUMMARY_FP_MATCH", "FAIL", auth_mismatch)
    else:
        summary = _gate("SUMMARY_FP_MATCH", "PASS")

    isolation = (
        _gate("FORMULA_ISOLATION", "FAIL", ["FORMULA_ISOLATION_FAILURE"])
        if upstream.get("formula_isolation_failed")
        else _gate("FORMULA_ISOLATION", "PASS")
    )

    if auth_eval.get("approval_path_requires_expected") and auth_eval.get("expected_missing"):
        registry = _gate("REGISTRY_RULESET", "MISSING_INPUT", ["EXPECTED_DRAFT_AUTHENTICITY_MISSING"])
    elif auth_eval.get("approval_path_requires_expected") and auth_eval.get("expected_field_missing"):
        registry = _gate("REGISTRY_RULESET", "MISSING_INPUT", ["EXPECTED_AUTHENTICITY_FIELD_MISSING"])
    elif "RULESET_REGISTRY_MISMATCH" in auth_mismatch or upstream.get("ruleset_registry_mismatch"):
        registry = _gate("REGISTRY_RULESET", "FAIL", ["RULESET_REGISTRY_MISMATCH"])
    else:
        registry = _gate("REGISTRY_RULESET", "PASS")

    tenant_reasons = [*authority_reasons, *(auth_eval.get("binding_mismatch_codes") or [])]
    tenant = (
        _gate("TENANT_AUTH", "FAIL", tenant_reasons)
        if not authority_ok or auth_eval.get("binding_mismatch_codes")
        else _gate("TENANT_AUTH", "PASS")
    )

    legacy = (
        _gate("LEGACY_QUARANTINE", "FAIL", ["LEGACY_AUTHORITY_QUARANTINE"])
        if upstream.get("legacy_authority_attempt") or upstream.get("registry_quarantine")
        else _gate("LEGACY_QUARANTINE", "PASS")
    )

    if is_production:
        registration = _gate(
            "PROFESSIONAL_REGISTRATION",
            "NOT_CONNECTED",
            [
                "PROFESSIONAL_REGISTRATION_VERIFICATION_NOT_CONNECTED",
                "PRODUCTION_ISSUANCE_NOT_CONNECTED",
            ],
        )
    elif (input_contract.get("reviewer_authority") or {}).get("professional_registration_verified") is True:
        registration = _gate("PROFESSIONAL_REGISTRATION", "PASS")
    else:
        registration = _gate(
            "PROFESSIONAL_REGISTRATION",
            "NOT_CONNECTED",
            ["PROFESSIONAL_REGISTRATION_VERIFICATION_NOT_CONNECTED"],
        )

    q18_reasons: list[str] = []
    q18_outcome = "PASS"
    if crisis["outcome"] == "FAIL" or d13["outcome"] == "FAIL" or hold["outcome"] == "FAIL":
        q18_outcome = "FAIL"
        q18_reasons.append("NON_OVERRIDABLE_SAFETY_BLOCK")
    if upstream.get("unresolved_medicated_slot") and action not in (
        "EXCLUDE_UNRESOLVED_SLOT",
        "MODIFY",
    ):
        q18_outcome = "FAIL"
        q18_reasons.append("UNRESOLVED_MEDICATED_SLOT_BLOCKS_ISSUANCE")
    if idempotency_blocked:
        q18_outcome = "BLOCKED"
        q18_reasons.extend(idempotency_reasons)
    if not modification_valid and action in ("MODIFY", "EXCLUDE_UNRESOLVED_SLOT"):
        q18_outcome = "FAIL"
        q18_reasons.extend(modification_reasons)
    if auth_eval.get("superseded"):
        q18_outcome = "FAIL"
        q18_reasons.append("APPROVAL_SUPERSEDED")
    if missing_expected:
        q18_outcome = "FAIL"
        q18_reasons.extend(missing_expected)

    q18 = _gate("Q18_E_HOLDS", q18_outcome, q18_reasons)

    strict = "PASS"
    strict_reasons: list[str] = []
    if is_production:
        strict = "NOT_EVALUATED"
        strict_reasons.append("PRODUCTION_DOCTOR_REVIEW_NOT_EVALUATED")
    if idempotency_blocked:
        strict = "BLOCKED"
        strict_reasons.extend(idempotency_reasons)

    return [
        _gate("FINAL_DOCTOR_APPROVAL", final_approval, final_reasons),
        _gate("GATE_REVALIDATION", reval_outcome, reval_reasons),
        q18,
        crisis,
        d13,
        hold,
        rule3,
        _gate("RULE4_STRICT_FINAL", strict, strict_reasons),
        d13d,
        pediatric,
        evidence,
        summary,
        isolation,
        registry,
        tenant,
        legacy,
        registration,
    ]


def mandatory_gate_blocks_eligibility(results: list[dict[str, Any]]) -> bool:
    return any(g["outcome"] != "PASS" for g in results)
