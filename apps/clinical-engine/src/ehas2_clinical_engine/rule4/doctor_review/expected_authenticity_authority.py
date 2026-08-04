from __future__ import annotations

from typing import Any

MANDATORY_EXPECTED_AUTHENTICITY_FIELDS = (
    "draft_version",
    "draft_content_hash",
    "slot_manifest_fingerprint",
    "evidence_fingerprint",
    "polarity_fingerprint",
    "phase_fingerprint",
    "severity_fingerprint",
    "eligibility_fingerprint",
    "selection_fingerprint",
    "pediatric_fingerprint",
    "clinical_summary_fingerprint",
    "ruleset_version",
    "registry_version",
)


def _is_non_empty(value: Any) -> bool:
    return isinstance(value, str) and bool(value.strip())


def approval_path_requires_expected_authenticity(action: str, upstream: dict[str, Any]) -> bool:
    if action != "APPROVE":
        return False
    reval = upstream.get("engine_revalidation_status") or "NOT_REQUIRED"
    if reval in ("REQUIRED_PENDING", "FAILED"):
        return False
    return True


def _compare_draft_to_expected(draft: dict[str, Any], expected: dict[str, Any]) -> tuple[list[str], bool]:
    mismatch: list[str] = []
    superseded_fields = False
    supersede_keys = {
        "draft_version",
        "draft_content_hash",
        "slot_manifest_fingerprint",
        "evidence_fingerprint",
        "selection_fingerprint",
        "pediatric_fingerprint",
        "clinical_summary_fingerprint",
        "polarity_fingerprint",
        "phase_fingerprint",
        "severity_fingerprint",
        "eligibility_fingerprint",
        "ruleset_version",
        "registry_version",
    }
    for k in MANDATORY_EXPECTED_AUTHENTICITY_FIELDS:
        if draft.get(k) != expected.get(k):
            mismatch.append("DRAFT_AUTHENTICITY_MISMATCH")
            if k == "evidence_fingerprint":
                mismatch.append("STALE_EVIDENCE_FINGERPRINT")
            if k == "clinical_summary_fingerprint":
                mismatch.append("STALE_SUMMARY_FINGERPRINT")
            if k in ("draft_version", "draft_content_hash"):
                mismatch.append("STALE_DRAFT_VERSION")
            if k == "selection_fingerprint":
                mismatch.append("STALE_PHASE8_SELECTION_FINGERPRINT")
            if k == "pediatric_fingerprint":
                mismatch.append("STALE_PHASE9_PEDIATRIC_FINGERPRINT")
            if k in supersede_keys:
                superseded_fields = True
    if draft.get("ruleset_version") != expected.get("ruleset_version") or draft.get(
        "registry_version"
    ) != expected.get("registry_version"):
        mismatch.append("RULESET_REGISTRY_MISMATCH")
    return sorted(set(mismatch)), superseded_fields


def evaluate_expected_authenticity_authority(
    input_contract: dict[str, Any],
    context: dict[str, Any],
    action: str,
    upstream: dict[str, Any],
) -> dict[str, Any]:
    approval_path = approval_path_requires_expected_authenticity(action, upstream)
    expected = context.get("expected_authenticity")
    binding = context.get("expected_reviewer_binding")
    binding_mismatch: list[str] = []

    if approval_path:
        if binding:
            ra = input_contract.get("reviewer_authority") or {}
            if binding.get("consultation_id") != input_contract.get("consultation_id"):
                binding_mismatch.append("CONSULTATION_BINDING_MISMATCH")
            if binding.get("doctor_id") != ra.get("doctor_id"):
                binding_mismatch.append("TENANT_BINDING_MISMATCH")
            if binding.get("organization_id") != ra.get("organization_id") or binding.get(
                "clinic_id"
            ) != ra.get("clinic_id"):
                binding_mismatch.append("TENANT_BINDING_MISMATCH")
        else:
            binding_mismatch.append("EXPECTED_REVIEWER_BINDING_MISSING")

    if not approval_path:
        mismatch = (
            _compare_draft_to_expected(
                input_contract.get("draft_authenticity") or {}, expected
            )[0]
            if expected
            else []
        )
        return {
            "approval_path_requires_expected": False,
            "expected_missing": False,
            "expected_field_missing": [],
            "mismatch_codes": mismatch,
            "superseded": False,
            "binding_mismatch_codes": sorted(set(binding_mismatch)),
        }

    if not expected:
        return {
            "approval_path_requires_expected": True,
            "expected_missing": True,
            "expected_field_missing": [],
            "mismatch_codes": ["EXPECTED_DRAFT_AUTHENTICITY_MISSING"],
            "superseded": False,
            "binding_mismatch_codes": sorted(set(binding_mismatch)),
        }

    field_missing = [f for f in MANDATORY_EXPECTED_AUTHENTICITY_FIELDS if not _is_non_empty(expected.get(f))]
    if field_missing:
        return {
            "approval_path_requires_expected": True,
            "expected_missing": False,
            "expected_field_missing": field_missing,
            "mismatch_codes": ["EXPECTED_AUTHENTICITY_FIELD_MISSING"],
            "superseded": False,
            "binding_mismatch_codes": sorted(set(binding_mismatch)),
        }

    mismatch, superseded_fields = _compare_draft_to_expected(
        input_contract.get("draft_authenticity") or {}, expected
    )
    superseded = superseded_fields and len(mismatch) > 0
    prior = context.get("prior_approved_authenticity")
    if prior:
        for k in (
            "draft_version",
            "draft_content_hash",
            "slot_manifest_fingerprint",
            "evidence_fingerprint",
            "selection_fingerprint",
            "pediatric_fingerprint",
            "clinical_summary_fingerprint",
        ):
            if expected.get(k) != prior.get(k):
                superseded = True
                break
    if upstream.get("slot_manifest_change") in ("ADDED", "REMOVED"):
        superseded = True
    if upstream.get("prior_approved_draft_version") and upstream.get(
        "prior_approved_draft_version"
    ) != expected.get("draft_version"):
        superseded = True
    if superseded:
        mismatch.append("APPROVAL_SUPERSEDED")
    return {
        "approval_path_requires_expected": True,
        "expected_missing": False,
        "expected_field_missing": [],
        "mismatch_codes": sorted(set(mismatch)),
        "superseded": superseded,
        "binding_mismatch_codes": sorted(set(binding_mismatch)),
    }
