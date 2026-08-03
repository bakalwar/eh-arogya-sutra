from __future__ import annotations

import copy
import json
import os
import sys
import threading
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1] / "src"
sys.path.insert(0, str(ROOT))

from ehas2_clinical_engine.disease_package import synthetic_fixture_dir  # noqa: E402
from ehas2_clinical_engine.orchestrator import (  # noqa: E402
    NineRuleOrchestrator,
    OrchestratorRun,
)
from ehas2_clinical_engine.rule4.evaluator import evaluate_rule4_empty  # noqa: E402
from ehas2_clinical_engine.rule4.orchestrator_hook import apply_rule4_orchestrator_hook  # noqa: E402
from ehas2_clinical_engine.rule4.registry_paths import RULE4_CONTRACT_VERSION_PHASE2  # noqa: E402
from ehas2_clinical_engine.rule4.safety.date_calendar import (  # noqa: E402
    band_from_days_and_calendar,
    calendar_days_between,
    parse_iso_date_only,
)

REPO_ROOT = Path(__file__).resolve().parents[3]


def _phase2_input(**overrides) -> dict:
    base = {
        "contract_version": RULE4_CONTRACT_VERSION_PHASE2,
        "case_id": "p2-case",
        "consultation_id": "p2-consult",
        "ruleset_version": "ehas2-rule4-ruleset-v1-frozen-doc-4c35469",
        "engine_mode": "shadow",
        "label": "SYNTHETIC",
        "formula_slots": [
            {"formula_slot_id": "s1", "formula_target_id": "t1", "structured_evidence_item_ids": []},
            {"formula_slot_id": "s2", "formula_target_id": "t2", "structured_evidence_item_ids": []},
        ],
        "verified_age": {
            "verification_status": "VERIFIED",
            "verified_date_of_birth": "1990-06-01",
            "consultation_assessment_date": "2026-06-01",
            "age_years": None,
        },
        "patient_wide_safety": {},
        "structured_evidence_item_ids": [],
        "bp_readings": [],
    }
    base.update(overrides)
    return base


def _bp(sys_val: int | None, dia_val: int | None, unit: str | None = "mmHg") -> dict:
    return {
        "systolic": sys_val,
        "diastolic": dia_val,
        "unit": unit,
        "evidence_status": "VERIFIED_CURRENT_READING",
    }


