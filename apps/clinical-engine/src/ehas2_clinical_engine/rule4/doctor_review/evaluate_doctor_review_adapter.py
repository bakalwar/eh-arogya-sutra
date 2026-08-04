from __future__ import annotations

import hashlib
from typing import Any

from ..canonical_json import canonical_stable_dumps
from ..registry_paths import RULE4_CONTRACT_VERSION_PHASE10_DOCTOR_REVIEW_ISSUANCE
from .gate_ledger import build_issuance_gate_ledger, mandatory_gate_blocks_eligibility
from .expected_authenticity_authority import evaluate_expected_authenticity_authority
from .build_shadow_audit_events import build_shadow_audit_events
from .review_code_validation import validate_doctor_review_output_codes

RULE4_DOCTOR_REVIEW_FINGERPRINT_V1 = "rule4-doctor-review-fingerprint-v1"


def _gate_payload(g: dict[str, Any]) -> dict[str, Any]:
    return {
        "gate_id": g["gate_id"],
        "outcome": g["outcome"],
        "reason_codes": sorted(g.get("reason_codes") or []),
    }


def rule4_doctor_review_fingerprint_v1_payload(
    *,
    ruleset_version: str,
    registry_version: str,
    doctor_action: str,
    consultation_id: str,
    draft_version: str,
    doctor_id: str,
    output: dict[str, Any],
) -> str:
    gates = sorted(
        [_gate_payload(g) for g in output.get("issuance_gate_results") or []],
        key=lambda x: x["gate_id"],
    )
    return canonical_stable_dumps(
        {
            "consultation_id": consultation_id,
            "doctor_action": doctor_action,
            "doctor_id": doctor_id,
            "doctor_review_status": output["doctor_review_status"],
            "draft_version": draft_version,
            "engine_revalidation_status": output["engine_revalidation_status"],
            "fingerprint_version": RULE4_DOCTOR_REVIEW_FINGERPRINT_V1,
            "idempotency_replay": output.get("idempotency_replay"),
            "issuance_eligibility_status": output["issuance_eligibility_status"],
            "issuance_gate_results": gates,
            "limitation_codes": sorted(set(output.get("limitation_codes") or [])),
            "phase3_review_state": output["phase3_review_state"],
            "reason_codes": sorted(set(output.get("reason_codes") or [])),
            "registry_version": registry_version,
            "ruleset_version": ruleset_version,
        }
    )


def rule4_doctor_review_fingerprint_v1_hash(**kwargs: Any) -> str:
    payload = rule4_doctor_review_fingerprint_v1_payload(**kwargs)
    return hashlib.sha256(payload.encode("utf-8")).hexdigest().upper()


def fingerprint_from_doctor_review_output(output: dict[str, Any], bind: dict[str, str]) -> str:
    return rule4_doctor_review_fingerprint_v1_hash(
        ruleset_version=output["ruleset_version"],
        registry_version=output["registry_version"],
        doctor_action=bind["doctor_action"],
        consultation_id=bind["consultation_id"],
        draft_version=bind["draft_version"],
        doctor_id=bind["doctor_id"],
        output=output,
    )


def rule4_review_audit_event_fingerprint_v1_hash(payload: dict[str, Any]) -> str:
    body = {"fingerprint_version": "rule4-review-audit-event-fingerprint-v1", **payload}
    return hashlib.sha256(canonical_stable_dumps(body).encode("utf-8")).hexdigest().upper()


class Rule4DoctorReviewAdapterValidationError(ValueError):
    code = "RULE4_DOCTOR_REVIEW_ADAPTER_VALIDATION_FAILED"


def validate_doctor_review_adapter_input(input_contract: dict) -> None:
    if input_contract.get("contract_version") != RULE4_CONTRACT_VERSION_PHASE10_DOCTOR_REVIEW_ISSUANCE:
        raise Rule4DoctorReviewAdapterValidationError(
            "contractVersion not supported for Phase 10 doctor review"
        )
    if not input_contract.get("ruleset_version") or not input_contract.get("registry_version"):
        raise Rule4DoctorReviewAdapterValidationError("rulesetVersion and registryVersion required")
    if input_contract.get("label") not in {"SYNTHETIC", "PRODUCTION"}:
        raise Rule4DoctorReviewAdapterValidationError("label must be SYNTHETIC or PRODUCTION")


def _map_phase3(action: str) -> str:
    return {
        "APPROVE": "ACCEPTED",
        "MODIFY": "MODIFIED",
        "EXCLUDE_UNRESOLVED_SLOT": "MODIFIED",
        "REJECT": "REJECTED",
        "REQUEST_REASSESSMENT": "NEEDS_CLARIFICATION",
    }.get(action, "GENERATED_PENDING_REVIEW")


