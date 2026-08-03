from __future__ import annotations

import hashlib
import json
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1] / "src"
REPO = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(ROOT))

from ehas2_clinical_engine.rule4.canonical_json import canonical_stable_dumps  # noqa: E402
from ehas2_clinical_engine.rule4.evaluator import evaluate_rule4_shadow_bundle  # noqa: E402
from ehas2_clinical_engine.rule4.polarity.evaluate_polarity_adapter import (  # noqa: E402
    evaluate_polarity_adapter,
)
from ehas2_clinical_engine.rule4.polarity.polarity_fingerprint_v1 import (  # noqa: E402
    build_rule4_polarity_routing_fingerprint_v1_payload,
    rule4_polarity_routing_fingerprint_v1_hash,
)
from ehas2_clinical_engine.rule4.registry_loader import load_reason_code_registry  # noqa: E402

FIXTURE = REPO / "fixtures" / "rule4" / "polarity-routing-scenarios.v1.json"


def _context_kwargs(scenario: dict) -> dict:
    ctx = scenario.get("context") or {}
    inp = scenario.get("input") or {}
    bypass = inp.get("trusted_synthetic_binding_bypass") is True
    binding_mandatory = False if bypass else ctx.get("binding_gate_mandatory", True)
    sg = ctx.get("safety_gate")
    safety_gate = None
    if sg:
        safety_gate = {
            "patient_wide_hold": sg.get("patient_wide_hold"),
            "d13_hard_stop_active": sg.get("d13_hard_stop_active"),
            "reason_codes": list(sg.get("reason_codes") or []),
            "limitation_codes": list(sg.get("limitation_codes") or []),
        }
    evidence_adapter = None
    ev = ctx.get("evidence_adapter")
    if ev:
        evidence_adapter = {
            "formula_bound_pools": [
                {
                    "formula_slot_id": p["formula_slot_id"],
                    "formula_target_id": p.get("formula_target_id"),
                    "usable_finding_ids": list(p.get("usable_finding_ids") or []),
                }
                for p in ev.get("formula_bound_pools") or []
            ]
        }
    return {
        "safety_gate": safety_gate,
        "evidence_adapter": evidence_adapter,
        "binding_gate_mandatory": binding_mandatory,
    }


class Rule4Phase4PolarityTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.fixture = json.loads(FIXTURE.read_text(encoding="utf-8"))
        cls.scenarios = cls.fixture["scenarios"]
        cls.fingerprint_refs = cls.fixture.get("fingerprintV1References") or []

    def test_fixture_has_20_plus_scenarios(self) -> None:
        self.assertGreaterEqual(len(self.scenarios), 20)
        self.assertEqual(len(self.scenarios), self.fixture["scenarioCount"])

    def test_registry_includes_phase4_codes(self) -> None:
        reg = load_reason_code_registry()
        codes = {e["code"] for e in reg["reasonCodes"]}
        self.assertIn("RULE4_POLARITY_PATHWAY_ROUTED", codes)
        self.assertIn("PHASE6_NO_NUMERIC_CASCADE", {e["code"] for e in reg["limitationCodes"]})

    def test_shared_scenario_parity(self) -> None:
        for scenario in self.scenarios:
            with self.subTest(scenario=scenario["id"]):
                out = evaluate_polarity_adapter(scenario["input"], **_context_kwargs(scenario))
                self.assertEqual(out["execution_status"], "NOT_IMPLEMENTED")
                self.assertEqual(out["current_runtime_potency_delta"], "NONE")
                for slot in out["slot_routings"]:
                    self.assertIsNone(slot["selected_cascade"])
                    self.assertIsNone(slot["selected_dilution"])
                expected = scenario["expected"]["pathways_by_slot"]
                by_slot = {r["formula_slot_id"]: r["pathway"] for r in out["slot_routings"]}
                for slot_id, pathway in expected.items():
                    self.assertEqual(by_slot.get(slot_id), pathway)

    def test_fingerprint_v1_references(self) -> None:
        self.assertGreaterEqual(len(self.fingerprint_refs), 3)
        by_scenario = {s["id"]: s for s in self.scenarios}
        for ref in self.fingerprint_refs:
            ref_id = ref.get("reference_id") or ref.get("referenceId")
            scenario_id = ref.get("scenario_id") or ref.get("scenarioId")
            with self.subTest(reference=ref_id):
                scenario = by_scenario[scenario_id]
                out = evaluate_polarity_adapter(scenario["input"], **_context_kwargs(scenario))
                payload = build_rule4_polarity_routing_fingerprint_v1_payload(
                    ruleset_version=out["ruleset_version"],
                    registry_version=out["registry_version"],
                    slot_routings=out["slot_routings"],
                    reason_codes=out["reason_codes"],
                    limitation_codes=out["limitation_codes"],
                )
                canon = canonical_stable_dumps(payload)
                canonical_payload = ref.get("canonical_payload") or ref.get("canonicalPayload")
                sha = ref.get("polarity_routing_sha256") or ref.get("polarityRoutingSha256")
                self.assertEqual(canon, canonical_payload)
                manual = hashlib.sha256(canon.encode("utf-8")).hexdigest().upper()
                self.assertEqual(manual, sha)
                self.assertEqual(
                    rule4_polarity_routing_fingerprint_v1_hash(
                        ruleset_version=out["ruleset_version"],
                        registry_version=out["registry_version"],
                        slot_routings=out["slot_routings"],
                        reason_codes=out["reason_codes"],
                        limitation_codes=out["limitation_codes"],
                    ),
                    sha,
                )
                self.assertEqual(out["deterministic_polarity_routing_fingerprint"], sha)

    def test_shadow_public_fingerprint_unchanged(self) -> None:
        scenario = next(s for s in self.scenarios if s["id"] == "valid-positive-routing")
        base_input = {
            "contract_version": "ehas2-rule4-contract-v1-phase2-safety",
            "ruleset_version": "ehas2-rule4-ruleset-v1-frozen-doc-4c35469",
            "engine_mode": "shadow",
            "label": "SYNTHETIC",
            "formula_slots": [{"formula_slot_id": "s-pos", "formula_target_id": "t-pos-1"}],
            "verified_age": {
                "verification_status": "VERIFIED",
                "verified_date_of_birth": "1990-01-01",
                "consultation_assessment_date": "2026-01-01",
            },
            "patient_wide_safety": {},
            "bp_readings": [],
        }
        without = evaluate_rule4_shadow_bundle(base_input)
        with_polarity = evaluate_rule4_shadow_bundle(
            {**base_input, "polarity_adapter": scenario["input"]}
        )
        self.assertEqual(
            without["result"]["deterministic_fingerprint"],
            with_polarity["result"]["deterministic_fingerprint"],
        )
        self.assertIsNotNone(with_polarity["polarity_routing"])
        self.assertEqual(
            with_polarity["polarity_routing"]["slot_routings"][0]["pathway"],
            "NOT_EVALUATED",
        )


if __name__ == "__main__":
    unittest.main()
