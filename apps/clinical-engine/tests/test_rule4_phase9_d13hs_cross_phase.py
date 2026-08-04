"""Rule 4 Phase 9 D13-HS cross-phase regression (Phase 2 safety + Phase 8 + Phase 9 overlay)."""

from __future__ import annotations

import json
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1] / "src"
REPO = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(ROOT))
sys.path.insert(0, str(Path(__file__).resolve().parent))

from rule4_phase9_context import (  # noqa: E402
    phase8_evaluation_context_complete,
    snake_to_camel_deep,
)

from ehas2_clinical_engine.rule4.evaluator import evaluate_rule4_shadow_bundle  # noqa: E402
from ehas2_clinical_engine.rule4.selection.evaluate_selection_adapter import (  # noqa: E402
    evaluate_selection_adapter,
)
from ehas2_clinical_engine.rule4.selection.selection_fingerprint_v1 import (  # noqa: E402
    rule4_numeric_selection_fingerprint_v1_hash,
)

FIXTURE = REPO / "fixtures" / "rule4" / "pediatric-overlay-scenarios.v1.json"
PHASE8_FIXTURE = REPO / "fixtures" / "rule4" / "numeric-selection-scenarios.v1.json"


def _shadow_bundle(scenario: dict, bp_readings: list[dict] | None = None) -> dict:
    p8_raw = json.loads(PHASE8_FIXTURE.read_text(encoding="utf-8"))
    p8_row = next(s for s in p8_raw["scenarios"] if s["id"] == scenario["phase8_ref"])
    p8_in, p8_ctx = p8_row.get("input") or {}, p8_row.get("context") or {}
    sel_out = evaluate_selection_adapter(p8_in, phase8_evaluation_context_complete(p8_ctx))
    fp = rule4_numeric_selection_fingerprint_v1_hash(
        ruleset_version=sel_out["ruleset_version"],
        registry_version=sel_out["registry_version"],
        upstream_eligibility_fingerprint=sel_out["slot_resolutions"][0].get(
            "upstream_eligibility_fingerprint"
        ),
        slot_resolutions=sel_out["slot_resolutions"],
        reason_codes=sel_out["reason_codes"],
        limitation_codes=sel_out["limitation_codes"],
    )
    target = (
        scenario.get("slot_target_override")
        or sel_out["slot_resolutions"][0]["formula_target_id"]
    )
    record = {
        "formula_slot_id": "s1",
        "formula_target_id": target,
        "phase8_selection_fingerprint": scenario.get("phase8_fingerprint_override") or fp,
    }
    if scenario.get("restrict_gate_ledger"):
        record["restrict_gate_ledger"] = snake_to_camel_deep(scenario["restrict_gate_ledger"])
    overlay_in = {
        "contract_version": "ehas2-rule4-contract-v1-phase9-pediatric-overlay",
        "ruleset_version": "ehas2-rule4-ruleset-v1-frozen-doc-4c35469",
        "registry_version": "rule4-reason-codes-phase9-pediatric-overlay-subset-v1",
        "label": scenario.get("overlay_label") or "SYNTHETIC",
        "formula_slot_ids": ["s1"],
        "slot_overlay_records": [record],
    }
    verified_age = snake_to_camel_deep(scenario["verified_age"])
    return evaluate_rule4_shadow_bundle(
        {
            "contract_version": "ehas2-rule4-contract-v1-phase2-safety",
            "case_id": "phase9-d13hs-cross",
            "consultation_id": "consult-1",
            "ruleset_version": "ehas2-rule4-ruleset-v1-frozen-doc-4c35469",
            "engine_mode": "shadow",
            "label": "SYNTHETIC",
            "formula_slots": [
                {
                    "formula_slot_id": "s1",
                    "formula_target_id": "t1",
                    "polarity_ref": None,
                    "organ_target_ref": None,
                    "temperament_ref": None,
                    "phase_ref": None,
                    "severity_ref": None,
                    "structured_evidence_item_ids": [],
                }
            ],
            "verified_age": verified_age,
            "patient_wide_safety": {},
            "structured_evidence_item_ids": [],
            "bp_readings": bp_readings or [],
            "selection_adapter": p8_in,
            "pediatric_overlay_adapter": overlay_in,
        }
    )


class Rule4Phase9D13HsCrossPhaseTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.fixture = json.loads(FIXTURE.read_text(encoding="utf-8"))

    def test_p13a_under_one_overlay_null_no_draft_leak(self) -> None:
        scenario = next(s for s in self.fixture["scenarios"] if s["id"] == "p13a-d5-d13hs")
        bundle = _shadow_bundle(scenario)
        sg = bundle["result"].get("safety_gate") or {}
        self.assertEqual(sg.get("clinical_prescription_summary"), "NOT_GENERATED")
        self.assertEqual(sg.get("prescription_status"), "BLOCKED")
        self.assertTrue(sg.get("d13_hard_stop_active"))
        slot = bundle["result"]["slots"][0]
        self.assertIsNone(slot.get("selected_dilution"))
        self.assertIsNone(slot.get("selected_cascade"))
        overlay = bundle["pediatric_overlay_resolution"]
        self.assertIsNotNone(overlay)
        oslot = overlay["slot_resolutions"][0]
        self.assertEqual(oslot["pediatric_overlay_status"], "BLOCKED_D13_HS")
        self.assertIsNone(oslot.get("final_draft_dilution"))
        self.assertIsNone(oslot.get("final_draft_cascade"))
        self.assertIsNone(oslot.get("base_selected_dilution"))
        self.assertIsNone(oslot.get("base_selected_cascade"))
        self.assertIsNone(oslot.get("phase8_selection_fingerprint"))

    def test_p13b_crisis_preserves_urgent_escalation(self) -> None:
        scenario = next(s for s in self.fixture["scenarios"] if s["id"] == "p13b-crisis-d13hs")
        bundle = _shadow_bundle(
            scenario,
            bp_readings=[
                {
                    "systolic": 181,
                    "diastolic": 85,
                    "unit": "mmHg",
                    "evidence_status": "VERIFIED_CURRENT_READING",
                    "source_kind": "STRUCTURED",
                    "measured_at": None,
                }
            ],
        )
        sg = bundle["result"].get("safety_gate") or {}
        self.assertEqual(sg.get("clinical_prescription_summary"), "NOT_GENERATED")
        self.assertTrue(sg.get("urgent_escalation_required"))
        self.assertTrue(sg.get("patient_wide_hold"))
        oslot = bundle["pediatric_overlay_resolution"]["slot_resolutions"][0]
        self.assertEqual(oslot["pediatric_overlay_status"], "BLOCKED_D13_HS")

    def test_overlay_runtime_flags_unchanged(self) -> None:
        scenario = next(
            s for s in self.fixture["scenarios"] if s["id"] == "p13c-d10-restrict-pass"
        )
        bundle = _shadow_bundle(scenario)
        overlay = bundle["pediatric_overlay_resolution"]
        self.assertEqual(overlay["execution_status"], "NOT_IMPLEMENTED")
        self.assertFalse(overlay["automatic_pediatric_overlay_runtime"])
        self.assertFalse(overlay["prescription_issue_allowed"])
        self.assertTrue(overlay["final_doctor_approval_required"])


if __name__ == "__main__":
    unittest.main()
