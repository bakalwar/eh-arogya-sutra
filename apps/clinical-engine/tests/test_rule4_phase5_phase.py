"""Rule 4 Phase 5 structured phase adapter tests."""

from __future__ import annotations

import json
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1] / "src"
REPO = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(ROOT))

from ehas2_clinical_engine.rule4.phase.duration_calendar import (  # noqa: E402
    inclusive_duration_days,
    is_valid_positive_integer_duration,
    parse_iso_date_only,
)
from ehas2_clinical_engine.rule4.phase.evaluate_phase_adapter import (  # noqa: E402
    evaluate_phase_adapter,
)
from ehas2_clinical_engine.rule4.registry_loader import load_reason_code_registry  # noqa: E402

FIXTURE = REPO / "fixtures" / "rule4" / "phase-resolution-scenarios.v1.json"


def _context_kwargs(scenario: dict) -> dict:
    ctx = scenario.get("context") or {}
    inp = scenario.get("input") or {}
    bypass = inp.get("trusted_synthetic_binding_bypass") is True
    mandatory = False if bypass else ctx.get("binding_gate_mandatory", True)
    return {
        "safety_gate": ctx.get("safety_gate"),
        "evidence_adapter": ctx.get("evidence_adapter"),
        "polarity_routing": ctx.get("polarity_routing"),
        "binding_gate_mandatory": mandatory,
    }


class Rule4Phase5DurationTests(unittest.TestCase):
    def test_same_day_is_day_one(self) -> None:
        self.assertEqual(inclusive_duration_days("2026-03-01", "2026-03-01")["days"], 1)

    def test_assessment_before_onset_invalid(self) -> None:
        self.assertTrue(inclusive_duration_days("2026-03-02", "2026-03-01")["invalid"])

    def test_positive_integer_duration(self) -> None:
        self.assertTrue(is_valid_positive_integer_duration(10))
        self.assertFalse(is_valid_positive_integer_duration(0))

    def test_invalid_calendar(self) -> None:
        self.assertIsNone(parse_iso_date_only("2026-02-30"))


class Rule4Phase5ScenarioTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.fixture = json.loads(FIXTURE.read_text(encoding="utf-8"))
        cls.scenarios = cls.fixture["scenarios"]

    def test_registry_phase5_scope(self) -> None:
        reg = load_reason_code_registry()
        codes = {e["code"] for e in reg["reasonCodes"]}
        self.assertIn("PHASE_EVIDENCE_MISSING", codes)

    def test_fixture_has_38_scenarios(self) -> None:
        self.assertGreaterEqual(len(self.scenarios), 38)
        self.assertEqual(len(self.scenarios), self.fixture["scenarioCount"])

    def test_shared_scenario_parity(self) -> None:
        for scenario in self.scenarios:
            with self.subTest(scenario=scenario["id"]):
                out = evaluate_phase_adapter(scenario["input"], **_context_kwargs(scenario))
                self.assertEqual(out["execution_status"], "NOT_IMPLEMENTED")
                self.assertFalse(out["automatic_phase_runtime"])
                slot = out["slot_resolutions"][0]
                self.assertIsNone(slot["selected_cascade"])
                self.assertIsNone(slot["selected_dilution"])
                expected = scenario["expected"]
                view = {
                    "phase_status": slot["phase_status"],
                    "resolved_phase": slot["resolved_phase"],
                    "duration_consistency_status": slot["duration_consistency_status"],
                    "calculated_duration_days": slot["calculated_duration_days"],
                    "flare_status": slot["flare_status"],
                    "reason_codes": out["reason_codes"],
                    "limitation_codes": slot["limitation_codes"],
                }
                for key, value in expected.items():
                    if key == "reason_includes":
                        for code in value:
                            self.assertIn(code, view["reason_codes"])
                    elif key == "limitation_includes":
                        for code in value:
                            self.assertIn(code, view["limitation_codes"])
                    else:
                        self.assertEqual(view[key], value)


if __name__ == "__main__":
    unittest.main()
