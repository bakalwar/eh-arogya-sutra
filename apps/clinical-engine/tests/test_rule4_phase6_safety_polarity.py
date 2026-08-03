"""Rule 4 Phase 6 safety/polarity/phase upstream context parity (mirrors TS)."""

from __future__ import annotations

import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1] / "src"
sys.path.insert(0, str(ROOT))

from ehas2_clinical_engine.rule4.severity.evaluate_severity_adapter import (  # noqa: E402
    Rule4SeverityAdapterValidationError,
    evaluate_severity_adapter,
)

RULESET = "ehas2-rule4-ruleset-v1-frozen-doc-4c35469"
REGISTRY = "rule4-reason-codes-phase6-structured-severity-subset-v1"
PHASE6 = "ehas2-rule4-contract-v1-phase6-structured-severity"


def _base_input() -> dict:
    return {
        "contract_version": PHASE6,
        "ruleset_version": RULESET,
        "registry_version": REGISTRY,
        "label": "SYNTHETIC",
        "trusted_synthetic_binding_bypass": True,
        "formula_slot_ids": ["s1"],
        "formula_severity_records": [
            {
                "formula_slot_id": "s1",
                "formula_target_id": "t1",
                "target_role": "STANDARD_FORMULA_TARGET",
                "severity_evidence_assertions": [
                    {
                        "evidence_item_id": "e1",
                        "severity_score": 5,
                        "severity_band": "MODERATE",
                        "source_tier": "DOCTOR_STRUCTURED",
                        "dedupe_key": "d1",
                        "sequence_token": "t1",
                        "parent_source_id": "ps-doc",
                    }
                ],
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
        "ruleset_version": RULESET,
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


def _phase_unresolved() -> dict:
    return {
        "contract_version": "ehas2-rule4-contract-v1-phase5-structured-phase",
        "ruleset_version": RULESET,
        "registry_version": "rule4-reason-codes-phase5-structured-phase-subset-v1",
        "execution_status": "NOT_IMPLEMENTED",
        "automatic_phase_runtime": False,
        "slot_resolutions": [
            {
                "formula_slot_id": "s1",
                "formula_target_id": "t1",
                "target_role": "STANDARD_FORMULA_TARGET",
                "phase_status": "MISSING_EVIDENCE",
                "resolved_phase": None,
                "phase_resolution_source": "NONE",
                "selected_cascade": None,
                "selected_dilution": None,
                "reason_codes": ["PHASE_EVIDENCE_MISSING"],
                "limitation_codes": ["PHASE5_NO_NUMERIC_CASCADE"],
            }
        ],
        "reason_codes": ["PHASE_EVIDENCE_MISSING"],
        "limitation_codes": ["PHASE5_NO_NUMERIC_CASCADE"],
        "deterministic_phase_resolution_fingerprint": "phase-unresolved",
    }


class Rule4Phase6SafetyPolarityTests(unittest.TestCase):
    def test_crisis_hold_blocks(self) -> None:
        out = evaluate_severity_adapter(
            _base_input(), safety_gate=_safety_hold(), binding_gate_mandatory=False
        )
        self.assertEqual(
            out["slot_resolutions"][0]["severity_status"], "BLOCKED_BY_PATIENT_WIDE_SAFETY_GATE"
        )

    def test_d13_hs_blocks(self) -> None:
        out = evaluate_severity_adapter(
            _base_input(), safety_gate=_d13_hs(), binding_gate_mandatory=False
        )
        self.assertEqual(
            out["slot_resolutions"][0]["severity_status"], "BLOCKED_BY_PATIENT_WIDE_SAFETY_GATE"
        )

    def test_neutral_upstream_audit_only(self) -> None:
        out = evaluate_severity_adapter(
            _base_input(),
            polarity_routing=_polarity("NEUTRAL_NON_POTENCY"),
            binding_gate_mandatory=False,
        )
        slot = out["slot_resolutions"][0]
        self.assertEqual(slot["severity_status"], "RESOLVED_NUMERIC")
        self.assertEqual(slot["upstream_context_status"], "AUDIT_ONLY_NON_POTENCY_CONTEXT")
        self.assertIsNone(slot["selected_cascade"])

    def test_support_only_non_potency(self) -> None:
        out = evaluate_severity_adapter(
            _base_input(),
            polarity_routing=_polarity("SUPPORT_ONLY_NON_POTENCY"),
            binding_gate_mandatory=False,
        )
        self.assertFalse(out["prescription_issue_allowed"])
        self.assertIsNone(out["slot_resolutions"][0]["selected_dilution"])

    def test_unresolved_polarity_audit(self) -> None:
        out = evaluate_severity_adapter(
            _base_input(),
            polarity_routing=_polarity("UNRESOLVED_NO_CASCADE"),
            binding_gate_mandatory=False,
        )
        self.assertEqual(out["slot_resolutions"][0]["upstream_context_status"], "AUDIT_ONLY_UPSTREAM_UNRESOLVED")

    def test_contradictory_polarity_no_cascade(self) -> None:
        out = evaluate_severity_adapter(
            _base_input(),
            polarity_routing=_polarity("POLARITY_CONTRADICTORY"),
            binding_gate_mandatory=False,
        )
        self.assertIsNone(out["slot_resolutions"][0]["selected_cascade"])

    def test_unresolved_phase_audit(self) -> None:
        out = evaluate_severity_adapter(
            _base_input(), phase_resolution=_phase_unresolved(), binding_gate_mandatory=False
        )
        self.assertEqual(out["slot_resolutions"][0]["severity_status"], "RESOLVED_NUMERIC")

    def test_group_polarity_unresolved_phase(self) -> None:
        out = evaluate_severity_adapter(
            _base_input(),
            polarity_routing=_polarity("POSITIVE_DISEASE_NEGATIVE_THERAPEUTIC_GROUP"),
            phase_resolution=_phase_unresolved(),
            binding_gate_mandatory=False,
        )
        self.assertEqual(
            out["slot_resolutions"][0]["upstream_context_status"], "AUDIT_ONLY_UPSTREAM_UNRESOLVED"
        )

    def test_safety_wins_over_severity(self) -> None:
        out = evaluate_severity_adapter(
            _base_input(),
            safety_gate=_safety_hold(),
            polarity_routing=_polarity("POSITIVE_DISEASE_NEGATIVE_THERAPEUTIC_GROUP"),
            phase_resolution=_phase_unresolved(),
            binding_gate_mandatory=False,
        )
        self.assertEqual(
            out["slot_resolutions"][0]["severity_status"], "BLOCKED_BY_PATIENT_WIDE_SAFETY_GATE"
        )


if __name__ == "__main__":
    unittest.main()
