"""Rule 4 Phase 9 pediatric overlay shared-fixture scenario parity (read-only JSON)."""

from __future__ import annotations

import hashlib
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

from ehas2_clinical_engine.rule4.pediatric_overlay.evaluate_pediatric_overlay_adapter import (  # noqa: E402
    evaluate_pediatric_overlay_adapter,
)
from ehas2_clinical_engine.rule4.selection.evaluate_selection_adapter import (  # noqa: E402
    evaluate_selection_adapter,
)
from ehas2_clinical_engine.rule4.selection.selection_fingerprint_v1 import (  # noqa: E402
    rule4_numeric_selection_fingerprint_v1_hash,
)

FIXTURE = REPO / "fixtures" / "rule4" / "pediatric-overlay-scenarios.v1.json"
PHASE8_FIXTURE = REPO / "fixtures" / "rule4" / "numeric-selection-scenarios.v1.json"
FIXTURE_SHA256 = (
    "1222B8CC5654450E30D3159A8143B3FD854B2DE5663DAF2BB05BCB436B5841D7"
)
FIXTURE_PRESENT = FIXTURE.is_file()

SLOT_SCALAR_KEYS = frozenset(
    {
        "pediatric_overlay_status",
        "pediatric_matrix_authority",
        "verified_age_band",
        "base_selected_dilution",
        "base_selected_cascade",
        "final_draft_dilution",
        "final_draft_cascade",
        "d13_d_justification_status",
    }
)


def _fixture_bytes_sha() -> str:
    return hashlib.sha256(FIXTURE.read_bytes()).hexdigest().upper()


def _load_phase8(ref: str) -> tuple[dict, dict]:
    raw = json.loads(PHASE8_FIXTURE.read_text(encoding="utf-8"))
    row = next(s for s in raw["scenarios"] if s["id"] == ref)
    return row.get("input") or {}, row.get("context") or {}


def _snake_to_camel_key(key: str) -> str:
    parts = key.split("_")
    return parts[0] + "".join(p.capitalize() for p in parts[1:])


def _overlay_input(scenario: dict, phase8_fp: str, target_id: str) -> dict:
    record = {
        "formula_slot_id": "s1",
        "formula_target_id": target_id,
        "phase8_selection_fingerprint": scenario.get("phase8_fingerprint_override") or phase8_fp,
    }
    if scenario.get("restrict_gate_ledger"):
        record["restrict_gate_ledger"] = snake_to_camel_deep(scenario["restrict_gate_ledger"])
    return {
        "contract_version": "ehas2-rule4-contract-v1-phase9-pediatric-overlay",
        "ruleset_version": "ehas2-rule4-ruleset-v1-frozen-doc-4c35469",
        "registry_version": "rule4-reason-codes-phase9-pediatric-overlay-subset-v1",
        "label": scenario.get("overlay_label") or "SYNTHETIC",
        "formula_slot_ids": ["s1"],
        "slot_overlay_records": [record],
    }


def _overlay_context(scenario: dict, selection_resolution: dict) -> dict:
    slot0 = selection_resolution["slot_resolutions"][0]
    verified_age = scenario.get("verified_age")
    return {
        "safety_gate": scenario.get("safety_gate"),
        "verified_age": snake_to_camel_deep(verified_age) if verified_age else None,
        "selection_resolution": selection_resolution,
        "upstream_eligibility_fingerprint": slot0.get("upstream_eligibility_fingerprint"),
    }


def _slot_view(out: dict, slot_id: str | None = None) -> dict:
    slot = next(
        (s for s in out["slot_resolutions"] if s["formula_slot_id"] == (slot_id or "s1")),
        None,
    )
    if slot is None:
        return {}
    return {
        "pediatric_overlay_status": slot["pediatric_overlay_status"],
        "pediatric_matrix_authority": slot["pediatric_matrix_authority"],
        "verified_age_band": slot.get("verified_age_band"),
        "base_selected_dilution": slot.get("base_selected_dilution"),
        "base_selected_cascade": slot.get("base_selected_cascade"),
        "final_draft_dilution": slot.get("final_draft_dilution"),
        "final_draft_cascade": slot.get("final_draft_cascade"),
        "d13_d_justification_status": slot["d13_d_justification_status"],
        "reason_codes": list(slot.get("reason_codes") or []),
        "limitation_codes": list(slot.get("limitation_codes") or []),
    }


@unittest.skipUnless(FIXTURE_PRESENT, "pediatric-overlay-scenarios.v1.json not present yet")
class Rule4Phase9FixtureImmutabilityTests(unittest.TestCase):
    def test_fixture_sha256_pinned(self) -> None:
        self.assertEqual(_fixture_bytes_sha(), FIXTURE_SHA256)


@unittest.skipUnless(FIXTURE_PRESENT, "pediatric-overlay-scenarios.v1.json not present yet")
class Rule4Phase9ScenarioParityTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.fixture_sha_before = _fixture_bytes_sha()
        cls.fixture = json.loads(FIXTURE.read_text(encoding="utf-8"))
        cls.scenarios = cls.fixture["scenarios"]

    @classmethod
    def tearDownClass(cls) -> None:
        digest = _fixture_bytes_sha()
        assert digest == cls.fixture_sha_before

    def test_scenario_count_metadata(self) -> None:
        self.assertGreaterEqual(self.fixture["scenarioCount"], 56)
        self.assertEqual(len(self.scenarios), self.fixture["scenarioCount"])

    def test_scenario_parity_all(self) -> None:
        for scenario in self.scenarios:
            p8_in, p8_ctx_raw = _load_phase8(scenario["phase8_ref"])
            sel_out = evaluate_selection_adapter(
                p8_in, phase8_evaluation_context_complete(p8_ctx_raw)
            )
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
            overlay_in = _overlay_input(scenario, fp, target)
            out = evaluate_pediatric_overlay_adapter(
                overlay_in, _overlay_context(scenario, sel_out)
            )
            self.assertEqual(out["execution_status"], "NOT_IMPLEMENTED")
            self.assertFalse(out["automatic_pediatric_overlay_runtime"])
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
                if key in SLOT_SCALAR_KEYS or key in view:
                    self.assertEqual(view.get(key), expected, f"{scenario['id']} {key}")


if __name__ == "__main__":
    unittest.main()
