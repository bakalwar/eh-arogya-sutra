"""Rule 4 Phase 5 binding gate tests (mandatory gate, no synthetic bypass)."""

from __future__ import annotations

import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1] / "src"
sys.path.insert(0, str(ROOT))

from ehas2_clinical_engine.rule4.phase.evaluate_phase_adapter import (  # noqa: E402
    evaluate_phase_adapter,
)


def _evidence_adapter(pools: list[dict]) -> dict:
    return {
        "contract_version": "ehas2-rule4-contract-v1-phase3-evidence",
        "ruleset_version": "ehas2-rule4-ruleset-v1-frozen-doc-4c35469",
        "registry_version": "rule4-reason-codes-phase3-evidence-subset-v1",
        "data_asset_version": None,
        "execution_status": "NOT_IMPLEMENTED",
        "current_runtime_potency_delta": "NONE",
        "registry_q16_selector_status": "NOT_EXECUTABLE_AS_Q16_SELECTOR",
        "document_gate_results": [],
        "item_gate_results": [],
        "ignored_audit": [],
        "dedupe_supersession": [],
        "formula_bound_pools": [
            {
                "formula_slot_id": p["formula_slot_id"],
                "formula_target_id": p["formula_target_id"],
                "usable_finding_ids": p["usable_finding_ids"],
                "ignored_finding_ids": [],
                "corroboration_distinct_parent_count": 1 if p["usable_finding_ids"] else 0,
                "corroborating_parent_source_ids": ["ps1"] if p["usable_finding_ids"] else [],
                "contradiction": {
                    "evidence_status": "CLEAR",
                    "doctor_review_required": True,
                    "reason_codes": [],
                    "limitation_codes": [],
                },
            }
            for p in pools
        ],
        "reason_codes": [],
        "limitation_codes": [],
        "deterministic_evidence_pool_fingerprint": "test",
        "quarantine_reason_codes": [],
    }


def _phase_input(**overrides: object) -> dict:
    base = {
        "contract_version": "ehas2-rule4-contract-v1-phase5-structured-phase",
        "ruleset_version": "ehas2-rule4-ruleset-v1-frozen-doc-4c35469",
        "registry_version": "rule4-reason-codes-phase5-structured-phase-subset-v1",
        "label": "SYNTHETIC",
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
    return {**base, **overrides}


class Rule4Phase5BindingGateTests(unittest.TestCase):
    def test_exact_slot_target_resolves(self) -> None:
        out = evaluate_phase_adapter(
            _phase_input(),
            evidence_adapter=_evidence_adapter(
                [{"formula_slot_id": "s1", "formula_target_id": "t1", "usable_finding_ids": ["f1"]}]
            ),
            binding_gate_mandatory=True,
        )
        self.assertEqual(out["slot_resolutions"][0]["phase_status"], "RESOLVED_BY_DAY_BAND")

    def test_target_mismatch_blocked(self) -> None:
        out = evaluate_phase_adapter(
            _phase_input(),
            evidence_adapter=_evidence_adapter(
                [
                    {
                        "formula_slot_id": "s1",
                        "formula_target_id": "t-other",
                        "usable_finding_ids": ["f1"],
                    }
                ]
            ),
            binding_gate_mandatory=True,
        )
        slot = out["slot_resolutions"][0]
        self.assertEqual(slot["phase_status"], "NOT_EVALUATED")
        self.assertIn("CROSS_FORMULA_PHASE_LEAKAGE_BLOCKED", slot["reason_codes"])

    def test_slot_mismatch_blocked(self) -> None:
        out = evaluate_phase_adapter(
            _phase_input(),
            evidence_adapter=_evidence_adapter(
                [
                    {
                        "formula_slot_id": "s-other",
                        "formula_target_id": "t1",
                        "usable_finding_ids": ["f1"],
                    }
                ]
            ),
            binding_gate_mandatory=True,
        )
        self.assertEqual(out["slot_resolutions"][0]["phase_status"], "NOT_EVALUATED")

    def test_missing_adapter_not_evaluated(self) -> None:
        out = evaluate_phase_adapter(_phase_input(), binding_gate_mandatory=True)
        self.assertEqual(out["slot_resolutions"][0]["phase_status"], "NOT_EVALUATED")

    def test_empty_usable_not_evaluated(self) -> None:
        out = evaluate_phase_adapter(
            _phase_input(),
            evidence_adapter=_evidence_adapter(
                [{"formula_slot_id": "s1", "formula_target_id": "t1", "usable_finding_ids": []}]
            ),
            binding_gate_mandatory=True,
        )
        self.assertEqual(out["slot_resolutions"][0]["phase_status"], "NOT_EVALUATED")


if __name__ == "__main__":
    unittest.main()
