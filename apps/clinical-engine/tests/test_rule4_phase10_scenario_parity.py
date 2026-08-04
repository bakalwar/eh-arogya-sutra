from __future__ import annotations

import hashlib
import json
import unittest
from pathlib import Path

from rule4_phase10_context import (  # noqa: E402
    RULE4_DOCTOR_REVIEW_FIXTURE_SHA256,
    evaluate_doctor_review_from_fixture_scenario,
    load_doctor_review_fixture,
)


class Rule4Phase10ScenarioParity(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.fixture = load_doctor_review_fixture()

    def test_fixture_sha(self) -> None:
        repo = Path(__file__).resolve().parents[3]
        path = repo / "fixtures" / "rule4" / "doctor-review-issuance-scenarios.v1.json"
        sha = hashlib.sha256(path.read_bytes()).hexdigest().upper()
        self.assertEqual(sha, RULE4_DOCTOR_REVIEW_FIXTURE_SHA256)

    def test_scenario_count(self) -> None:
        self.assertGreaterEqual(self.fixture["scenarioCount"], 71)
        self.assertEqual(len(self.fixture["scenarios"]), self.fixture["scenarioCount"])

    def test_scenario_parity_matrix(self) -> None:
        for scenario in self.fixture["scenarios"]:
            with self.subTest(scenario_id=scenario["id"]):
                out = evaluate_doctor_review_from_fixture_scenario(scenario)
                self.assertEqual(out["execution_status"], "NOT_IMPLEMENTED")
                self.assertFalse(out["automatic_issuance_runtime"])
                self.assertFalse(out["prescription_issue_allowed"])
                self.assertTrue(out["final_doctor_approval_required"])
                expected = scenario["expected"]
                for key, val in expected.items():
                    if key == "reason_includes":
                        for code in val:
                            self.assertIn(code, out["reason_codes"])
                    elif key == "audit_event_types":
                        types = sorted(e["event_type"] for e in out.get("shadow_audit_events") or [])
                        self.assertEqual(types, sorted(val))
                    else:
                        self.assertEqual(out[key], val, msg=key)


class Rule4Phase10FingerprintParity(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.fixture = load_doctor_review_fixture()

    def test_fingerprint_references(self) -> None:
        from ehas2_clinical_engine.rule4.doctor_review.evaluate_doctor_review_adapter import (
            rule4_doctor_review_fingerprint_v1_hash,
            rule4_doctor_review_fingerprint_v1_payload,
        )

        by_id = {s["id"]: s for s in self.fixture["scenarios"]}
        for ref in self.fixture["fingerprintV1References"]:
            scenario = by_id[ref["scenario_id"]]
            out = evaluate_doctor_review_from_fixture_scenario(scenario)
            ra = scenario["input"]["reviewer_authority"]
            payload = rule4_doctor_review_fingerprint_v1_payload(
                ruleset_version=out["ruleset_version"],
                registry_version=out["registry_version"],
                doctor_action=scenario["input"]["doctor_action"],
                consultation_id=scenario["input"]["consultation_id"],
                draft_version=scenario["input"]["draft_version"],
                doctor_id=ra["doctor_id"],
                output=out,
            )
            digest = rule4_doctor_review_fingerprint_v1_hash(
                ruleset_version=out["ruleset_version"],
                registry_version=out["registry_version"],
                doctor_action=scenario["input"]["doctor_action"],
                consultation_id=scenario["input"]["consultation_id"],
                draft_version=scenario["input"]["draft_version"],
                doctor_id=ra["doctor_id"],
                output=out,
            )
            self.assertEqual(payload, ref["canonical_payload"])
            self.assertEqual(digest, ref["doctor_review_sha256"].upper())
            self.assertEqual(out["deterministic_doctor_review_fingerprint"], digest)


if __name__ == "__main__":
    unittest.main()
