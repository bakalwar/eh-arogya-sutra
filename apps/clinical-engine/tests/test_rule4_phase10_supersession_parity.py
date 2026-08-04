from __future__ import annotations

import json
import unittest
from pathlib import Path

from rule4_phase10_context import (
    evaluate_doctor_review_from_fixture_scenario,
    load_doctor_review_fixture,
)

REPO = Path(__file__).resolve().parents[3]
PHASE10_REGISTRY = (
    REPO / "fixtures" / "rule4" / "reason-code-registry.phase10-doctor-review-issuance-subset.v1.json"
)

SUPERSESSION_IDS = (
    "approval-superseded-content-hash",
    "approval-superseded-slot-removed",
    "approval-superseded-slot-added",
    "supersession-prior-approved-newer-draft",
    "supersession-expected-draft-version-stale",
    "stale-evidence-fingerprint",
    "supersession-phase8-selection-drift",
    "supersession-phase9-pediatric-drift",
    "ruleset-registry-mismatch",
)


class Rule4Phase10SupersessionMatrix(unittest.TestCase):
    def test_supersession_scenarios_block_with_audit(self) -> None:
        fixture = load_doctor_review_fixture()
        by_id = {s["id"]: s for s in fixture["scenarios"]}
        for sid in SUPERSESSION_IDS:
            with self.subTest(scenario_id=sid):
                out = evaluate_doctor_review_from_fixture_scenario(by_id[sid])
                self.assertEqual(out["issuance_eligibility_status"], "ISSUANCE_BLOCKED")
                self.assertFalse(out["prescription_issue_allowed"])
                self.assertIn("APPROVAL_SUPERSEDED", out["reason_codes"])
                types = {e["event_type"] for e in out.get("shadow_audit_events") or []}
                self.assertIn("APPROVAL_SUPERSEDED", types)

    def test_review_version_conflict_not_supersession(self) -> None:
        fixture = load_doctor_review_fixture()
        scenario = next(s for s in fixture["scenarios"] if s["id"] == "review-version-conflict")
        out = evaluate_doctor_review_from_fixture_scenario(scenario)
        self.assertIn("REVIEW_VERSION_CONFLICT", out["reason_codes"])
        self.assertNotIn("APPROVAL_SUPERSEDED", out["reason_codes"])


class Rule4Phase10RegistryEmissionCoverage(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.registry = json.loads(PHASE10_REGISTRY.read_text(encoding="utf-8"))
        cls.fixture = load_doctor_review_fixture()
        cls.emitted: set[str] = set()
        for scenario in cls.fixture["scenarios"]:
            out = evaluate_doctor_review_from_fixture_scenario(scenario)
            for code in out.get("reason_codes") or []:
                cls.emitted.add(code)
            for gate in out.get("issuance_gate_results") or []:
                for code in gate.get("reason_codes") or []:
                    cls.emitted.add(code)
            for code in out.get("limitation_codes") or []:
                cls.emitted.add(code)

    def test_all_phase10_reason_codes_emitted(self) -> None:
        for entry in self.registry["reasonCodes"]:
            with self.subTest(code=entry["code"]):
                self.assertIn(entry["code"], self.emitted)

    def test_all_phase10_limitation_codes_emitted(self) -> None:
        for entry in self.registry["limitationCodes"]:
            with self.subTest(code=entry["code"]):
                self.assertIn(entry["code"], self.emitted)


class Rule4Phase10AuditEventParity(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.fixture = load_doctor_review_fixture()

    def test_audit_event_golden_refs(self) -> None:
        from ehas2_clinical_engine.rule4.canonical_json import canonical_stable_dumps

        refs = self.fixture.get("auditEventFingerprintV1References") or []
        by_id = {s["id"]: s for s in self.fixture["scenarios"]}
        for ref in refs:
            with self.subTest(reference_id=ref["reference_id"]):
                out = evaluate_doctor_review_from_fixture_scenario(by_id[ref["scenario_id"]])
                event = next(
                    e
                    for e in out.get("shadow_audit_events") or []
                    if e["event_type"] == ref["event_type"]
                )
                canon = canonical_stable_dumps(
                    {
                        "fingerprint_version": "rule4-review-audit-event-fingerprint-v1",
                        "clinic_id": event["clinic_id"],
                        "consultation_id": event["consultation_id"],
                        "decision_fingerprint": event["decision_fingerprint"],
                        "doctor_id": event["doctor_id"],
                        "draft_version": event["draft_version"],
                        "event_type": event["event_type"],
                        "organization_id": event["organization_id"],
                        "reason_codes": sorted(event.get("reason_codes") or []),
                        "timestamp": event["timestamp"],
                    }
                )
                self.assertEqual(ref["canonical_payload"], canon)
                self.assertEqual(
                    event["audit_event_fingerprint"], ref["audit_event_sha256"].upper()
                )


if __name__ == "__main__":
    unittest.main()
