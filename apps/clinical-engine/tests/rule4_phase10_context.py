"""Phase 10 doctor review fixture evaluation helpers (mirrors TS loader)."""
from __future__ import annotations

import json
from copy import deepcopy
from pathlib import Path
from typing import Any


def snake_to_camel_key(key: str) -> str:
    parts = key.split("_")
    return parts[0] + "".join(p.title() for p in parts[1:])


def snake_to_camel_deep(obj: Any) -> Any:
    if obj is None or not isinstance(obj, (dict, list)):
        return obj
    if isinstance(obj, list):
        return [snake_to_camel_deep(x) for x in obj]
    return {snake_to_camel_key(k): snake_to_camel_deep(v) for k, v in obj.items()}


def load_doctor_review_fixture() -> dict[str, Any]:
    repo = Path(__file__).resolve().parents[3]
    path = repo / "fixtures" / "rule4" / "doctor-review-issuance-scenarios.v1.json"
    return json.loads(path.read_text(encoding="utf-8"))


def evaluate_doctor_review_from_fixture_scenario(scenario: dict[str, Any]) -> dict[str, Any]:
    from ehas2_clinical_engine.rule4.doctor_review.evaluate_doctor_review_adapter import (
        evaluate_doctor_review_adapter,
    )

    inp = deepcopy(scenario["input"])
    ctx = deepcopy(scenario.get("context") or {})
    if ctx.get("idempotency") is None:
        ctx.pop("idempotency", None)
    return evaluate_doctor_review_adapter(inp, ctx)


RULE4_DOCTOR_REVIEW_FIXTURE_SHA256 = (
    "94A533DB0542DEF59B647F1404AC88CF0897182A4156A5649C92C73BF08FD1CE"
)
