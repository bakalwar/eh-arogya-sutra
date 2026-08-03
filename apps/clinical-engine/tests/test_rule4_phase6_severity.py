"""Rule 4 Phase 6 structured severity adapter tests."""

from __future__ import annotations

import hashlib
import json
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1] / "src"
REPO = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(ROOT))

from ehas2_clinical_engine.rule4.severity.evaluate_severity_adapter import (  # noqa: E402
    evaluate_severity_adapter,
)
from ehas2_clinical_engine.rule4.severity.severity_fingerprint_v1 import (  # noqa: E402
    rule4_severity_resolution_fingerprint_v1_hash,
    rule4_severity_resolution_fingerprint_v1_payload,
)
from ehas2_clinical_engine.rule4.severity.severity_scale import (  # noqa: E402
    band_from_score,
    is_valid_integer_score,
)

FIXTURE = REPO / "fixtures" / "rule4" / "severity-resolution-scenarios.v1.json"


def _context_kwargs(scenario: dict) -> dict:
    ctx = scenario.get("context") or {}
    inp = scenario.get("input") or {}
    bypass = inp.get("trusted_synthetic_binding_bypass") is True
    mandatory = False if bypass else ctx.get("binding_gate_mandatory", True)
    return {
        "safety_gate": ctx.get("safety_gate"),
        "evidence_adapter": ctx.get("evidence_adapter"),
        "polarity_routing": ctx.get("polarity_routing"),
        "phase_resolution": ctx.get("phase_resolution"),
        "binding_gate_mandatory": mandatory,
    }


def _slot_view(out: dict, slot_id: str | None = None) -> dict:
    slots = out["slot_resolutions"]
    sid = slot_id or slots[0]["formula_slot_id"]
    s = next(x for x in slots if x["formula_slot_id"] == sid)
    return s


class Rule4Phase6ScaleTests(unittest.TestCase):
    def test_integer_scale(self) -> None:
        self.assertTrue(is_valid_integer_score(5))
        self.assertFalse(is_valid_integer_score(0))
        self.assertEqual(band_from_score(5), "MODERATE")


class Rule4Phase6ScenarioTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.fixture = json.loads(FIXTURE.read_text(encoding="utf-8"))
        cls.scenarios = cls.fixture["scenarios"]

    def test_scenario_count(self) -> None:
        self.assertGreaterEqual(self.fixture["scenarioCount"], 63)
        self.assertEqual(len(self.scenarios), self.fixture["scenarioCount"])

    def test_fixture_fingerprint_refs(self) -> None:
        for ref in self.fixture["fingerprintV1References"]:
            scenario = next(s for s in self.scenarios if s["id"] == ref["scenario_id"])
            out = evaluate_severity_adapter(scenario["input"], **_context_kwargs(scenario))
            digest = rule4_severity_resolution_fingerprint_v1_hash(
                ruleset_version=out["ruleset_version"],
                registry_version=out["registry_version"],
                slot_resolutions=out["slot_resolutions"],
                reason_codes=out["reason_codes"],
                limitation_codes=out["limitation_codes"],
            )
            self.assertEqual(digest, ref["severity_resolution_sha256"])
            payload = rule4_severity_resolution_fingerprint_v1_payload(
                ruleset_version=out["ruleset_version"],
                registry_version=out["registry_version"],
                slot_resolutions=out["slot_resolutions"],
                reason_codes=out["reason_codes"],
                limitation_codes=out["limitation_codes"],
            )
            self.assertEqual(payload, ref["canonical_payload"])

    def test_scenario_parity(self) -> None:
        for scenario in self.scenarios:
            out = evaluate_severity_adapter(scenario["input"], **_context_kwargs(scenario))
            self.assertEqual(out["execution_status"], "NOT_IMPLEMENTED")
            self.assertFalse(out["automatic_severity_runtime"])
            exp = scenario["expected"]
            slot_id = exp.get("formula_slot_id")
            view = _slot_view(out, slot_id)
            for key, expected in exp.items():
                if key == "formula_slot_id":
                    continue
                if key == "reason_includes":
                    for code in expected:
                        self.assertIn(code, view["reason_codes"])
                elif key == "limitation_includes":
                    for code in expected:
                        self.assertIn(code, view["limitation_codes"])
                else:
                    self.assertEqual(view[key], expected, scenario["id"])


class Rule4Phase6FixtureShaTests(unittest.TestCase):
    FIXTURE_SHA256 = "6299440860A3D67E8CC7BED89DADE0E5BC81071FC5114F4F68BCEF34E4F0A30C"

    def test_fixture_sha(self) -> None:
        digest = hashlib.sha256(FIXTURE.read_bytes()).hexdigest().upper()
        self.assertEqual(digest, self.FIXTURE_SHA256)


class Rule4Phase6RegistryTests(unittest.TestCase):
    def test_merged_registry_head_is_phase6(self) -> None:
        from ehas2_clinical_engine.rule4.registry_loader import load_reason_code_registry

        reg = load_reason_code_registry()
        self.assertEqual(reg["scope"], "PHASE6_STRUCTURED_SEVERITY_SUBSET")
        codes = {e["code"] for e in reg["reasonCodes"]}
        self.assertIn("CROSS_ACUTE_CHRONIC_SEVERITY_LEAKAGE_BLOCKED", codes)


if __name__ == "__main__":
    unittest.main()
