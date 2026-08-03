from __future__ import annotations

SOURCE_DECLARED = frozenset(
    {
        "SOURCE_DECLARED_CRITICAL",
        "SOURCE_DECLARED_LIFE_THREATENING",
        "SOURCE_DECLARED_URGENT",
    }
)
FROZEN_RED = frozenset({"ACUTE_NEUROLOGICAL_RED_FLAG"})
USABLE_VERIFICATION = frozenset({"VERIFIED"})
USABLE_ASSERTION = frozenset({"ACTIVE", "PRESENT"})
USABLE_SOURCE_TYPES = frozenset(
    {"STRUCTURED_REPORT", "OWNER_STRUCTURED", "DOCTOR_STRUCTURED", "APPROVED_UPSTREAM"}
)


def evaluate_structured_critical_inputs(
    structured_critical_findings: list[dict],
    structured_frozen_red_flags: list[dict],
) -> dict:
    reason_codes: list[str] = []
    limitation_codes: list[str] = []
    escalation_eligible = False
    has_unknown = False
    has_invalid = False

    for finding in structured_critical_findings:
        code = finding.get("critical_flag_code") or finding.get("criticalFlagCode")
        if code not in SOURCE_DECLARED:
            has_unknown = True
            reason_codes.append("UNKNOWN_CRITICAL_FLAG_CODE")
            continue
        if not _entry_usable(finding, code_key="critical_flag_code", alt_key="criticalFlagCode"):
            has_invalid = True
            reason_codes.append("CRITICAL_FINDING_INPUT_INVALID")
            continue
        escalation_eligible = True
        reason_codes.append("SOURCE_DECLARED_CRITICAL_FINDING")

    for flag in structured_frozen_red_flags:
        code = flag.get("red_flag_code") or flag.get("redFlagCode")
        if code not in FROZEN_RED:
            has_unknown = True
            reason_codes.append("UNKNOWN_CRITICAL_FLAG_CODE")
            continue
        if not _entry_usable(flag, code_key="red_flag_code", alt_key="redFlagCode"):
            has_invalid = True
            reason_codes.append("CRITICAL_FINDING_INPUT_INVALID")
            continue
        escalation_eligible = True
        reason_codes.append("FROZEN_RED_FLAG_ESCALATION")

    if has_unknown:
        limitation_codes.append("CRITICAL_FLAG_CODE_NOT_IN_PHASE2_ALLOWLIST")

    return {
        "escalation_eligible": escalation_eligible,
        "has_unknown_codes": has_unknown,
        "has_invalid_entries": has_invalid,
        "reason_codes": sorted(set(reason_codes)),
        "limitation_codes": sorted(set(limitation_codes)),
    }


def _entry_usable(entry: dict, *, code_key: str, alt_key: str) -> bool:
    verification = entry.get("verification_status") or entry.get("verificationStatus")
    assertion = entry.get("assertion_status") or entry.get("assertionStatus")
    source_type = entry.get("source_type") or entry.get("sourceType")
    source_ref = entry.get("source_reference_id") or entry.get("sourceReferenceId") or ""
    return (
        verification in USABLE_VERIFICATION
        and assertion in USABLE_ASSERTION
        and source_type in USABLE_SOURCE_TYPES
        and isinstance(source_ref, str)
        and source_ref.strip() != ""
    )
