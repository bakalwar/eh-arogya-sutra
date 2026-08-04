from __future__ import annotations

import unittest

from rule4_phase10_context import evaluate_doctor_review_from_fixture_scenario, load_doctor_review_fixture


class Rule4Phase10AuthenticityAudit(unittest.TestCase):
    def test_missing_expected_authenticity_blocked(self) -> None:
        fixture = load_doctor_review_fixture()
        scenario = next(s for s in fixture["scenarios"] if s["id"] == "missing-expected-authenticity-blocked")
        out = evaluate_doctor_review_from_fixture_scenario(scenario)
        self.assertEqual(out["issuance_eligibility_status"], "ISSUANCE_BLOCKED")
        self.assertIn("EXPECTED_DRAFT_AUTHENTICITY_MISSING", out["reason_codes"])
        self.assertFalse(out["prescription_issue_allowed"])
        events = {e["event_type"] for e in out.get("shadow_audit_events") or []}
        self.assertIn("ISSUANCE_BLOCKED", events)

    def test_approval_superseded_emits_code_and_event(self) -> None:
        fixture = load_doctor_review_fixture()
        scenario = next(s for s in fixture["scenarios"] if s["id"] == "approval-superseded-content-hash")
        out = evaluate_doctor_review_from_fixture_scenario(scenario)
        self.assertIn("APPROVAL_SUPERSEDED", out["reason_codes"])
        events = {e["event_type"] for e in out.get("shadow_audit_events") or []}
        self.assertIn("APPROVAL_SUPERSEDED", events)

    def test_valid_adult_still_eligible_with_binding(self) -> None:
        fixture = load_doctor_review_fixture()
        scenario = next(s for s in fixture["scenarios"] if s["id"] == "valid-adult-approve")
        out = evaluate_doctor_review_from_fixture_scenario(scenario)
        self.assertEqual(out["issuance_eligibility_status"], "ISSUANCE_ELIGIBLE")
        events = {e["event_type"] for e in out.get("shadow_audit_events") or []}
        self.assertIn("APPROVAL_RECORDED", events)


if __name__ == "__main__":
    unittest.main()
