from __future__ import annotations

import sys
import unittest
from pathlib import Path

from fastapi.testclient import TestClient

ROOT = Path(__file__).resolve().parents[1] / "src"
sys.path.insert(0, str(ROOT))

from ehas2_clinical_engine.app import app  # noqa: E402


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
        self.assertEqual(body["orchestration"], "NOT_CONNECTED")
        self.assertFalse(body["phase_f_clinical_authority"])
        rule8 = next(x for x in body["rules"] if x["rule_number"] == 8)
        self.assertEqual(rule8["status"], "NOT_IMPLEMENTED")

    def test_medicine_registry_status(self) -> None:
        r = self.client.get("/status/medicine-registry")
        self.assertEqual(r.json()["canonical_count"], 39)
        self.assertEqual(r.json()["c11"], "PRESENT")
        self.assertFalse(r.json()["sqlite_seed_canonical"])


if __name__ == "__main__":
    unittest.main()
