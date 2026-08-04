from __future__ import annotations

from typing import Any


def build_review_audit_event(input_payload: dict[str, Any]) -> dict[str, Any]:
    from .evaluate_doctor_review_adapter import rule4_review_audit_event_fingerprint_v1_hash

    reason_codes = sorted(input_payload.get("reason_codes") or [])
    base = {
        "event_type": input_payload["event_type"],
        "consultation_id": input_payload["consultation_id"],
        "draft_version": input_payload["draft_version"],
        "doctor_id": input_payload["doctor_id"],
        "organization_id": input_payload["organization_id"],
        "clinic_id": input_payload["clinic_id"],
        "timestamp": input_payload["timestamp"],
        "decision_fingerprint": input_payload["decision_fingerprint"],
        "reason_codes": reason_codes,
    }
    fp = rule4_review_audit_event_fingerprint_v1_hash(
        {
            "clinic_id": input_payload["clinic_id"],
            "consultation_id": input_payload["consultation_id"],
            "decision_fingerprint": input_payload["decision_fingerprint"],
            "doctor_id": input_payload["doctor_id"],
            "draft_version": input_payload["draft_version"],
            "event_type": input_payload["event_type"],
            "organization_id": input_payload["organization_id"],
            "reason_codes": reason_codes,
            "timestamp": input_payload["timestamp"],
        }
    )
    return {**base, "audit_event_fingerprint": fp}


def build_shadow_audit_events(input_payload: dict[str, Any]) -> list[dict[str, Any]]:
    action = input_payload["doctor_action"]
    output = input_payload["output"]
    superseded = input_payload.get("superseded", False)
    events: list[str] = []

    if action in ("MODIFY", "EXCLUDE_UNRESOLVED_SLOT"):
        events.extend(["MODIFICATION_PROPOSED", "REVALIDATION_REQUIRED"])
    if action == "REJECT":
        events.append("REVIEW_REJECTED")
    if action == "REQUEST_REASSESSMENT":
        events.append("REASSESSMENT_REQUESTED")
    if superseded:
        events.append("APPROVAL_SUPERSEDED")
    if output.get("engine_revalidation_status") in ("REQUIRED_PENDING", "FAILED"):
        if "REVALIDATION_REQUIRED" not in events:
            events.append("REVALIDATION_REQUIRED")
    if (
        action == "APPROVE"
        and output.get("doctor_review_status") == "REVIEW_RECORDED"
        and output.get("issuance_eligibility_status") == "ISSUANCE_ELIGIBLE"
    ):
        events.append("APPROVAL_RECORDED")
    if output.get("issuance_eligibility_status") == "ISSUANCE_BLOCKED":
        events.append("ISSUANCE_BLOCKED")
    events.append("ISSUANCE_ELIGIBILITY_EVALUATED")

    unique = sorted(set(events), key=events.index)
    return [
        build_review_audit_event(
            {
                "event_type": event_type,
                "consultation_id": input_payload["consultation_id"],
                "draft_version": input_payload["draft_version"],
                "doctor_id": input_payload["doctor_id"],
                "organization_id": input_payload["organization_id"],
                "clinic_id": input_payload["clinic_id"],
                "timestamp": input_payload["review_timestamp"],
                "decision_fingerprint": input_payload["decision_fingerprint"],
                "reason_codes": input_payload.get("reason_codes") or [],
            }
        )
        for event_type in unique
    ]
