"""Rule 4 Phase 8 numeric selection shared-fixture scenario parity (read-only JSON)."""

from __future__ import annotations

import hashlib
import json
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1] / "src"
REPO = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(ROOT))

from ehas2_clinical_engine.rule4.selection.evaluate_selection_adapter import (  # noqa: E402
    evaluate_selection_adapter,
)
from ehas2_clinical_engine.rule4.selection.selection_fingerprint_v1 import (  # noqa: E402
    rule4_numeric_selection_fingerprint_v1_hash,
    rule4_numeric_selection_fingerprint_v1_payload,
)

FIXTURE = REPO / "fixtures" / "rule4" / "numeric-selection-scenarios.v1.json"
FIXTURE_SHA256 = (
    "6AC12D4B8BA6E6CA71A1F0EB2DC6A80B995632239E407723711F6B4065788E40"
)

SLOT_SCALAR_KEYS = frozenset(
    {
        "selection_status",
        "selected_cascade",
        "selected_dilution",
        "selection_basis",
        "eligible_family_consumed",
        "tie_break_status",
        "fallback_status",
        "pre_pediatric_overlay_status",
    }
)


def _fixture_bytes_sha() -> str:
    return hashlib.sha256(FIXTURE.read_bytes()).hexdigest().upper()


def _context_dict(scenario: dict) -> dict:
    ctx = scenario.get("context") or {}
    mapped: dict = {
        "safety_gate": ctx.get("safety_gate"),
        "verified_age": ctx.get("verified_age"),
        "eligibility_resolution": ctx.get("eligibility_resolution"),
        "binding_gate_mandatory": ctx.get("binding_gate_mandatory", True),
    }
    if ctx.get("evidence_items") is not None:
        mapped["evidence_items"] = ctx["evidence_items"]
    if ctx.get("evidence_resolution") is not None:
        mapped["evidence_adapter"] = ctx["evidence_resolution"]
    return mapped


def _slot_view(out: dict, slot_id: str | None = None) -> dict:
    slot = next(
        (s for s in out["slot_resolutions"] if s["formula_slot_id"] == (slot_id or "s1")),
        None,
    )
    if slot is None:
        return {}
    return {
        "selection_status": slot["selection_status"],
        "selected_cascade": slot.get("selected_cascade"),
        "selected_dilution": slot.get("selected_dilution"),
        "selection_basis": slot.get("selection_basis"),
        "eligible_family_consumed": slot.get("eligible_family_consumed"),
        "tie_break_status": slot["tie_break_status"],
        "fallback_status": slot["fallback_status"],
        "pre_pediatric_overlay_status": slot["pre_pediatric_overlay_status"],
        "reason_codes": list(slot.get("reason_codes") or []),
        "limitation_codes": list(slot.get("limitation_codes") or []),
    }


class Rule4Phase8FixtureImmutabilityTests(unittest.TestCase):
    def test_fixture_sha256_stable(self) -> None:
        self.assertEqual(_fixture_bytes_sha(), FIXTURE_SHA256)


class Rule4Phase8ScenarioParityTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.fixture_sha_before = _fixture_bytes_sha()
        cls.fixture = json.loads(FIXTURE.read_text(encoding="utf-8"))
        cls.scenarios = cls.fixture["scenarios"]

    @classmethod
    def tearDownClass(cls) -> None:
        digest = _fixture_bytes_sha()
        assert digest == cls.fixture_sha_before
        assert digest == FIXTURE_SHA256

    def test_scenario_count_metadata(self) -> None:
        self.assertGreaterEqual(self.fixture["scenarioCount"], 60)
        self.assertEqual(len(self.scenarios), self.fixture["scenarioCount"])

    def test_scenario_parity_all(self) -> None:
        for scenario in self.scenarios:
            out = evaluate_selection_adapter(scenario["input"], _context_dict(scenario))
            self.assertEqual(out["execution_status"], "NOT_IMPLEMENTED")
            self.assertFalse(out["automatic_numeric_potency_runtime"])
            self.assertFalse(out["prescription_issue_allowed"])
            self.assertTrue(out["final_doctor_approval_required"])
            view = _slot_view(out, scenario["expected"].get("formula_slot_id"))
            for key, expected in scenario["expected"].items():
                if key == "formula_slot_id":
                    continue
                if key == "reason_includes":
                    for code in expected:
                        self.assertIn(code, view["reason_codes"], scenario["id"])
                    continue
                self.assertEqual(view.get(key), expected, f"{scenario['id']} {key}")


class Rule4Phase8FingerprintReferenceTests(unittest.TestCase):
    def test_fingerprint_v1_references(self) -> None:
        fixture = json.loads(FIXTURE.read_text(encoding="utf-8"))
        for ref in fixture["fingerprintV1References"]:
            scenario = next(s for s in fixture["scenarios"] if s["id"] == ref["scenario_id"])
            out = evaluate_selection_adapter(scenario["input"], _context_dict(scenario))
            elig = (scenario.get("context") or {}).get("eligibility_resolution")
            upstream = (
                elig.get("deterministic_candidate_eligibility_fingerprint") if elig else None
            )
            digest = rule4_numeric_selection_fingerprint_v1_hash(
                ruleset_version=out["ruleset_version"],
                registry_version=out["registry_version"],
                upstream_eligibility_fingerprint=upstream,
                slot_resolutions=list(out["slot_resolutions"]),
                reason_codes=list(out["reason_codes"]),
                limitation_codes=list(out["limitation_codes"]),
            )
            self.assertEqual(digest, ref["numeric_selection_sha256"])
            payload = rule4_numeric_selection_fingerprint_v1_payload(
                ruleset_version=out["ruleset_version"],
                registry_version=out["registry_version"],
                upstream_eligibility_fingerprint=upstream,
                slot_resolutions=list(out["slot_resolutions"]),
                reason_codes=list(out["reason_codes"]),
                limitation_codes=list(out["limitation_codes"]),
            )
            self.assertEqual(payload, ref["canonical_payload"])


if __name__ == "__main__":
    unittest.main()
