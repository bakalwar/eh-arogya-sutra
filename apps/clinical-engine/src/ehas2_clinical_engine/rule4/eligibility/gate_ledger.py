from __future__ import annotations

from .types import Rule4GateOutcome, Rule4GateResult


def gate_result(
    gate_id: str,
    outcome: Rule4GateOutcome,
    *,
    evidence_item_ids: list[str] | None = None,
    reason_codes: list[str] | None = None,
    limitation_codes: list[str] | None = None,
) -> Rule4GateResult:
    return {
        "gate_id": gate_id,
        "outcome": outcome,
        "evidence_item_ids": sorted(evidence_item_ids or []),
        "reason_codes": sorted(set(reason_codes or [])),
        "limitation_codes": sorted(set(limitation_codes or [])),
    }


def mandatory_gate_blocks_family(gates: list[Rule4GateResult]) -> bool:
    return any(g["outcome"] != "PASS" for g in gates)


def blocking_gate_codes_from(gates: list[Rule4GateResult]) -> list[str]:
    return sorted(g["gate_id"] for g in gates if g["outcome"] != "PASS")
