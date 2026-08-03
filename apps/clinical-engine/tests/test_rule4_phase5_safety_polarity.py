"""Rule 4 Phase 5 safety and polarity precedence tests."""

from __future__ import annotations

import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1] / "src"
sys.path.insert(0, str(ROOT))

from ehas2_clinical_engine.rule4.phase.evaluate_phase_adapter import (  # noqa: E402
    evaluate_phase_adapter,
)

PHASE_INPUT = {
    "contract_version": "ehas2-rule4-contract-v1-phase5-structured-phase",
    "ruleset_version": "ehas2-rule4-ruleset-v1-frozen-doc-4c35469",
    "registry_version": "rule4-reason-codes-phase5-structured-phase-subset-v1",
    "label": "SYNTHETIC",
    "trusted_synthetic_binding_bypass": True,
    "formula_slot_ids": ["s1"],
    "formula_phase_records": [
        {
            "formula_slot_id": "s1",
            "formula_target_id": "t1",
            "target_role": "STANDARD_FORMULA_TARGET",
            "raw_duration_days": 10,
            "phase_evidence_assertions": [],
        }
    ],
}


def _safety_hold() -> dict:
    return {
        "patient_wide_hold": True,
        "d13_hard_stop_active": False,
        "reason_codes": ["PRESCRIPTION_HOLD"],
        "limitation_codes": [],
    }


def _d13_hs() -> dict:
    return {
        "patient_wide_hold": False,
        "d13_hard_stop_active": True,
        "reason_codes": ["PRESCRIPTION_HOLD"],
        "limitation_codes": [],
    }


def _polarity(pathway: str) -> dict:
    return {
        "contract_version": "ehas2-rule4-contract-v1-phase4-polarity",
        "ruleset_version": "ehas2-rule4-ruleset-v1-frozen-doc-4c35469",
        "registry_version": "rule4-reason-codes-phase4-polarity-subset-v1",
        "execution_status": "NOT_IMPLEMENTED",
        "current_runtime_potency_delta": "NONE",
        "slot_routings": [
            {
                "formula_slot_id": "s1",
                "formula_target_id": "t1",
                "rule2_record_id": "r2-1",
                "disease_polarity": "POSITIVE",
                "required_therapeutic_polarity": "NEGATIVE",
                "resolution_status": "RESOLVED",
                "pathway": pathway,
                "potency_status": "NOT_EVALUATED",
                "selected_cascade": None,
                "selected_dilution": None,
                "reason_codes": [],
                "limitation_codes": ["PHASE4_NO_NUMERIC_CASCADE"],
            }
        ],
        "reason_codes": [],
        "limitation_codes": [],
        "deterministic_polarity_routing_fingerprint": "test",
    }


class Rule4Phase5SafetyPolarityTests(unittest.TestCase):
    def test_crisis_hold_blocks_phase(self) -> None:
        out = evaluate_phase_adapter(
            PHASE_INPUT,
            safety_gate=_safety_hold(),
            binding_gate_mandatory=False,
        )
        slot = out["slot_resolutions"][0]
        self.assertEqual(slot["phase_status"], "BLOCKED_BY_PATIENT_WIDE_SAFETY_GATE")
        self.assertIsNone(slot["resolved_phase"])
        self.assertIsNone(slot["selected_cascade"])

    def test_d13_hs_blocks_phase(self) -> None:
        out = evaluate_phase_adapter(
            PHASE_INPUT,
            safety_gate=_d13_hs(),
            binding_gate_mandatory=False,
        )
        self.assertEqual(
            out["slot_resolutions"][0]["phase_status"],
            "BLOCKED_BY_PATIENT_WIDE_SAFETY_GATE",
        )

    def test_polarity_contradiction_blocks_phase(self) -> None:
        out = evaluate_phase_adapter(
            PHASE_INPUT,
            polarity_routing=_polarity("POLARITY_CONTRADICTORY"),
            binding_gate_mandatory=False,
        )
        slot = out["slot_resolutions"][0]
        self.assertEqual(slot["phase_status"], "BLOCKED_BY_POLARITY_CONTRADICTION")
        self.assertIsNone(slot["resolved_phase"])

    def test_neutral_polarity_no_potency(self) -> None:
        out = evaluate_phase_adapter(
            PHASE_INPUT,
            polarity_routing=_polarity("NEUTRAL_NON_POTENCY"),
            binding_gate_mandatory=False,
        )
        self.assertIsNone(out["slot_resolutions"][0]["selected_dilution"])
        self.assertFalse(out["automatic_potency_runtime"])

    def test_safety_wins_over_polarity(self) -> None:
        out = evaluate_phase_adapter(
            PHASE_INPUT,
            safety_gate=_safety_hold(),
            polarity_routing=_polarity("POSITIVE_DISEASE_NEGATIVE_THERAPEUTIC_GROUP"),
            binding_gate_mandatory=False,
        )
        self.assertEqual(
            out["slot_resolutions"][0]["phase_status"],
            "BLOCKED_BY_PATIENT_WIDE_SAFETY_GATE",
        )


if __name__ == "__main__":
    unittest.main()