class Rule4Phase2SafetyTests(unittest.TestCase):
    def test_systolic_only_crisis(self) -> None:
        out = evaluate_rule4_empty(_phase2_input(bp_readings=[_bp(185, 80)]))
        sg = out["safety_gate"]
        self.assertTrue(sg["patient_wide_hold"])
        self.assertEqual(sg["hold_status"], "PRESCRIPTION_HOLD")
        self.assertTrue(sg["urgent_escalation_required"])
        self.assertTrue(all(s["selected_dilution"] is None for s in out["slots"]))

    def test_diastolic_only_crisis(self) -> None:
        out = evaluate_rule4_empty(_phase2_input(bp_readings=[_bp(120, 115)]))
        self.assertEqual(out["safety_gate"]["safety_status"], "ACUTE_RED_FLAG")

    def test_both_crisis(self) -> None:
        out = evaluate_rule4_empty(_phase2_input(bp_readings=[_bp(190, 120)]))
        self.assertIn("BP_CRISIS_PATIENT_WIDE", out["safety_gate"]["reason_codes"])

    def test_below_threshold(self) -> None:
        out = evaluate_rule4_empty(_phase2_input(bp_readings=[_bp(179, 109)]))
        self.assertFalse(out["safety_gate"]["patient_wide_hold"])

    def test_missing_bp_unit_no_crisis(self) -> None:
        out = evaluate_rule4_empty(_phase2_input(bp_readings=[_bp(200, 120, None)]))
        self.assertFalse(out["safety_gate"]["patient_wide_hold"])
        self.assertIn("BP_EVIDENCE_NOT_CRISIS_COMPARABLE", out["safety_gate"]["limitation_codes"])

    def test_invalid_bp_unit(self) -> None:
        out = evaluate_rule4_empty(_phase2_input(bp_readings=[_bp(200, 120, "kPa")]))
        self.assertFalse(out["safety_gate"]["patient_wide_hold"])

    def test_no_bp_120_default(self) -> None:
        out = evaluate_rule4_empty(_phase2_input())
        blob = json.dumps(out)
        self.assertNotIn("120", blob)

    def test_missing_age_unresolved(self) -> None:
        out = evaluate_rule4_empty(
            _phase2_input(
                verified_age={"verification_status": "MISSING"},
            )
        )
        self.assertEqual(out["slots"][0]["potency_status"], "UNRESOLVED")
        self.assertIn("VERIFIED_AGE_MISSING", out["slots"][0]["reason_codes"])

    def test_crisis_not_suppressed_by_missing_age(self) -> None:
        out = evaluate_rule4_empty(
            _phase2_input(
                verified_age={"verification_status": "MISSING"},
                bp_readings=[_bp(190, 80)],
            )
        )
        self.assertTrue(out["safety_gate"]["patient_wide_hold"])
        self.assertIn("VERIFIED_AGE_MISSING", out["safety_gate"]["reason_codes"])

    def test_first_birthday_p13_c(self) -> None:
        out = evaluate_rule4_empty(
            _phase2_input(
                verified_age={
                    "verification_status": "VERIFIED",
                    "verified_date_of_birth": "2024-01-15",
                    "consultation_assessment_date": "2025-01-15",
                }
            )
        )
        self.assertEqual(out["safety_gate"]["pediatric_band"], "P13_C")
        self.assertFalse(out["safety_gate"]["d13_hard_stop_active"])

    def test_leap_year_birthday(self) -> None:
        dob = parse_iso_date_only("2020-02-29")
        eve = parse_iso_date_only("2021-02-27")
        assert dob and eve
        days = calendar_days_between(dob, eve)
        band = band_from_days_and_calendar(days, dob, eve)
        self.assertEqual(band, "P13_B")
        out = evaluate_rule4_empty(
            _phase2_input(
                verified_age={
                    "verification_status": "VERIFIED",
                    "verified_date_of_birth": "2020-02-29",
                    "consultation_assessment_date": "2021-02-27",
                }
            )
        )
        self.assertTrue(out["safety_gate"]["d13_hard_stop_active"])

    def test_neonate_p13_a(self) -> None:
        out = evaluate_rule4_empty(
            _phase2_input(
                verified_age={
                    "verification_status": "VERIFIED",
                    "verified_date_of_birth": "2026-07-01",
                    "consultation_assessment_date": "2026-07-10",
                }
            )
        )
        self.assertEqual(out["safety_gate"]["pediatric_band"], "P13_A")
        self.assertEqual(out["safety_gate"]["prescription_status"], "BLOCKED")

    def test_under_one_with_crisis(self) -> None:
        out = evaluate_rule4_empty(
            _phase2_input(
                verified_age={
                    "verification_status": "VERIFIED",
                    "verified_date_of_birth": "2026-01-01",
                    "consultation_assessment_date": "2026-06-01",
                },
                bp_readings=[_bp(190, 80)],
            )
        )
        self.assertEqual(out["safety_gate"]["prescription_status"], "BLOCKED")
        self.assertTrue(out["safety_gate"]["patient_wide_hold"])
        self.assertEqual(out["safety_gate"]["hold_status"], "PRESCRIPTION_HOLD")

    def test_six_years_p13_d(self) -> None:
        out = evaluate_rule4_empty(
            _phase2_input(
                verified_age={
                    "verification_status": "VERIFIED",
                    "verified_date_of_birth": "2020-01-01",
                    "consultation_assessment_date": "2026-06-01",
                }
            )
        )
        self.assertEqual(out["safety_gate"]["pediatric_band"], "P13_D")

    def test_explicit_holds(self) -> None:
        out = evaluate_rule4_empty(
            _phase2_input(patient_wide_safety={"prescription_hold": True})
        )
        self.assertTrue(out["safety_gate"]["patient_wide_hold"])

    def test_source_critical(self) -> None:
        out = evaluate_rule4_empty(
            _phase2_input(
                structured_critical_findings=[
                    {
                        "critical_flag_code": "SOURCE_DECLARED_URGENT",
                        "verification_status": "VERIFIED",
                        "source_reference_id": "ev-1",
                        "source_type": "STRUCTURED_REPORT",
                        "assertion_status": "ACTIVE",
                    }
                ],
            )
        )
        self.assertTrue(out["safety_gate"]["urgent_escalation_required"])

    def test_raw_lab_non_executable(self) -> None:
        out = evaluate_rule4_empty(_phase2_input(raw_lab_keyword_present=True))
        self.assertIn("RAW_LAB_KEYWORD_NOT_EXECUTABLE", out["reason_codes"])
        self.assertFalse(out["safety_gate"]["patient_wide_hold"])
        self.assertEqual(out["safety_gate"]["safety_gate_status"], "UNRESOLVED")
        self.assertFalse(out["safety_gate"]["safety_clear_for_future_cascade"])

    def test_multi_slot_all_null(self) -> None:
        out = evaluate_rule4_empty(_phase2_input(bp_readings=[_bp(190, 80)]))
        self.assertEqual(len(out["slots"]), 2)
        self.assertTrue(all(s["selected_dilution"] is None for s in out["slots"]))

    def test_input_non_mutation(self) -> None:
        inp = _phase2_input()
        before = copy.deepcopy(inp)
        evaluate_rule4_empty(inp)
        self.assertEqual(inp, before)

    def test_deterministic_fingerprint(self) -> None:
        a = evaluate_rule4_empty(_phase2_input())
        b = evaluate_rule4_empty(_phase2_input())
        self.assertEqual(a["deterministic_fingerprint"], b["deterministic_fingerprint"])