def _validate_authority(input_contract: dict) -> tuple[bool, list[str]]:
    r = input_contract.get("reviewer_authority") or {}
    reasons: list[str] = []
    if r.get("actor_role") != "DOCTOR":
        reasons.extend(["CLINIC_ADMIN_CLINICAL_APPROVAL_FORBIDDEN", "REVIEWER_AUTHORITY_INVALID"])
    if not r.get("active_membership"):
        reasons.append("REVIEWER_AUTHORITY_INVALID")
    if not r.get("treating_doctor_bound"):
        reasons.append("REVIEWER_AUTHORITY_INVALID")
    if not r.get("session_authenticated"):
        reasons.append("REVIEWER_AUTHORITY_INVALID")
    if r.get("consultation_id") != input_contract.get("consultation_id"):
        reasons.append("CONSULTATION_BINDING_MISMATCH")
    if not r.get("doctor_id") or not r.get("organization_id") or not r.get("clinic_id"):
        reasons.append("TENANT_BINDING_MISMATCH")
    return (len(reasons) == 0, sorted(set(reasons)))


def _validate_modification(input_contract: dict) -> tuple[bool, list[str]]:
    action = input_contract.get("doctor_action")
    if action not in ("MODIFY", "EXCLUDE_UNRESOLVED_SLOT"):
        return True, []
    reasons: list[str] = []
    if action == "MODIFY":
        env = input_contract.get("modification_envelope")
        if not env:
            return False, ["MODIFICATION_ENVELOPE_INVALID"]
        if not (env.get("justification") or "").strip():
            reasons.append("MODIFICATION_JUSTIFICATION_REQUIRED")
        auth = input_contract.get("draft_authenticity") or {}
        if env.get("original_draft_fingerprint") != auth.get("draft_content_hash"):
            reasons.append("DRAFT_AUTHENTICITY_MISMATCH")
        if not (env.get("proposed_draft_version") or "").strip():
            reasons.append("MODIFICATION_ENVELOPE_INVALID")
    if action == "EXCLUDE_UNRESOLVED_SLOT" and not input_contract.get("exclude_slot_ids"):
        reasons.append("MODIFICATION_ENVELOPE_INVALID")
    return (len(reasons) == 0, sorted(set(reasons)))


def _evaluate_idempotency(input_contract: dict, context: dict) -> tuple[bool, bool, list[str]]:
    idem = context.get("idempotency") or {}
    if not idem.get("idempotency_key"):
        return False, False, []
    if idem.get("expected_draft_version") and idem.get("expected_draft_version") != input_contract.get(
        "draft_version"
    ):
        return True, False, ["REVIEW_VERSION_CONFLICT"]
    if idem.get("prior_request_hash") and idem.get("request_hash"):
        if idem["prior_request_hash"] != idem["request_hash"]:
            return True, False, ["IDEMPOTENCY_PAYLOAD_MISMATCH"]
        return False, True, ["IDEMPOTENCY_REPLAY"]
    return False, False, []


def _engine_revalidation(action: str, upstream: dict) -> str:
    if action in ("MODIFY", "EXCLUDE_UNRESOLVED_SLOT"):
        return "REQUIRED_PENDING"
    s = upstream.get("engine_revalidation_status")
    if s in ("PASSED", "FAILED", "REQUIRED_PENDING"):
        return s
    return "NOT_REQUIRED"


def _resolve_statuses(
    action: str,
    gates_block: bool,
    authority_ok: bool,
    idempotency_blocked: bool,
    reval: str,
    is_production: bool,
) -> tuple[str, str]:
    if action == "REJECT":
        return "REJECTED", "REJECTED"
    if action == "REQUEST_REASSESSMENT":
        return "REASSESSMENT_REQUIRED", "REASSESSMENT_REQUIRED"
    if action in ("MODIFY", "EXCLUDE_UNRESOLVED_SLOT"):
        return "REVALIDATION_REQUIRED", "REVALIDATION_REQUIRED"
    if reval in ("REQUIRED_PENDING", "FAILED"):
        return "REVALIDATION_REQUIRED", "REVALIDATION_REQUIRED"
    if not authority_ok or idempotency_blocked or gates_block or is_production:
        return "BLOCKED", "ISSUANCE_BLOCKED"
    if action == "APPROVE":
        return "REVIEW_RECORDED", "ISSUANCE_ELIGIBLE"
    return "BLOCKED", "ISSUANCE_BLOCKED"


