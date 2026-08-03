from __future__ import annotations

import json
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1] / "src"
REPO = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(ROOT))

from ehas2_clinical_engine.rule4.evaluator import evaluate_rule4_empty  # noqa: E402
from ehas2_clinical_engine.rule4.registry_merge import (  # noqa: E402
    Rule4RegistryMergeError,
    merge_registry_entries,
)
from ehas2_clinical_engine.rule4.safety.evaluate_safety_gate import evaluate_bp_crisis  # noqa: E402

FIXTURE = REPO / "fixtures" / "rule4" / "safety-gate-scenarios.v1.json"
ALLOWED = REPO / "fixtures" / "rule4" / "phase2-allowed-critical-codes.v1.json"


def _normalized_view(out: dict) -> dict:
    sg = out["safety_gate"]
    return {
        "ageVerificationStatus": sg["age_verification_status"],
        "pediatricBand": sg["pediatric_band"],
        "safetyGateStatus": sg["safety_gate_status"],
        "safetyStatus": sg["safety_status"],
        "prescriptionStatus": sg["prescription_status"],
        "holdStatus": sg["hold_status"],
        "patientWideHold": sg["patient_wide_hold"],
        "urgentEscalationRequired": sg["urgent_escalation_required"],
        "safetyClearForFutureCascade": sg["safety_clear_for_future_cascade"],
        "reasonCodes": sorted(sg["reason_codes"]),
        "limitationCodes": sorted(sg["limitation_codes"]),
        "slotPotencyStatus": out["slots"][0]["potency_status"] if out.get("slots") else None,
        "selectedDilution": out["slots"][0]["selected_dilution"] if out.get("slots") else None,
        "safetyFingerprint": sg["deterministic_safety_fingerprint"],
    }


class Rule4ScenarioParityTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.scenarios = json.loads(FIXTURE.read_text(encoding="utf-8"))["scenarios"]

    def test_shared_fixture_scenarios(self) -> None:
        for scenario in self.scenarios:
            with self.subTest(scenario=scenario["id"]):
                out = evaluate_rule4_empty(scenario["input"])
                view = _normalized_view(out)
                for key, value in scenario["expected"].items():
                    self.assertEqual(view[key], value, msg=f"{scenario['id']}.{key}")
                self.assertIsNone(view["selectedDilution"])
                self.assertRegex(view["safetyFingerprint"], r"^[A-F0-9]{64}$")

    def test_allowed_critical_fixture_matches_constants(self) -> None:
        allowed = json.loads(ALLOWED.read_text(encoding="utf-8"))
        src = {e["code"] for e in allowed["sourceDeclaredCriticalFlagCodes"]}
        red = {e["code"] for e in allowed["frozenRedFlagCodes"]}
        self.assertIn("SOURCE_DECLARED_URGENT", src)
        self.assertIn("ACUTE_NEUROLOGICAL_RED_FLAG", red)


class Rule4RegistryMergeTests(unittest.TestCase):
    def test_identical_duplicate_dedupes(self) -> None:
        a = [{"code": "X", "namespace": "reason", "source": "s"}]
        merged = merge_registry_entries(a, a)
        self.assertEqual(len(merged), 1)

    def test_namespace_conflict_fails(self) -> None:
        a = [{"code": "X", "namespace": "reason", "source": "s"}]
        b = [{"code": "X", "namespace": "limitation", "source": "s"}]
        with self.assertRaises(Rule4RegistryMergeError):
            merge_registry_entries(a, b)


class Rule4BpMultiReadingTests(unittest.TestCase):
    scenarios = json.loads(FIXTURE.read_text(encoding="utf-8"))["scenarios"]

    def _reading(self, sys_v, dia_v, status, unit="mmHg"):
        return {
            "systolic": sys_v,
            "diastolic": dia_v,
            "unit": unit,
            "evidence_status": status,
        }

    def test_crisis_plus_non_crisis(self) -> None:
        r = evaluate_bp_crisis([self._reading(190, 80, "VERIFIED_CURRENT_READING"), self._reading(120, 80, "VERIFIED_CURRENT_READING")])
        self.assertTrue(r.crisis_detected)

    def test_contradictory_only_no_crisis(self) -> None:
        r = evaluate_bp_crisis([self._reading(200, 120, "CONTRADICTORY")])
        self.assertFalse(r.crisis_detected)

    def test_historical_plus_current_crisis(self) -> None:
        r = evaluate_bp_crisis(
            [
                self._reading(200, 80, "HISTORICAL_READING"),
                self._reading(190, 80, "VERIFIED_CURRENT_READING"),
            ]
        )
        self.assertTrue(r.crisis_detected)

    def test_invalid_sibling_valid_crisis(self) -> None:
        r = evaluate_bp_crisis(
            [
                self._reading(200, 120, "INVALID"),
                self._reading(185, 80, "VERIFIED_CURRENT_READING"),
            ]
        )
        self.assertTrue(r.crisis_detected)

    def test_single_unconfirmed_high_no_crisis(self) -> None:
        r = evaluate_bp_crisis([self._reading(200, 120, "SINGLE_UNCONFIRMED_READING")])
        self.assertFalse(r.crisis_detected)

    def test_repeated_confirmed_crisis(self) -> None:
        r = evaluate_bp_crisis([self._reading(180, 110, "REPEATED_CONFIRMED_READING")])
        self.assertTrue(r.crisis_detected)

    def test_duplicate_non_crisis_readings(self) -> None:
        pair = [self._reading(120, 80, "VERIFIED_CURRENT_READING")] * 2
        r = evaluate_bp_crisis(pair)
        self.assertFalse(r.crisis_detected)

    def test_duplicate_crisis_readings(self) -> None:
        pair = [self._reading(190, 80, "VERIFIED_CURRENT_READING")] * 2
        r = evaluate_bp_crisis(pair)
        self.assertTrue(r.crisis_detected)

    def test_historical_only_no_crisis(self) -> None:
        r = evaluate_bp_crisis([self._reading(200, 120, "HISTORICAL_READING")])
        self.assertFalse(r.crisis_detected)

    def test_multi_slot_all_blocked(self) -> None:
        scenario = next(s for s in self.scenarios if s["id"] == "multi-slot-crisis-hold")
        out = evaluate_rule4_empty(scenario["input"])
        self.assertTrue(out["safety_gate"]["patient_wide_hold"])
        self.assertEqual(len(out["slots"]), 2)
        self.assertTrue(
            all(s["potency_status"] == "BLOCKED_BY_PATIENT_WIDE_SAFETY_GATE" for s in out["slots"])
        )


if __name__ == "__main__":
    unittest.main()
