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
    OrchestratorError,
    OrchestratorRun,
)
import ehas2_clinical_engine.rule4 as rule4_pkg  # noqa: E402
from ehas2_clinical_engine.rule4.evaluator import evaluate_rule4_empty  # noqa: E402
from ehas2_clinical_engine.rule4.mode import parse_rule4_engine_mode  # noqa: E402
from ehas2_clinical_engine.rule4.orchestrator_hook import (  # noqa: E402
    Rule4ShadowCollectorError,
    apply_rule4_orchestrator_hook,
)
from ehas2_clinical_engine.rule4.registry_paths import (  # noqa: E402
    RULE4_CLINICAL_REGISTRY_STATUS,
    RULE4_DOCUMENTATION_BASELINE_COMMIT,
    RULE4_FULL_REGISTRY_STATUS,
    RULE4_REGISTRY_COMPLETE,
    RULE4_REGISTRY_SCOPE,
    RULE4_REGISTRY_VERSION,
    RULE4_UNKNOWN_CODE_POLICY,
)
from ehas2_clinical_engine.rule4.registry_validation import (  # noqa: E402
    Rule4UnknownCodeError,
    validate_rule4_output_codes,
)

REPO_ROOT = Path(__file__).resolve().parents[3]
REGISTRY_FIXTURE = (
    REPO_ROOT / "fixtures" / "rule4" / "reason-code-registry.phase1-foundation-subset.v1.json"
)


def _synthetic_input(engine_mode: str = "shadow") -> dict:
    return {
        "contract_version": "ehas2-rule4-contract-v1-phase1",
        "case_id": "syn-case-py-1",
        "consultation_id": "syn-consult-py-1",
        "ruleset_version": "ehas2-rule4-ruleset-v1-frozen-doc-4c35469",
        "engine_mode": engine_mode,
        "label": "SYNTHETIC",
        "formula_slots": [
            {
                "formula_slot_id": "slot-1",
                "formula_target_id": "target-1",
                "structured_evidence_item_ids": ["ev-py-1"],
            }
        ],
        "verified_age": {"age_years": None, "verification_status": "MISSING"},
        "patient_wide_safety": {
            "crisis_hold": False,
            "prescription_hold": False,
            "d13_hard_stop_under_one_year": False,
        },
        "structured_evidence_item_ids": [],
    }


def _list_collector(store: list[dict]) -> callable:
    def _collect(envelope: dict) -> None:
        store.append(copy.deepcopy(envelope))

    return _collect


