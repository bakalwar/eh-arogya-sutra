"""Rule 4 Phase 7 candidate eligibility adapter tests."""

from __future__ import annotations

import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1] / "src"
sys.path.insert(0, str(ROOT))

from ehas2_clinical_engine.rule4.eligibility.evaluate_eligibility_adapter import (  # noqa: E402
    evaluate_eligibility_adapter,
)
from ehas2_clinical_engine.rule4.eligibility.formula_bp_gate import (  # noqa: E402
    FormulaBpReading,
    evaluate_formula_bp_stage_gate,
)
from ehas2_clinical_engine.rule4.registry_loader import load_reason_code_registry  # noqa: E402

RULESET = "ehas2-rule4-ruleset-v1-frozen-doc-4c35469"
REGISTRY = "rule4-reason-codes-phase7-candidate-eligibility-subset-v1"
PHASE7 = "ehas2-rule4-contract-v1-phase7-candidate-eligibility"


def _pol_neg() -> dict:
    return {
        "slot_routings": [
            {
                "formula_slot_id": "s1",
                "formula_target_id": "t1",
                "pathway": "NEGATIVE_DISEASE_POSITIVE_THERAPEUTIC_GROUP",
                "reason_codes": [],
            }
        ]
    }


def _severity(score: int, band: str) -> dict:
    return {
        "slot_resolutions": [
            {
                "formula_slot_id": "s1",
                "severity_status": "RESOLVED_NUMERIC",
                "severity_score": score,
                "severity_band": band,
            }
        ]
    }


def _base_input(**overrides) -> dict:
    inp = {
        "contract_version": PHASE7,
        "ruleset_version": RULESET,
        "registry_version": REGISTRY,
        "label": "SYNTHETIC",
        "trusted_synthetic_eligibility_bypass": True,
        "formula_slot_ids": ["s1"],
        "formula_eligibility_records": [
            {
                "formula_slot_id": "s1",
                "formula_target_id": "t1",
                "target_role": "STANDARD_FORMULA_TARGET",
                "common_gate_bundle": {"neg_complete": True, "pos_complete": True},
                "structured_hypofunction_evidence": {
                    "pass": True,
                    "evidence_item_ids": ["e-hypo"],
                },
                "structured_moderating_force_evidence": {
                    "pass": True,
                    "evidence_item_ids": ["e-mod"],
                },
            }
        ],
    }
    inp.update(overrides)
    return inp


class Rule4Phase7FormulaBpTests(unittest.TestCase):
    def test_stage2_pass(self) -> None:
        reading: FormulaBpReading = {
            "unit": "mmHg",
            "verification_status": "VERIFIED",
            "organ_target_binding_status": "BOUND",
            "systolic_mm_hg": 165,
            "diastolic_mm_hg": 80,
        }
        out = evaluate_formula_bp_stage_gate(reading, 2)
        self.assertEqual(out["outcome"], "PASS")

    def test_stage2_fail(self) -> None:
        reading: FormulaBpReading = {
            "unit": "mmHg",
            "verification_status": "VERIFIED",
            "organ_target_binding_status": "BOUND",
            "systolic_mm_hg": 120,
            "diastolic_mm_hg": 80,
        }
        out = evaluate_formula_bp_stage_gate(reading, 2)
        self.assertEqual(out["outcome"], "FAIL")
        self.assertIn("FORMULA_BP_STAGE2_NOT_MET", out["reason_codes"])


class Rule4Phase7EligibilityTests(unittest.TestCase):
    def test_neg_d1_d2_synthetic_bypass(self) -> None:
        out = evaluate_eligibility_adapter(
            _base_input(),
            polarity_routing=_pol_neg(),
            severity_resolution=_severity(5, "MODERATE"),
            binding_gate_mandatory=False,
        )
        self.assertEqual(out["execution_status"], "NOT_IMPLEMENTED")
        slot = out["slot_resolutions"][0]
        self.assertEqual(slot["eligibility_status"], "FAMILY_ELIGIBLE")
        self.assertEqual(slot["candidate_family"], "BOTH_D1_D2_ELIGIBLE")
        self.assertTrue(out["deterministic_candidate_eligibility_fingerprint"])

    def test_neutral_non_potency(self) -> None:
        pol = {
            "slot_routings": [
                {
                    "formula_slot_id": "s1",
                    "formula_target_id": "t1",
                    "pathway": "NEUTRAL_NON_POTENCY",
                    "reason_codes": [],
                }
            ]
        }
        out = evaluate_eligibility_adapter(
            _base_input(),
            polarity_routing=pol,
            binding_gate_mandatory=False,
        )
        slot = out["slot_resolutions"][0]
        self.assertEqual(slot["eligibility_status"], "NON_POTENCY")
        self.assertEqual(slot["candidate_family"], "NONE")

    def test_production_adds_boundary_reason(self) -> None:
        out = evaluate_eligibility_adapter(
            _base_input(label="PRODUCTION", trusted_synthetic_eligibility_bypass=False),
            polarity_routing=_pol_neg(),
            severity_resolution=_severity(5, "MODERATE"),
            binding_gate_mandatory=False,
        )
        self.assertIn("PRODUCTION_ELIGIBILITY_STRUCTURED_INPUT_REQUIRED", out["reason_codes"])

    def test_merged_registry_head_is_phase8(self) -> None:
        reg = load_reason_code_registry()
        self.assertEqual(reg["scope"], "PHASE8_NUMERIC_SELECTION_SUBSET")
        codes = {e["code"] for e in reg["reasonCodes"]}
        self.assertIn("ELIGIBILITY_ALONE_NOT_A_POTENCY_SELECTOR", codes)


if __name__ == "__main__":
    unittest.main()
