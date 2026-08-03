from __future__ import annotations

from typing import Literal, TypedDict

RULE4_GATE_OUTCOME_VALUES = (
    "PASS",
    "FAIL",
    "NOT_EVALUATED",
    "MISSING_INPUT",
    "NON_EXECUTABLE_PENDING_FREEZE",
    "BLOCKED_BY_SAFETY",
    "BLOCKED_BY_UPSTREAM",
    "CONTRADICTORY",
)

Rule4GateOutcome = Literal[
    "PASS",
    "FAIL",
    "NOT_EVALUATED",
    "MISSING_INPUT",
    "NON_EXECUTABLE_PENDING_FREEZE",
    "BLOCKED_BY_SAFETY",
    "BLOCKED_BY_UPSTREAM",
    "CONTRADICTORY",
]

RULE4_ELIGIBILITY_STATUS_VALUES = (
    "NOT_EVALUATED",
    "NON_POTENCY",
    "BLOCKED_BY_SAFETY",
    "BLOCKED_BY_UPSTREAM",
    "NO_FAMILY_ELIGIBLE",
    "FAMILY_ELIGIBLE",
)

Rule4EligibilityStatus = Literal[
    "NOT_EVALUATED",
    "NON_POTENCY",
    "BLOCKED_BY_SAFETY",
    "BLOCKED_BY_UPSTREAM",
    "NO_FAMILY_ELIGIBLE",
    "FAMILY_ELIGIBLE",
]

RULE4_CANDIDATE_FAMILY_VALUES = (
    "NONE",
    "D1_ELIGIBLE",
    "D2_ELIGIBLE",
    "BOTH_D1_D2_ELIGIBLE",
    "D3_D5_FAMILY_ELIGIBLE",
    "D10_FAMILY_ELIGIBLE",
    "D30_FAMILY_ELIGIBLE",
    "D60_FAMILY_ELIGIBLE",
    "D60_D10_FALLBACK_READY",
)

Rule4CandidateFamily = Literal[
    "NONE",
    "D1_ELIGIBLE",
    "D2_ELIGIBLE",
    "BOTH_D1_D2_ELIGIBLE",
    "D3_D5_FAMILY_ELIGIBLE",
    "D10_FAMILY_ELIGIBLE",
    "D30_FAMILY_ELIGIBLE",
    "D60_FAMILY_ELIGIBLE",
    "D60_D10_FALLBACK_READY",
]


class Rule4GateResult(TypedDict):
    gate_id: str
    outcome: Rule4GateOutcome
    evidence_item_ids: list[str]
    reason_codes: list[str]
    limitation_codes: list[str]
