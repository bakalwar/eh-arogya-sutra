"""Rule 4 Phase 9 Phase 8 complete-context regression (TS parity)."""

from __future__ import annotations

import copy
import json
import sys
import unittest
from pathlib import Path

REPO = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(REPO / "apps" / "clinical-engine" / "src"))
sys.path.insert(0, str(Path(__file__).resolve().parent))

from rule4_phase9_context import (  # noqa: E402
    evaluate_pediatric_overlay_from_fixture_scenario,
    phase8_evaluation_context_complete,
    phase8_evaluation_context_incomplete,
    snake_to_camel_deep,
)

from ehas2_clinical_engine.rule4.selection.evaluate_selection_adapter import (  # noqa: E402
    evaluate_selection_adapter,
)

FIXTURE = REPO / "fixtures" / "rule4" / "pediatric-overlay-scenarios.v1.json"
PHASE8_FIXTURE = REPO / "fixtures" / "rule4" / "numeric-selection-scenarios.v1.json"


def _p8_row(ref: str) -> dict:
    raw = json.loads(PHASE8_FIXTURE.read_text(encoding="utf-8"))
    return next(s for s in raw["scenarios"] if s["id"] == ref)


def _slot_status(out: dict) -> dict:
    slot = out["slot_resolutions"][0]
    return {
        "pediatric_overlay_status": slot["pediatric_overlay_status"],
        "final_draft_dilution": slot.get("final_draft_dilution"),
        "reason_codes": list(slot.get("reason_codes") or []),
    }


class Rule4Phase9ContextRegressionTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.fixture = json.loads(FIXTURE.read_text(encoding="utf-8"))

    def test_complete_d3_context_succeeds(self) -> None:
        scenario = next(s for s in self.fixture["scenarios"] if s["id"] == "p13c-d3-restrict-pass")
        row = _p8_row("d3-selected")
        sel = evaluate_selection_adapter(
            row["input"], phase8_evaluation_context_complete(row.get("context"))
        )
        self.assertEqual(sel["slot_resolutions"][0]["selection_status"], "RESOLVED_DRAFT_CANDIDATE")
        self.assertEqual(sel["slot_resolutions"][0]["selected_dilution"], "D3")
        out, _ = evaluate_pediatric_overlay_from_fixture_scenario(scenario)
        view = _slot_status(out)
        self.assertEqual(view["pediatric_overlay_status"], "OVERLAY_APPLIED")
        self.assertEqual(view["final_draft_dilution"], "D3")

    def test_complete_d5_context_succeeds(self) -> None:
        scenario = next(s for s in self.fixture["scenarios"] if s["id"] == "p13c-d5-allow")
        row = _p8_row("d5-selected")
        sel = evaluate_selection_adapter(
            row["input"], phase8_evaluation_context_complete(row.get("context"))
        )
        self.assertEqual(sel["slot_resolutions"][0]["selection_status"], "RESOLVED_DRAFT_CANDIDATE")
        out, _ = evaluate_pediatric_overlay_from_fixture_scenario(scenario)
        view = _slot_status(out)
        self.assertEqual(view["pediatric_overlay_status"], "OVERLAY_APPLIED")
        self.assertEqual(view["final_draft_dilution"], "D5")

    def test_missing_evidence_context_fails_auth(self) -> None:
        scenario = next(s for s in self.fixture["scenarios"] if s["id"] == "p13c-d5-allow")
        out, _ = evaluate_pediatric_overlay_from_fixture_scenario(
            scenario,
            phase8_context_builder=phase8_evaluation_context_incomplete,
        )
        view = _slot_status(out)
        self.assertEqual(view["pediatric_overlay_status"], "PHASE8_AUTH_FAILED")
        self.assertIsNone(view["final_draft_dilution"])

    def test_wrong_evidence_item_fails_selection(self) -> None:
        row = copy.deepcopy(_p8_row("d3-selected"))
        ctx = row.get("context") or {}
        items = list(ctx.get("evidence_items") or [])
        if items:
            items[0] = {**items[0], "finding_id": "e-wrong"}
        ctx["evidence_items"] = items
        sel = evaluate_selection_adapter(row["input"], phase8_evaluation_context_complete(ctx))
        self.assertNotEqual(
            sel["slot_resolutions"][0]["selection_status"], "RESOLVED_DRAFT_CANDIDATE"
        )

    def test_phase8_fingerprint_mismatch_fails(self) -> None:
        scenario = next(s for s in self.fixture["scenarios"] if s["id"] == "phase8-fp-mismatch")
        out, _ = evaluate_pediatric_overlay_from_fixture_scenario(scenario)
        view = _slot_status(out)
        self.assertEqual(view["pediatric_overlay_status"], "PHASE8_AUTH_FAILED")
        self.assertIn("PHASE8_SELECTION_FINGERPRINT_MISMATCH", view["reason_codes"])


if __name__ == "__main__":
    unittest.main()
