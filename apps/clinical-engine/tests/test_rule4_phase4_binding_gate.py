from __future__ import annotations

import json
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1] / "src"
REPO = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(ROOT))

from ehas2_clinical_engine.rule4.evaluator import evaluate_rule4_shadow_bundle  # noqa: E402
from ehas2_clinical_engine.rule4.polarity.evaluate_polarity_adapter import (  # noqa: E402
    Rule4PolarityAdapterValidationError,
    evaluate_polarity_adapter,
)
from ehas2_clinical_engine.rule4.registry_paths import (  # noqa: E402
    RULE4_CONTRACT_VERSION_PHASE4_POLARITY,
)

RULESET = "ehas2-rule4-ruleset-v1-frozen-doc-4c35469"
REGISTRY = "rule4-reason-codes-phase4-polarity-subset-v1"

BASE_RECORD = {
    "formula_slot_id": "s1",
    "formula_target_id": "t1",
    "rule2_record_id": "r2-1",
    "disease_polarity": "POSITIVE",
    "required_therapeutic_polarity": "NEGATIVE",
    "resolution_status": "RESOLVED",
}


def _polarity_input(**overrides) -> dict:
    base = {
        "contract_version": RULE4_CONTRACT_VERSION_PHASE4_POLARITY,
        "ruleset_version": RULESET,
        "registry_version": REGISTRY,
        "label": "SYNTHETIC",
        "formula_slot_ids": ["s1"],
        "formula_polarities": [BASE_RECORD],
    }
    base.update(overrides)
    return base


EVIDENCE_EXACT = {
    "formula_bound_pools": [
        {
            "formula_slot_id": "s1",
            "formula_target_id": "t1",
            "usable_finding_ids": ["f1"],
        }
    ]
}


class Rule4Phase4BindingGateTests(unittest.TestCase):
    def test_shadow_polarity_without_evidence_no_group(self) -> None:
        base = {
            "contract_version": "ehas2-rule4-contract-v1-phase2-safety",
            "ruleset_version": RULESET,
            "engine_mode": "shadow",
            "label": "SYNTHETIC",
            "formula_slots": [{"formula_slot_id": "s1", "formula_target_id": "t1"}],
            "verified_age": {
                "verification_status": "VERIFIED",
                "verified_date_of_birth": "1990-01-01",
                "consultation_assessment_date": "2026-01-01",
            },
            "patient_wide_safety": {},
            "bp_readings": [],
            "polarity_adapter": _polarity_input(),
        }
        bundle = evaluate_rule4_shadow_bundle(base)
        self.assertEqual(bundle["polarity_routing"]["slot_routings"][0]["pathway"], "NOT_EVALUATED")

    def test_production_without_evidence_fail_closed(self) -> None:
        out = evaluate_polarity_adapter(_polarity_input(label="PRODUCTION"))
        self.assertEqual(out["slot_routings"][0]["pathway"], "NOT_EVALUATED")
        self.assertIn("PRODUCTION_POLARITY_ROUTING_NOT_CONNECTED", out["slot_routings"][0]["reason_codes"])

    def test_production_with_bypass_validation_error(self) -> None:
        with self.assertRaises(Rule4PolarityAdapterValidationError):
            evaluate_polarity_adapter(
                _polarity_input(label="PRODUCTION", trusted_synthetic_binding_bypass=True)
            )

    def test_synthetic_without_bypass_no_group(self) -> None:
        out = evaluate_polarity_adapter(_polarity_input(), binding_gate_mandatory=True)
        self.assertEqual(out["slot_routings"][0]["pathway"], "NOT_EVALUATED")

    def test_synthetic_with_bypass_group_allowed(self) -> None:
        out = evaluate_polarity_adapter(
            _polarity_input(trusted_synthetic_binding_bypass=True),
            binding_gate_mandatory=False,
        )
        self.assertEqual(
            out["slot_routings"][0]["pathway"],
            "POSITIVE_DISEASE_NEGATIVE_THERAPEUTIC_GROUP",
        )
        self.assertIn("TRUSTED_SYNTHETIC_BINDING_BYPASS_TEST_ONLY", out["limitation_codes"])

    def test_target_mismatch_no_group(self) -> None:
        evidence = {
            "formula_bound_pools": [
                {"formula_slot_id": "s1", "formula_target_id": "t-other", "usable_finding_ids": ["f1"]}
            ]
        }
        out = evaluate_polarity_adapter(
            _polarity_input(), evidence_adapter=evidence, binding_gate_mandatory=True
        )
        self.assertEqual(out["slot_routings"][0]["pathway"], "NOT_EVALUATED")
        self.assertIn("CROSS_FORMULA_POLARITY_LEAKAGE_BLOCKED", out["slot_routings"][0]["reason_codes"])

    def test_exact_binding_group_allowed(self) -> None:
        out = evaluate_polarity_adapter(
            _polarity_input(), evidence_adapter=EVIDENCE_EXACT, binding_gate_mandatory=True
        )
        self.assertEqual(
            out["slot_routings"][0]["pathway"],
            "POSITIVE_DISEASE_NEGATIVE_THERAPEUTIC_GROUP",
        )

    def test_shadow_ignores_bypass_flag(self) -> None:
        base = {
            "contract_version": "ehas2-rule4-contract-v1-phase2-safety",
            "ruleset_version": RULESET,
            "engine_mode": "shadow",
            "label": "SYNTHETIC",
            "formula_slots": [{"formula_slot_id": "s1", "formula_target_id": "t1"}],
            "verified_age": {
                "verification_status": "VERIFIED",
                "verified_date_of_birth": "1990-01-01",
                "consultation_assessment_date": "2026-01-01",
            },
            "patient_wide_safety": {},
            "bp_readings": [],
            "polarity_adapter": _polarity_input(trusted_synthetic_binding_bypass=True),
        }
        bundle = evaluate_rule4_shadow_bundle(base)
        self.assertEqual(bundle["polarity_routing"]["slot_routings"][0]["pathway"], "NOT_EVALUATED")


if __name__ == "__main__":
    unittest.main()
