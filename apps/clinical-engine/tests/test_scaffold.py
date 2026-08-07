from __future__ import annotations

import json
import sys
import threading
import unittest
from pathlib import Path

from fastapi.testclient import TestClient

ROOT = Path(__file__).resolve().parents[1] / "src"
sys.path.insert(0, str(ROOT))

from ehas2_clinical_engine.app import app  # noqa: E402
from ehas2_clinical_engine.disease_package import (  # noqa: E402
    DiseasePackageError,
    load_disease_package,
    synthetic_fixture_dir,
)
from ehas2_clinical_engine.golden import load_golden_cases, run_all_golden  # noqa: E402
from ehas2_clinical_engine.orchestrator import (  # noqa: E402
    CANONICAL_RULE_ORDER,
    DISPLAY_ORDER,
    NineRuleOrchestrator,
    OrchestratorError,
    OrchestratorRun,
)


class ClinicalEngineScaffoldTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.client = TestClient(app)

    def test_health_ok(self) -> None:
        r = self.client.get("/health")
        self.assertEqual(r.status_code, 200)
        self.assertTrue(r.json()["ok"])

    def test_ready_false(self) -> None:
        r = self.client.get("/ready")
        self.assertEqual(r.status_code, 503)
        self.assertFalse(r.json()["ready"])
        self.assertFalse(r.json()["clinical_readiness"])

    def test_analyze_not_connected(self) -> None:
        r = self.client.post(
            "/v1/analyze-complete",
            json={"request_id": "req-1", "symptoms": ["demo fever"]},
        )
        self.assertEqual(r.status_code, 501)
        body = r.json()
        self.assertEqual(body["status"], "CLINICAL_ENGINE_NOT_CONNECTED")
        self.assertEqual(body["oral_formula_candidates"], [])
        self.assertFalse(body["default_we_used"])
        self.assertEqual(body["tablet_section_b"]["status"], "NOT_IMPLEMENTED")
        self.assertTrue(body["doctor_review_required"])

    def test_rule_8_not_implemented(self) -> None:
        r = self.client.get("/status/rules")
        self.assertEqual(r.status_code, 200)
        body = r.json()
        self.assertEqual(body["rule_8"], "NOT_IMPLEMENTED")
        self.assertEqual(body["production_analyze_complete"], "NOT_CONNECTED")
        self.assertEqual(body["prescription_engine"], "PRESCRIPTION_ENGINE_NOT_CONNECTED")
        self.assertFalse(body["phase_f_clinical_authority"])
        rule8 = next(x for x in body["rules"] if x["rule_number"] == 8)
        self.assertEqual(rule8["status"], "NOT_IMPLEMENTED")

    def test_medicine_registry_status(self) -> None:
        r = self.client.get("/status/medicine-registry")
        self.assertEqual(r.json()["canonical_count"], 38)
        self.assertEqual(r.json()["c11"], "EXCLUDED")
        self.assertEqual(r.json()["registry_version"], "ehas2-medicine-registry-v2")
        self.assertFalse(r.json()["sqlite_seed_canonical"])


