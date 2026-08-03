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
from ehas2_clinical_engine.rule4.evidence.evaluate_evidence_adapter import (  # noqa: E402
    evaluate_evidence_adapter,
)
from ehas2_clinical_engine.rule4.evidence.evidence_fingerprint_v1 import (  # noqa: E402
    build_rule4_evidence_pool_fingerprint_v1_payload,
    rule4_evidence_pool_fingerprint_v1_hash,
)
from ehas2_clinical_engine.rule4.evaluator import evaluate_rule4_shadow_bundle  # noqa: E402
from ehas2_clinical_engine.rule4.registry_loader import load_reason_code_registry  # noqa: E402

FIXTURE = REPO / "fixtures" / "rule4" / "evidence-adapter-scenarios.v1.json"


def _pool_view(out: dict) -> dict:
    by_slot: dict[str, list[str]] = {}
    for pool in out["formula_bound_pools"]:
        by_slot[pool["formula_slot_id"]] = list(pool["usable_finding_ids"])
    contradictory = [
        p["formula_slot_id"]
        for p in out["formula_bound_pools"]
        if p["contradiction"]["evidence_status"] == "CONTRADICTORY_EVIDENCE"
    ]
    return {
        "usableBySlot": by_slot,
        "contradictorySlots": contradictory,
        "fingerprint": out["deterministic_evidence_pool_fingerprint"],
    }


class Rule4Phase3EvidenceTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.fixture = json.loads(FIXTURE.read_text(encoding="utf-8"))
        cls.scenarios = cls.fixture["scenarios"]
        cls.fingerprint_refs = cls.fixture.get("fingerprintV1References") or []

    def test_fixture_has_35_plus_scenarios(self) -> None:
        self.assertGreaterEqual(len(self.scenarios), 35)

    def test_fixture_expected_has_no_generated_fingerprint_field(self) -> None:
        for scenario in self.scenarios:
            with self.subTest(scenario=scenario["id"]):
                self.assertNotIn(
                    "deterministic_evidence_pool_fingerprint",
                    scenario.get("expected", {}),
                )

    def test_registry_includes_phase3_codes(self) -> None:
        reg = load_reason_code_registry()
        codes = {e["code"] for e in reg["reasonCodes"]}
        self.assertIn("D08_DOCUMENT_GATE_FAILED", codes)
        self.assertIn("CONTRADICTORY_EVIDENCE", codes)

    def test_shared_scenario_parity(self) -> None:
        for scenario in self.scenarios:
            with self.subTest(scenario=scenario["id"]):
                out = evaluate_evidence_adapter(scenario["input"])
                view = _pool_view(out)
                expected = scenario["expected"]
                for slot, ids in expected["usable_by_slot"].items():
                    self.assertEqual(view["usableBySlot"].get(slot, []), ids)
                exp_contra = expected.get("contradictory_slots") or []
                self.assertEqual(sorted(view["contradictorySlots"]), sorted(exp_contra))
                if expected.get("corroborating_parent_count"):
                    for slot, count in expected["corroborating_parent_count"].items():
                        pool = next(
                            p for p in out["formula_bound_pools"] if p["formula_slot_id"] == slot
                        )
                        self.assertEqual(pool["corroboration_distinct_parent_count"], count)
                self.assertRegex(out["deterministic_evidence_pool_fingerprint"], r"^[A-F0-9]{64}$")

    def test_fingerprint_v1_references(self) -> None:
        self.assertGreaterEqual(len(self.fingerprint_refs), 3)
        by_scenario = {s["id"]: s for s in self.scenarios}
        for ref in self.fingerprint_refs:
            with self.subTest(reference=ref["referenceId"]):
                scenario = by_scenario[ref["scenarioId"]]
                out = evaluate_evidence_adapter(scenario["input"])
                payload = build_rule4_evidence_pool_fingerprint_v1_payload(
                    ruleset_version=out["ruleset_version"],
                    registry_version=out["registry_version"],
                    data_asset_version=out["data_asset_version"],
                    formula_bound_pools=out["formula_bound_pools"],
                    reason_codes=out["reason_codes"],
                    limitation_codes=out["limitation_codes"],
                )
                canon = canonical_stable_dumps(payload)
                self.assertEqual(canon, ref["canonicalPayload"])
                manual = hashlib.sha256(canon.encode("utf-8")).hexdigest().upper()
                self.assertEqual(manual, ref["evidencePoolSha256"])
                self.assertEqual(
                    rule4_evidence_pool_fingerprint_v1_hash(
                        ruleset_version=out["ruleset_version"],
                        registry_version=out["registry_version"],
                        data_asset_version=out["data_asset_version"],
                        formula_bound_pools=out["formula_bound_pools"],
                        reason_codes=out["reason_codes"],
                        limitation_codes=out["limitation_codes"],
                    ),
                    ref["evidencePoolSha256"],
                )
                self.assertEqual(out["deterministic_evidence_pool_fingerprint"], ref["evidencePoolSha256"])

    def test_fingerprint_idempotent(self) -> None:
        scenario = next(s for s in self.scenarios if s["id"] == "duplicate-same-parent-source")
        a = evaluate_evidence_adapter(scenario["input"])
        b = evaluate_evidence_adapter(scenario["input"])
        self.assertEqual(
            a["deterministic_evidence_pool_fingerprint"],
            b["deterministic_evidence_pool_fingerprint"],
        )

    def test_shadow_public_fingerprint_unchanged(self) -> None:
        scenario = next(s for s in self.scenarios if s["id"] == "tier1-valid-direct")
        base_input = {
            "contract_version": "ehas2-rule4-contract-v1-phase2-safety",
            "ruleset_version": "ehas2-rule4-ruleset-v1-frozen-doc-4c35469",
            "engine_mode": "shadow",
            "label": "SYNTHETIC",
            "formula_slots": [{"formula_slot_id": "s1", "formula_target_id": "t-renal-1"}],
            "verified_age": {
                "verification_status": "VERIFIED",
                "verified_date_of_birth": "1990-01-01",
                "consultation_assessment_date": "2026-01-01",
            },
            "patient_wide_safety": {},
            "bp_readings": [],
        }
        without = evaluate_rule4_shadow_bundle(base_input)
        with_evidence = evaluate_rule4_shadow_bundle({**base_input, "evidence_adapter": scenario["input"]})
        self.assertEqual(
            without["result"]["deterministic_fingerprint"],
            with_evidence["result"]["deterministic_fingerprint"],
        )
        self.assertIsNotNone(with_evidence["evidence_adapter"])


if __name__ == "__main__":
    unittest.main()