class Rule4Phase1Tests(unittest.TestCase):
    def test_default_mode_off(self) -> None:
        self.assertEqual(parse_rule4_engine_mode(None), "off")
        self.assertEqual(parse_rule4_engine_mode(""), "off")

    def test_unknown_mode_invalid(self) -> None:
        with self.assertRaises(ValueError):
            parse_rule4_engine_mode("not-a-mode")

    def test_empty_evaluator_not_implemented(self) -> None:
        inp = _synthetic_input("shadow")
        before = copy.deepcopy(inp)
        out = evaluate_rule4_empty(inp)
        self.assertEqual(inp, before)
        self.assertEqual(out["execution_status"], "NOT_IMPLEMENTED")
        self.assertFalse(out["automatic_potency_runtime"])
        self.assertFalse(out["automatic_prescription_issuance_runtime"])
        self.assertEqual(out["current_runtime_potency_delta"], "NONE")
        self.assertTrue(out["final_doctor_approval_required"])
        self.assertFalse(out["prescription_issue_allowed"])
        for slot in out["slots"]:
            self.assertIsNone(slot["selected_dilution"])
            self.assertEqual(slot["potency_status"], "NOT_EVALUATED")

    def test_active_mode_blocked(self) -> None:
        with self.assertRaises(Exception) as ctx:
            evaluate_rule4_empty(_synthetic_input("active"))
        self.assertIn("RULE4_ENGINE_MODE_ACTIVE_NOT_IMPLEMENTED", str(ctx.exception))

    def test_python_registry_parity_with_fixtures(self) -> None:
        phase1 = json.loads(
            (REPO_ROOT / "fixtures" / "rule4" / "reason-code-registry.phase1-foundation-subset.v1.json").read_text(
                encoding="utf-8"
            )
        )
        phase2 = json.loads(
            (REPO_ROOT / "fixtures" / "rule4" / "reason-code-registry.phase2-safety-subset.v1.json").read_text(
                encoding="utf-8"
            )
        )
        phase3 = json.loads(
            (REPO_ROOT / "fixtures" / "rule4" / "reason-code-registry.phase3-evidence-subset.v1.json").read_text(
                encoding="utf-8"
            )
        )
        reason_codes = sorted(
            r["code"] for r in phase1["reasonCodes"] + phase2["reasonCodes"] + phase3["reasonCodes"]
        )
        limitation_codes = sorted(
            r["code"] for r in phase1["limitationCodes"] + phase2["limitationCodes"] + phase3["limitationCodes"]
        )
        from ehas2_clinical_engine.rule4.evaluator import load_reason_code_registry

        loaded = load_reason_code_registry()
        self.assertEqual(sorted(r["code"] for r in loaded["reasonCodes"]), reason_codes)
        self.assertEqual(sorted(r["code"] for r in loaded["limitationCodes"]), limitation_codes)

    def test_registry_metadata_parity(self) -> None:
        registry = json.loads(REGISTRY_FIXTURE.read_text(encoding="utf-8"))
        self.assertEqual(RULE4_REGISTRY_VERSION, registry["registryVersion"])
        self.assertEqual(RULE4_REGISTRY_SCOPE, registry["scope"])
        self.assertEqual(RULE4_REGISTRY_COMPLETE, registry["complete"])
        self.assertEqual(RULE4_CLINICAL_REGISTRY_STATUS, registry["clinicalRegistryStatus"])
        self.assertEqual(RULE4_DOCUMENTATION_BASELINE_COMMIT, registry["documentationBaselineCommit"])
        self.assertEqual(RULE4_UNKNOWN_CODE_POLICY, registry["unknownCodePolicy"])
        self.assertEqual(RULE4_FULL_REGISTRY_STATUS, registry["fullRegistryStatus"])

    def test_registered_output_codes_accepted(self) -> None:
        validate_rule4_output_codes(
            {
                "reason_codes": ["SEVERITY_VALUE_MISSING"],
                "limitation_codes": ["PHASE1_NO_CLINICAL_EVALUATION"],
                "slots": [
                    {
                        "reason_codes": ["RULE4_PHASE1_EVALUATOR_NOT_IMPLEMENTED"],
                        "limitation_codes": ["PHASE1_NO_CLINICAL_EVALUATION"],
                    }
                ],
            }
        )

    def test_unknown_output_codes_rejected(self) -> None:
        with self.assertRaises(Rule4UnknownCodeError) as ctx:
            validate_rule4_output_codes({"reason_codes": ["POLARITY_CONTRADICTORY"]})
        self.assertEqual(str(ctx.exception), "RULE4_UNKNOWN_REASON_CODE")
        with self.assertRaises(Rule4UnknownCodeError) as ctx2:
            validate_rule4_output_codes({"limitation_codes": ["NOT_A_REAL_LIMITATION"]})
        self.assertEqual(str(ctx2.exception), "RULE4_UNKNOWN_LIMITATION_CODE")

    def test_package_exports_no_global_shadow_sink(self) -> None:
        self.assertNotIn("get_rule4_internal_validation_sink", rule4_pkg.__all__)
        self.assertNotIn("clear_rule4_internal_validation_sink", rule4_pkg.__all__)
        self.assertFalse(hasattr(rule4_pkg, "get_rule4_internal_validation_sink"))