class Rule4Phase2OrchestratorTests(unittest.TestCase):
    def setUp(self) -> None:
        self.orch = NineRuleOrchestrator()
        self.kwargs = {
            "label": "SYNTHETIC",
            "package_dir": synthetic_fixture_dir(),
            "allow_synthetic_package": True,
        }
        self.payload = {
            "chief_complaint": "SYNTHETIC fever",
            "symptoms": ["SYNTHETIC headache"],
            "formula_slots": [{"formula_slot_id": "s1", "formula_target_id": "t1"}],
        }
        self._prev = os.environ.get("RULE4_ENGINE_MODE")
        os.environ.pop("RULE4_ENGINE_MODE", None)

    def tearDown(self) -> None:
        if self._prev is None:
            os.environ.pop("RULE4_ENGINE_MODE", None)
        else:
            os.environ["RULE4_ENGINE_MODE"] = self._prev

    def test_public_response_unchanged_in_shadow(self) -> None:
        off = self.orch.orchestrate(self.payload, OrchestratorRun(**self.kwargs))
        os.environ["RULE4_ENGINE_MODE"] = "shadow"
        shadow = self.orch.orchestrate(self.payload, OrchestratorRun(**self.kwargs))
        self.assertEqual(off["output_fingerprint"], shadow["output_fingerprint"])
        self.assertNotIn("rule4_shadow", shadow)

    def test_concurrent_collectors_isolated(self) -> None:
        os.environ["RULE4_ENGINE_MODE"] = "shadow"
        a: list[dict] = []
        b: list[dict] = []

        def ca(env: dict) -> None:
            a.append(copy.deepcopy(env))

        def cb(env: dict) -> None:
            b.append(copy.deepcopy(env))

        t1 = threading.Thread(
            target=lambda: self.orch.orchestrate(
                self.payload, OrchestratorRun(**self.kwargs, rule4_shadow_collector=ca)
            )
        )
        t2 = threading.Thread(
            target=lambda: self.orch.orchestrate(
                self.payload, OrchestratorRun(**self.kwargs, rule4_shadow_collector=cb)
            )
        )
        t1.start()
        t2.start()
        t1.join()
        t2.join()
        self.assertEqual(len(a), 1)
        self.assertEqual(len(b), 1)
        self.assertIn("safety_gate", a[0]["result"])


if __name__ == "__main__":
    unittest.main()
