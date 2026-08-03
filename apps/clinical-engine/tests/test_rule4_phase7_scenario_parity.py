"""Rule 4 Phase 7 candidate eligibility shared-fixture scenario parity (read-only JSON)."""

from __future__ import annotations

import hashlib
import json
import sys
import unittest
from copy import deepcopy
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1] / "src"
REPO = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(ROOT))

from ehas2_clinical_engine.rule4.eligibility.evaluate_eligibility_adapter import (  # noqa: E402
    evaluate_eligibility_adapter,
)
from ehas2_clinical_engine.rule4.eligibility.eligibility_fingerprint_v1 import (  # noqa: E402
    rule4_candidate_eligibility_fingerprint_v1_hash,
    rule4_candidate_eligibility_fingerprint_v1_payload,
)

FIXTURE = REPO / "fixtures" / "rule4" / "candidate-eligibility-scenarios.v1.json"
FIXTURE_SHA256 = (
    "B93C78A431102FB28A2D3CE249DC7C3817934E4AA245A34F1D13A5AA4C0D4084"
)

ADAPTER_INVARIANT_KEYS = (
    "execution_status",
    "selection_status",
    "automatic_potency_runtime",
    "prescription_issue_allowed",
    "final_doctor_approval_required",
)

SLOT_SCALAR_KEYS = frozenset(
    {
        "formula_target_id",
        "eligibility_status",
        "candidate_family",
        "family_gate_status",
        "selection_status",
        "selected_cascade",
        "selected_dilution",
        "upstream_context_status",
    }
)


def _fixture_bytes_sha() -> str:
    return hashlib.sha256(FIXTURE.read_bytes()).hexdigest().upper()


def _context_kwargs(scenario: dict) -> dict:
    ctx = scenario.get("context") or {}
    return {
        "safety_gate": ctx.get("safety_gate"),
        "evidence_adapter": ctx.get("evidence_adapter"),
        "polarity_routing": ctx.get("polarity_routing"),
        "phase_resolution": ctx.get("phase_resolution"),
        "severity_resolution": ctx.get("severity_resolution"),
        "binding_gate_mandatory": ctx.get("binding_gate_mandatory", True),
    }


def _normalize_gate(gate: dict) -> dict:
    return {
        "gate_id": gate["gate_id"],
        "outcome": gate["outcome"],
        "evidence_item_ids": sorted(gate.get("evidence_item_ids") or []),
        "reason_codes": sorted(gate.get("reason_codes") or []),
        "limitation_codes": sorted(gate.get("limitation_codes") or []),
    }


def _normalize_gate_results(gates: list[dict]) -> list[dict]:
    return sorted((_normalize_gate(g) for g in gates), key=lambda g: g["gate_id"])


def _slot_view(out: dict, slot_id: str | None = None) -> dict:
    slots = out["slot_resolutions"]
    sid = slot_id or (slots[0]["formula_slot_id"] if slots else "s1")
    slot = next(s for s in slots if s["formula_slot_id"] == sid)
    view = deepcopy(slot)
    view["gate_results"] = _normalize_gate_results(list(view.get("gate_results") or []))
    view["blocking_gate_codes"] = sorted(view.get("blocking_gate_codes") or [])
    view["reason_codes"] = sorted(view.get("reason_codes") or [])
    view["limitation_codes"] = sorted(view.get("limitation_codes") or [])
    view["eligible_family_options"] = sorted(view.get("eligible_family_options") or [])
    view["gate_ids"] = [g["gate_id"] for g in view["gate_results"]]
    return view


def _assert_adapter_invariants(out: dict, scenario_id: str) -> None:
    self_msg = f"scenario {scenario_id}"
    assert out["execution_status"] == "NOT_IMPLEMENTED", self_msg
    assert out["selection_status"] == "NOT_STARTED", self_msg
    assert out["automatic_potency_runtime"] is False, self_msg
    assert out["prescription_issue_allowed"] is False, self_msg
    assert out["final_doctor_approval_required"] is True, self_msg
    for slot in out["slot_resolutions"]:
        assert slot["selection_status"] == "NOT_STARTED", self_msg
        assert slot["selected_cascade"] is None, self_msg
        assert slot["selected_dilution"] is None, self_msg