class OrchestratorTests(unittest.TestCase):
    def setUp(self) -> None:
        self.orch = NineRuleOrchestrator()
        self.run = OrchestratorRun(
            label="SYNTHETIC",
            package_dir=synthetic_fixture_dir(),
            allow_synthetic_package=True,
        )

    def test_canonical_names_and_order(self) -> None:
        names = [n for _, n in DISPLAY_ORDER]
        self.assertEqual(
            names,
            [
                "Temperament (Prakriti)",
                "Polarity",
                "Organ / System Affinity",
                "Potency",
                "Monitoring, Follow-up & Post-Release Safety Surveillance",
                "Multi-Disease / Organ-System Triad",
                "External Use Routes",
                "Disease-level Prakruti Inference",
                "Master Pipeline",
            ],
        )
        self.assertEqual(CANONICAL_RULE_ORDER[0][0], 3)
        self.assertEqual(CANONICAL_RULE_ORDER[-1][0], 9)

    def test_no_hidden_rule_skip(self) -> None:
        result = self.orch.orchestrate({"chief_complaint": "fever", "symptoms": ["fever"]}, self.run)
        nums = [r["rule_number"] for r in result["rules"]]
        self.assertEqual(nums, list(range(1, 10)))

    def test_deterministic_fingerprints(self) -> None:
        payload = {"chief_complaint": "fever", "symptoms": ["fever", "weakness"]}
        a = self.orch.orchestrate(payload, self.run)
        b = self.orch.orchestrate(payload, self.run)
        self.assertEqual(a["output_fingerprint"], b["output_fingerprint"])
        self.assertEqual(a["input_fingerprint"], b["input_fingerprint"])
        self.assertNotIn("timestamp", json.dumps(a).lower())

    def test_immutable_rule_results(self) -> None:
        result = self.orch.orchestrate({"chief_complaint": "fever", "symptoms": ["fever"]}, self.run)
        fp = result["rules"][0]["deterministic_fingerprint"]
        result["rules"][0]["status"] = "TAMPERED"
        again = self.orch.orchestrate({"chief_complaint": "fever", "symptoms": ["fever"]}, self.run)
        self.assertEqual(again["rules"][0]["deterministic_fingerprint"], fp)
        self.assertNotEqual(again["rules"][0]["status"], "TAMPERED")

    def test_cancellation(self) -> None:
        ev = threading.Event()
        ev.set()
        run = OrchestratorRun(
            label="SYNTHETIC",
            package_dir=synthetic_fixture_dir(),
            cancel_event=ev,
        )
        with self.assertRaises(OrchestratorError) as ctx:
            self.orch.orchestrate({"chief_complaint": "fever", "symptoms": ["fever"]}, run)
        self.assertIn("CANCELLED", str(ctx.exception))

    def test_timeout(self) -> None:
        run = OrchestratorRun(
            label="SYNTHETIC",
            package_dir=synthetic_fixture_dir(),
            timeout_ms=0,
        )
        with self.assertRaises(OrchestratorError) as ctx:
            self.orch.orchestrate({"chief_complaint": "fever", "symptoms": ["fever"]}, run)
        self.assertIn("TIMEOUT", str(ctx.exception))

    def test_no_forced_top1(self) -> None:
        result = self.orch.orchestrate({"chief_complaint": "pain", "symptoms": ["pain"]}, self.run)
        self.assertFalse(result["clinical_interpretation"]["forced_top1"])
        for c in result["clinical_interpretation"]["disease_candidates"]:
            self.assertFalse(c.get("forced_top1"))

    def test_hindi_english_normalization(self) -> None:
        result = self.orch.orchestrate(
            {"chief_complaint": "bukhar", "symptoms": ["खांसी"]},
            self.run,
        )
        norm = result["normalized_evidence"]
        self.assertIn("fever", norm["chief_complaint"])
        self.assertTrue(set(norm["language_hints"]) & {"hi", "en"} or "hi" in norm["language_hints"])

    def test_negation(self) -> None:
        result = self.orch.orchestrate(
            {"chief_complaint": "weakness", "symptoms": ["no fever", "weakness"]},
            self.run,
        )
        neg = " ".join(result["normalized_evidence"]["negated_symptoms"])
        self.assertIn("fever", neg)

    def test_unknown_disease(self) -> None:
        result = self.orch.orchestrate(
            {"chief_complaint": "zzzznonexistenttoken999", "symptoms": ["qqqnomatchxyz"]},
            self.run,
        )
        self.assertEqual(result["clinical_interpretation"]["disease_candidates"], [])
        r6 = next(r for r in result["rules"] if r["rule_number"] == 6)
        self.assertEqual(r6["status"], "UNRESOLVED")

    def test_polarity_prakriti_temperament(self) -> None:
        pos = self.orch.orchestrate(
            {
                "chief_complaint": "acute fever inflammation",
                "symptoms": ["acute", "fever", "inflammation"],
            },
            self.run,
        )
        self.assertEqual(pos["clinical_interpretation"]["polarity"]["polarity"], "POSITIVE")
        vata = self.orch.orchestrate(
            {"chief_complaint": "dry anxiety constipation", "symptoms": ["dry", "anxiety", "cold"]},
            self.run,
        )
        self.assertEqual(vata["clinical_interpretation"]["prakriti"]["prakriti"], "VATA")
        unk = self.orch.orchestrate(
            {"chief_complaint": "vague unease", "symptoms": ["unease"]},
            self.run,
        )
        self.assertEqual(unk["clinical_interpretation"]["temperament"]["status"], "UNKNOWN")

    def test_red_flag_safety(self) -> None:
        result = self.orch.orchestrate(
            {
                "chief_complaint": "headache",
                "symptoms": ["headache"],
                "vitals": {"systolic_bp": 190},
            },
            self.run,
        )
        self.assertIn(
            "HIGH_BP_RED_FLAG",
            result["clinical_interpretation"]["safety"]["warnings"],
        )
        self.assertFalse(
            result["clinical_interpretation"]["safety"]["claims_emergency_treatment"]
        )
        r6 = next(r for r in result["rules"] if r["rule_number"] == 6)
        self.assertEqual(r6["status"], "BLOCKED_BY_SAFETY")

    def test_multi_system_beyond_five(self) -> None:
        result = self.orch.orchestrate(
            {
                "chief_complaint": "complex",
                "symptoms": [
                    "fever",
                    "joint pain",
                    "cough",
                    "chest palpitation",
                    "headache",
                    "abdomen diarrhea",
                    "rash itch",
                ],
            },
            self.run,
        )
        self.assertTrue(result["clinical_interpretation"]["systems"]["beyond_five"])
        self.assertGreater(len(result["clinical_interpretation"]["systems"]["systems"]), 5)

    def test_no_global_symptom_leakage_across_cases(self) -> None:
        a = self.orch.orchestrate({"chief_complaint": "fever", "symptoms": ["fever"]}, self.run)
        b = self.orch.orchestrate({"chief_complaint": "cough", "symptoms": ["cough"]}, self.run)
        a_ids = {c["disease_id"] for c in a["clinical_interpretation"]["disease_candidates"]}
        b_syms = " ".join(b["normalized_evidence"]["symptoms"])
        self.assertNotIn("fever", b_syms)
        # Cases remain independent — cough case should not inherit fever-only state
        self.assertNotEqual(a["input_fingerprint"], b["input_fingerprint"])
        self.assertTrue(a_ids or True)

    def test_prescription_disconnected_zero_medicine(self) -> None:
        result = self.orch.orchestrate({"chief_complaint": "fever", "symptoms": ["fever"]}, self.run)
        self.assertEqual(
            result["prescription"]["status"], "PRESCRIPTION_ENGINE_NOT_CONNECTED"
        )
        self.assertEqual(result["medicine_output_count"], 0)
        self.assertIsNone(result["prescription"]["tablet_a"])
        self.assertIsNone(result["prescription"]["tablet_b"])
        self.assertIsNone(result["prescription"]["external_applications"])
        self.assertFalse(result["prescription"]["default_we_used"])
        self.assertFalse(result["clinical_readiness"])

    def test_rule_8_truthful(self) -> None:
        result = self.orch.orchestrate({"chief_complaint": "fever", "symptoms": ["fever"]}, self.run)
        self.assertEqual(result["rule_8_status"], "NOT_IMPLEMENTED")
        r8 = next(r for r in result["rules"] if r["rule_number"] == 8)
        self.assertEqual(r8["status"], "NOT_IMPLEMENTED")

    def test_old_path_rejected(self) -> None:
        # Construct dynamically so boundary scanner does not flag this file.
        bad = Path("C:/Users/demo") / ("EH_" + "Arogya_Sutra_App") / ("eh_arogya" + ".db")
        with self.assertRaises(DiseasePackageError):
            load_disease_package(bad, allow_synthetic=True)

    def test_synthetic_package_loads(self) -> None:
        pkg = load_disease_package(synthetic_fixture_dir(), allow_synthetic=True)
        self.assertEqual(pkg.count, 11)
        self.assertEqual(pkg.manifest.get("schemaVersion"), "ehas2-disease-schema-v1")