class Rule4OrchestratorHookTests(unittest.TestCase):
    def setUp(self) -> None:
        self.orch = NineRuleOrchestrator()
        self.base_run_kwargs = {
            "label": "SYNTHETIC",
            "package_dir": synthetic_fixture_dir(),
            "allow_synthetic_package": True,
        }
        self.payload = {
            "chief_complaint": "SYNTHETIC fever",
            "symptoms": ["SYNTHETIC headache"],
            "formula_slots": [{"formula_slot_id": "s1", "formula_target_id": "t1"}],
        }
        self._prev_mode = os.environ.get("RULE4_ENGINE_MODE")
        os.environ.pop("RULE4_ENGINE_MODE", None)

    def tearDown(self) -> None:
        if self._prev_mode is None:
            os.environ.pop("RULE4_ENGINE_MODE", None)
        else:
            os.environ["RULE4_ENGINE_MODE"] = self._prev_mode

    def test_off_mode_collector_not_invoked(self) -> None:
        captured: list[dict] = []
        run = OrchestratorRun(**self.base_run_kwargs, rule4_shadow_collector=_list_collector(captured))
        result = self.orch.orchestrate(self.payload, run)
        self.assertNotIn("rule4_shadow", result)
        self.assertEqual(captured, [])

    def test_shadow_public_response_matches_off_baseline(self) -> None:
        off = self.orch.orchestrate(self.payload, OrchestratorRun(**self.base_run_kwargs))
        os.environ["RULE4_ENGINE_MODE"] = "shadow"
        shadow_public = self.orch.orchestrate(self.payload, OrchestratorRun(**self.base_run_kwargs))
        self.assertNotIn("rule4_shadow", shadow_public)
        self.assertEqual(off["output_fingerprint"], shadow_public["output_fingerprint"])
        self.assertEqual(off["prescription"], shadow_public["prescription"])

    def test_shadow_without_collector_no_retention(self) -> None:
        os.environ["RULE4_ENGINE_MODE"] = "shadow"
        self.orch.orchestrate(self.payload, OrchestratorRun(**self.base_run_kwargs))

    def test_shadow_injected_collector_receives_one_envelope(self) -> None:
        os.environ["RULE4_ENGINE_MODE"] = "shadow"
        captured: list[dict] = []
        run = OrchestratorRun(**self.base_run_kwargs, rule4_shadow_collector=_list_collector(captured))
        self.orch.orchestrate(self.payload, run)
        self.assertEqual(len(captured), 1)
        self.assertEqual(captured[0]["label"], "RULE4_SHADOW_PHASE2")
        shadow = captured[0]["result"]
        self.assertEqual(shadow["execution_status"], "NOT_IMPLEMENTED")
        for slot in shadow["slots"]:
            self.assertIsNone(slot["selected_dilution"])

    def test_sequential_shadow_collectors_isolated(self) -> None:
        os.environ["RULE4_ENGINE_MODE"] = "shadow"
        first: list[dict] = []
        second: list[dict] = []
        self.orch.orchestrate(
            self.payload,
            OrchestratorRun(**self.base_run_kwargs, rule4_shadow_collector=_list_collector(first)),
        )
        self.orch.orchestrate(
            self.payload,
            OrchestratorRun(**self.base_run_kwargs, rule4_shadow_collector=_list_collector(second)),
        )
        self.assertEqual(len(first), 1)
        self.assertEqual(len(second), 1)
        self.assertIsNot(first[0], second[0])

    def test_shadow_fingerprint_deterministic_via_collector(self) -> None:
        os.environ["RULE4_ENGINE_MODE"] = "shadow"
        runs: list[dict] = []

        def grab(env: dict) -> None:
            runs.append(env)

        self.orch.orchestrate(
            self.payload,
            OrchestratorRun(**self.base_run_kwargs, rule4_shadow_collector=grab),
        )
        self.orch.orchestrate(
            self.payload,
            OrchestratorRun(**self.base_run_kwargs, rule4_shadow_collector=grab),
        )
        fp1 = runs[0]["result"]["deterministic_fingerprint"]
        fp2 = runs[1]["result"]["deterministic_fingerprint"]
        self.assertEqual(fp1, fp2)

    def test_concurrent_shadow_collectors_no_cross_leakage(self) -> None:
        os.environ["RULE4_ENGINE_MODE"] = "shadow"
        store_a: list[str] = []
        store_b: list[str] = []
        barrier = threading.Barrier(2)
        errors: list[BaseException] = []

        def worker(tag: str, store: list[str]) -> None:
            try:

                def collect(_env: dict) -> None:
                    store.append(tag)

                run = OrchestratorRun(
                    **self.base_run_kwargs,
                    rule4_shadow_collector=collect,
                )
                barrier.wait()
                self.orch.orchestrate(self.payload, run)
            except BaseException as exc:
                errors.append(exc)

        t1 = threading.Thread(target=worker, args=("A", store_a))
        t2 = threading.Thread(target=worker, args=("B", store_b))
        t1.start()
        t2.start()
        t1.join()
        t2.join()
        self.assertEqual(errors, [])
        self.assertEqual(store_a, ["A"])
        self.assertEqual(store_b, ["B"])

    def test_collector_failure_typed_not_swallowed(self) -> None:
        os.environ["RULE4_ENGINE_MODE"] = "shadow"

        def bad_collector(_env: dict) -> None:
            raise RuntimeError("must not leak")

        run = OrchestratorRun(**self.base_run_kwargs, rule4_shadow_collector=bad_collector)
        with self.assertRaises(OrchestratorError) as ctx:
            self.orch.orchestrate(self.payload, run)
        self.assertIn("RULE4_SHADOW_COLLECTOR_FAILED", str(ctx.exception))

    def test_collector_rule4_shadow_collector_error_passthrough(self) -> None:
        os.environ["RULE4_ENGINE_MODE"] = "shadow"

        def reject(_env: dict) -> None:
            raise Rule4ShadowCollectorError("RULE4_SHADOW_COLLECTOR_REJECTED")

        run = OrchestratorRun(**self.base_run_kwargs, rule4_shadow_collector=reject)
        with self.assertRaises(OrchestratorError) as ctx:
            self.orch.orchestrate(self.payload, run)
        self.assertIn("RULE4_SHADOW_COLLECTOR_REJECTED", str(ctx.exception))

    def test_active_mode_orchestrator_blocked(self) -> None:
        os.environ["RULE4_ENGINE_MODE"] = "active"
        with self.assertRaises(OrchestratorError) as ctx:
            self.orch.orchestrate(self.payload, OrchestratorRun(**self.base_run_kwargs))
        self.assertIn("RULE4_ENGINE_MODE_ACTIVE_NOT_IMPLEMENTED", str(ctx.exception))

    def test_hook_off_does_not_call_collector(self) -> None:
        captured: list[dict] = []
        public = {"output_fingerprint": "abc"}
        out = apply_rule4_orchestrator_hook(
            public,
            self.payload,
            shadow_collector=_list_collector(captured),
        )
        self.assertIs(out, public)
        self.assertEqual(captured, [])


if __name__ == "__main__":
    unittest.main()