def _compare_expected_slot(
    scenario_id: str,
    expected: dict,
    out: dict,
    slot: dict,
) -> None:
    slot_id = expected.get("formula_slot_id")
    for key, exp in expected.items():
        if key == "formula_slot_id":
            continue
        if key == "reason_includes":
            for code in exp:
                assert code in slot["reason_codes"], f"{scenario_id} reason_includes {code}"
            continue
        if key == "gate_includes":
            for gate_id in exp:
                assert gate_id in slot["gate_ids"], f"{scenario_id} gate_includes {gate_id}"
            continue
        if key == "limitation_includes":
            for code in exp:
                assert code in slot["limitation_codes"], f"{scenario_id} limitation_includes {code}"
            continue
        if key == "gate_results":
            assert _normalize_gate_results(list(exp)) == slot["gate_results"], (
                f"{scenario_id} gate_results"
            )
            continue
        if key in (
            "deterministic_candidate_eligibility_fingerprint",
            "candidate_eligibility_fingerprint",
        ):
            digest = rule4_candidate_eligibility_fingerprint_v1_hash(
                ruleset_version=out["ruleset_version"],
                registry_version=out["registry_version"],
                selection_status=out["selection_status"],
                slot_resolutions=list(out["slot_resolutions"]),
                reason_codes=list(out["reason_codes"]),
                limitation_codes=list(out["limitation_codes"]),
            )
            assert digest == exp.upper(), f"{scenario_id} fingerprint"
            continue
        if key in ADAPTER_INVARIANT_KEYS:
            assert out[key] == exp, f"{scenario_id} adapter {key}"
            continue
        if key in SLOT_SCALAR_KEYS:
            assert slot[key] == exp, f"{scenario_id} slot {key}"
            continue
        if key == "eligible_family_options":
            assert sorted(exp) == slot["eligible_family_options"], (
                f"{scenario_id} eligible_family_options"
            )
            continue
        if key == "blocking_gate_codes":
            assert sorted(exp) == slot["blocking_gate_codes"], (
                f"{scenario_id} blocking_gate_codes"
            )
            continue
        if key == "reason_codes":
            assert sorted(exp) == slot["reason_codes"], f"{scenario_id} reason_codes"
            continue
        if key == "limitation_codes":
            assert sorted(exp) == slot["limitation_codes"], f"{scenario_id} limitation_codes"
            continue
        assert slot.get(key) == exp, f"{scenario_id} slot field {key}"


class Rule4Phase7FixtureImmutabilityTests(unittest.TestCase):
    def test_fixture_sha256_stable(self) -> None:
        digest = _fixture_bytes_sha()
        self.assertEqual(digest, FIXTURE_SHA256)


class Rule4Phase7ScenarioParityTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.fixture_sha_before = _fixture_bytes_sha()
        cls.fixture = json.loads(FIXTURE.read_text(encoding="utf-8"))
        cls.scenarios = cls.fixture["scenarios"]

    @classmethod
    def tearDownClass(cls) -> None:
        digest = _fixture_bytes_sha()
        assert digest == cls.fixture_sha_before
        assert digest == FIXTURE_SHA256

    def test_scenario_count_metadata(self) -> None:
        self.assertEqual(self.fixture["scenarioCount"], 50)
        self.assertEqual(len(self.scenarios), 50)

    def test_scenario_parity_all(self) -> None:
        for scenario in self.scenarios:
            out = evaluate_eligibility_adapter(scenario["input"], **_context_kwargs(scenario))
            _assert_adapter_invariants(out, scenario["id"])
            exp = scenario["expected"]
            slot_id = exp.get("formula_slot_id")
            slot = _slot_view(out, slot_id)
            _compare_expected_slot(scenario["id"], exp, out, slot)

    def test_fingerprint_v1_references(self) -> None:
        refs = self.fixture.get("fingerprintV1References") or []
        self.assertEqual(len(refs), 4)
        by_id = {s["id"]: s for s in self.scenarios}
        for ref in refs:
            scenario = by_id[ref["scenario_id"]]
            out = evaluate_eligibility_adapter(scenario["input"], **_context_kwargs(scenario))
            payload = rule4_candidate_eligibility_fingerprint_v1_payload(
                ruleset_version=out["ruleset_version"],
                registry_version=out["registry_version"],
                selection_status=out["selection_status"],
                slot_resolutions=list(out["slot_resolutions"]),
                reason_codes=list(out["reason_codes"]),
                limitation_codes=list(out["limitation_codes"]),
            )
            self.assertEqual(payload, ref["canonical_payload"])
            digest = hashlib.sha256(payload.encode("utf-8")).hexdigest().upper()
            self.assertEqual(digest, ref["candidate_eligibility_sha256"].upper())
            self.assertIn("rule4-candidate-eligibility-fingerprint-v1", ref["canonical_payload"])


if __name__ == "__main__":
    unittest.main()