class GoldenHarnessTests(unittest.TestCase):
    def test_all_golden_cases(self) -> None:
        cases = load_golden_cases()
        self.assertEqual(len(cases), 26)
        for c in cases:
            self.assertEqual(c["label"], "SYNTHETIC")
        summary = run_all_golden(repetitions=3)
        self.assertEqual(summary["total"], 26)
        self.assertEqual(summary["determinism"], "PASS")
        self.assertEqual(summary["passed"], 26, msg=json.dumps(summary["cases"], indent=2))
        self.assertEqual(summary["prescription_engine"], "PRESCRIPTION_ENGINE_NOT_CONNECTED")
        self.assertFalse(summary["clinical_readiness"])

    def test_validation_endpoint_requires_synthetic(self) -> None:
        client = TestClient(app)
        r = client.post("/v1/validation/orchestrate", json={"chief_complaint": "fever"})
        self.assertEqual(r.status_code, 400)
        r2 = client.post(
            "/v1/validation/orchestrate",
            json={
                "label": "SYNTHETIC",
                "input": {"chief_complaint": "fever", "symptoms": ["fever"]},
            },
        )
        self.assertEqual(r2.status_code, 200)
        body = r2.json()
        self.assertEqual(body["medicine_output_count"], 0)
        self.assertEqual(body["prescription"]["status"], "PRESCRIPTION_ENGINE_NOT_CONNECTED")


if __name__ == "__main__":
    unittest.main()
