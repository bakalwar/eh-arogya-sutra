from __future__ import annotations

import copy
import json
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1] / "src"
REPO = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(ROOT))

from ehas2_clinical_engine.rule4.evaluator import evaluate_rule4_empty  # noqa: E402
from ehas2_clinical_engine.rule4.safety_fingerprint_v1 import (  # noqa: E402
    rule4_safety_fingerprint_v1_canonical_string,
    rule4_safety_fingerprint_v1_hash,
)

FIXTURE = REPO / "fixtures" / "rule4" / "safety-gate-scenarios.v1.json"


class Rule4FingerprintV1Tests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.fixture = json.loads(FIXTURE.read_text(encoding="utf-8"))
        cls.ref = cls.fixture["fingerprintV1Reference"]

    def test_valid_adult_clear_matches_fixture_reference(self) -> None:
        scenario = next(s for s in self.fixture["scenarios"] if s["id"] == self.ref["scenarioId"])
        out = evaluate_rule4_empty(scenario["input"])
        sg = out["safety_gate"]
        self.assertEqual(sg["deterministic_safety_fingerprint"], self.ref["safetySha256"])
        self.assertEqual(out["deterministic_fingerprint"], self.ref["emptyResultSha256"])
        canon = rule4_safety_fingerprint_v1_canonical_string(
            safety_gate_status=sg["safety_gate_status"],
            safety_status=sg["safety_status"],
            prescription_status=sg["prescription_status"],
            hold_status=sg["hold_status"],
            patient_wide_hold=sg["patient_wide_hold"],
            urgent_escalation_required=sg["urgent_escalation_required"],
            analysis_status=sg["analysis_status"],
            d13_hard_stop_active=sg["d13_hard_stop_active"],
            age_verification=sg["age_verification_status"],
            pediatric_band=sg["pediatric_band"],
            bp_crisis=False,
            reason_codes=sg["reason_codes"],
            limitation_codes=sg["limitation_codes"],
        )
        self.assertEqual(canon, self.ref["canonicalPayload"])

    def test_input_key_order_independence(self) -> None:
        scenario = next(s for s in self.fixture["scenarios"] if s["id"] == "valid-adult-clear")
        base = scenario["input"]
        reordered = copy.deepcopy(base)
        reordered["engine_mode"] = reordered.pop("engine_mode")
        a = evaluate_rule4_empty(base)["safety_gate"]["deterministic_safety_fingerprint"]
        b = evaluate_rule4_empty(reordered)["safety_gate"]["deterministic_safety_fingerprint"]
        self.assertEqual(a, b)

    def test_owner_structured_upstream_rejected(self) -> None:
        scenario = next(
            s for s in self.fixture["scenarios"] if s["id"] == "upstream-owner-structured-rejected"
        )
        out = evaluate_rule4_empty(scenario["input"])
        self.assertEqual(out["safety_gate"]["age_verification_status"], "UNRESOLVED")
        self.assertIn("UPSTREAM_AGE_SOURCE_NOT_AUTHORIZED", out["safety_gate"]["reason_codes"])


if __name__ == "__main__":
    unittest.main()