def evaluate_doctor_review_adapter(input_contract: dict, context: dict | None = None) -> dict:
    context = context or {}
    validate_doctor_review_adapter_input(input_contract)
    authority_ok, authority_reasons = _validate_authority(input_contract)
    modification_ok, modification_reasons = _validate_modification(input_contract)
    idempotency_blocked, idempotency_replay, idempotency_reasons = _evaluate_idempotency(
        input_contract, context
    )
    upstream = context.get("upstream") or {}
    if upstream.get("legacy_authority_attempt"):
        authority_ok = False
        authority_reasons = sorted(set([*authority_reasons, "LEGACY_AUTHORITY_QUARANTINE"]))

    auth_eval = evaluate_expected_authenticity_authority(
        input_contract, context, input_contract.get("doctor_action"), upstream
    )

    gates = build_issuance_gate_ledger(
        input_contract,
        context,
        authority_ok=authority_ok,
        authority_reasons=authority_reasons,
        idempotency_blocked=idempotency_blocked,
        idempotency_reasons=idempotency_reasons,
        modification_valid=modification_ok,
        modification_reasons=modification_reasons,
        auth_eval=auth_eval,
    )
    gates_block = mandatory_gate_blocks_eligibility(gates)
    action = input_contract.get("doctor_action")
    reval = _engine_revalidation(action, upstream)
    is_production = input_contract.get("label") == "PRODUCTION"
    doctor_status, issuance_status = _resolve_statuses(
        action, gates_block, authority_ok, idempotency_blocked, reval, is_production
    )

    reason_codes = sorted(
        set(
            [
                "DOCTOR_REVIEW_SHADOW_DRAFT_ONLY",
                "DOCTOR_REVIEW_NOT_PRESCRIPTION_ISSUANCE",
                *authority_reasons,
                *modification_reasons,
                *idempotency_reasons,
                *(auth_eval.get("binding_mismatch_codes") or []),
                *(auth_eval.get("mismatch_codes") or []),
                *(c for g in gates for c in g.get("reason_codes") or []),
                *(
                    ["PRODUCTION_DOCTOR_REVIEW_NOT_EVALUATED"]
                    if is_production
                    else []
                ),
                *(
                    ["ISSUANCE_GATE_MANDATORY_FAIL"]
                    if issuance_status == "ISSUANCE_BLOCKED"
                    else []
                ),
            ]
        )
    )

    ra = input_contract.get("reviewer_authority") or {}
    core = {
        "contract_version": input_contract["contract_version"],
        "ruleset_version": input_contract["ruleset_version"],
        "registry_version": input_contract["registry_version"],
        "execution_status": "NOT_IMPLEMENTED",
        "automatic_issuance_runtime": False,
        "automatic_prescription_issuance_runtime": False,
        "prescription_issue_allowed": False,
        "final_doctor_approval_required": True,
        "current_runtime_issuance_delta": "NONE",
        "doctor_review_status": doctor_status,
        "issuance_eligibility_status": issuance_status,
        "phase3_review_state": _map_phase3(action),
        "engine_revalidation_status": reval,
        "issuance_gate_results": gates,
        "reason_codes": reason_codes,
        "limitation_codes": ["SHADOW_DOCTOR_REVIEW_DRAFT_ONLY"],
        "deterministic_doctor_review_fingerprint": "",
        "idempotency_replay": idempotency_replay,
        "shadow_audit_events": [],
    }
    validate_doctor_review_output_codes(core)
    fp = fingerprint_from_doctor_review_output(
        core,
        {
            "doctor_action": action,
            "consultation_id": input_contract.get("consultation_id"),
            "draft_version": input_contract.get("draft_version"),
            "doctor_id": ra.get("doctor_id"),
        },
    )
    shadow_audit_events = build_shadow_audit_events(
        {
            "doctor_action": action,
            "consultation_id": input_contract.get("consultation_id"),
            "draft_version": input_contract.get("draft_version"),
            "doctor_id": ra.get("doctor_id"),
            "organization_id": ra.get("organization_id"),
            "clinic_id": ra.get("clinic_id"),
            "review_timestamp": ra.get("review_timestamp"),
            "decision_fingerprint": fp,
            "reason_codes": core["reason_codes"],
            "output": core,
            "superseded": auth_eval.get("superseded", False),
        }
    )
    core["deterministic_doctor_review_fingerprint"] = fp
    core["shadow_audit_events"] = shadow_audit_events
    return core
