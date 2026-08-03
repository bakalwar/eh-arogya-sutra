"""Rule 4 Phase 6 cross-role and fixture-backed parity (mirrors TS)."""

from __future__ import annotations

import json
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1] / "src"
REPO = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(ROOT))

from ehas2_clinical_engine.rule4.evaluator import (  # noqa: E402
    evaluate_rule4_shadow_bundle,
)
from ehas2_clinical_engine.rule4.severity.evaluate_severity_adapter import (  # noqa: E402
    Rule4SeverityAdapterValidationError,
    evaluate_severity_adapter,
)

FIXTURE = REPO / "fixtures" / "rule4" / "severity-resolution-scenarios.v1.json"
RULESET = "ehas2-rule4-ruleset-v1-frozen-doc-4c35469"
REGISTRY = "rule4-reason-codes-phase6-structured-severity-subset-v1"
PHASE6 = "ehas2-rule4-contract-v1-phase6-structured-severity"
PHASE2 = "ehas2-rule4-contract-v1-phase2-safety"


def _doc(score, band, eid, **extra):
    return {
        "evidence_item_id": eid,
        "severity_score": score,
        "severity_band": band,
        "source_tier": "DOCTOR_STRUCTURED",
        "dedupe_key": f"d-{eid}",
        "sequence_token": "t1",
        "parent_source_id": "ps-doc",
        **extra,
    }


def _base(records, slot_ids, **extra):
    return {
        "contract_version": PHASE6,
        "ruleset_version": RULESET,
        "registry_version": REGISTRY,
        "label": "SYNTHETIC",
        "trusted_synthetic_binding_bypass": True,
        "formula_slot_ids": slot_ids,
        "formula_severity_records": records,
        **extra,
    }


def _scenario_by_id(scenario_id: str) -> dict:
    data = json.loads(FIXTURE.read_text(encoding="utf-8"))
    return next(s for s in data["scenarios"] if s["id"] == scenario_id)


def _eval_fixture_scenario(scenario: dict) -> dict:
    ctx = scenario.get("context") or {}
    inp = scenario.get("input") or {}
    bypass = inp.get("trusted_synthetic_binding_bypass") is True
    mandatory = False if bypass else ctx.get("binding_gate_mandatory", True)
    return evaluate_severity_adapter(
        inp,
        safety_gate=ctx.get("safety_gate"),
        evidence_adapter=ctx.get("evidence_adapter"),
        polarity_routing=ctx.get("polarity_routing"),
        phase_resolution=ctx.get("phase_resolution"),
        binding_gate_mandatory=mandatory,
    )


def _slot(out: dict, slot_id: str) -> dict:
    return next(s for s in out["slot_resolutions"] if s["formula_slot_id"] == slot_id)


class Rule4Phase6FixtureCrossRoleTests(unittest.TestCase):
    CROSS_ROLE_IDS = [
        "cross-flare-copied-to-chronic",
        "cross-chronic-copied-to-flare",
        "same-evidence-id-both-roles",
        "production-missing-bound-flare",
        "production-missing-bound-chronic",
        "correctly-bound-flare-chronic-pair",
        "unrelated-sibling-cross-blocked",
        "global-severity-leakage",
        "dual-slot-flare-high",
        "dual-slot-chronic-moderate",
    ]

    def test_fixture_cross_role_scenarios(self) -> None:
        for sid in self.CROSS_ROLE_IDS:
            with self.subTest(scenario=sid):
                sc = _scenario_by_id(sid)
                out = _eval_fixture_scenario(sc)
                exp = sc["expected"]
                slot_id = exp.get("formula_slot_id") or out["slot_resolutions"][0]["formula_slot_id"]
                view = _slot(out, slot_id)
                for key, expected in exp.items():
                    if key == "formula_slot_id":
                        continue
                    if key == "reason_includes":
                        for code in expected:
                            self.assertIn(code, view["reason_codes"], sid)
                    else:
                        self.assertEqual(view[key], expected, f"{sid}.{key}")


class Rule4Phase6CrossRoleUnitTests(unittest.TestCase):
    def test_flare_copy_blocks_chronic_only(self) -> None:
        out = evaluate_severity_adapter(
            _base(
                [
                    {
                        "formula_slot_id": "flare",
                        "formula_target_id": "t-flare",
                        "target_role": "CURRENT_ACUTE_FLARE",
                        "severity_evidence_assertions": [_doc(8, "HIGH", "s1")],
                    },
                    {
                        "formula_slot_id": "chronic",
                        "formula_target_id": "t-chronic",
                        "target_role": "UNDERLYING_CHRONIC_TARGET",
                        "severity_evidence_assertions": [
                            _doc(8, "HIGH", "s1", bound_target_role="CURRENT_ACUTE_FLARE")
                        ],
                    },
                ],
                ["flare", "chronic"],
            ),
            binding_gate_mandatory=False,
        )
        self.assertEqual(_slot(out, "flare")["severity_status"], "RESOLVED_NUMERIC")
        self.assertEqual(_slot(out, "chronic")["severity_status"], "NOT_EVALUATED")

    def test_chronic_copy_blocks_flare_only(self) -> None:
        out = evaluate_severity_adapter(
            _base(
                [
                    {
                        "formula_slot_id": "chronic",
                        "formula_target_id": "t-chronic",
                        "target_role": "UNDERLYING_CHRONIC_TARGET",
                        "severity_evidence_assertions": [_doc(4, "MODERATE", "s2")],
                    },
                    {
                        "formula_slot_id": "flare",
                        "formula_target_id": "t-flare",
                        "target_role": "CURRENT_ACUTE_FLARE",
                        "severity_evidence_assertions": [
                            _doc(4, "MODERATE", "s2", bound_target_role="UNDERLYING_CHRONIC_TARGET")
                        ],
                    },
                ],
                ["flare", "chronic"],
            ),
            binding_gate_mandatory=False,
        )
        self.assertEqual(_slot(out, "chronic")["severity_status"], "RESOLVED_NUMERIC")
        self.assertEqual(_slot(out, "flare")["severity_status"], "NOT_EVALUATED")

    def test_production_missing_bound(self) -> None:
        out = evaluate_severity_adapter(
            _base(
                [
                    {
                        "formula_slot_id": "flare",
                        "formula_target_id": "tf",
                        "target_role": "CURRENT_ACUTE_FLARE",
                        "severity_evidence_assertions": [_doc(8, "HIGH", "e1")],
                    }
                ],
                ["flare"],
                label="PRODUCTION",
                trusted_synthetic_binding_bypass=False,
            ),
            binding_gate_mandatory=False,
        )
        self.assertIn("TARGET_BINDING_MISSING", _slot(out, "flare")["reason_codes"])

    def test_invalid_bound_role_validation(self) -> None:
        with self.assertRaises(Rule4SeverityAdapterValidationError):
            evaluate_severity_adapter(
                _base(
                    [
                        {
                            "formula_slot_id": "flare",
                            "formula_target_id": "tf",
                            "target_role": "CURRENT_ACUTE_FLARE",
                            "severity_evidence_assertions": [
                                _doc(8, "HIGH", "e1", bound_target_role="NOT_A_REAL_ROLE")
                            ],
                        }
                    ],
                    ["flare"],
                )
            )


class Rule4Phase6ShadowTests(unittest.TestCase):
    def test_public_result_unchanged(self) -> None:
        shadow_base = {
            "contract_version": PHASE2,
            "case_id": "c1",
            "consultation_id": "consult",
            "ruleset_version": RULESET,
            "engine_mode": "shadow",
            "label": "SYNTHETIC",
            "formula_slots": [
                {
                    "formula_slot_id": "s1",
                    "formula_target_id": "t1",
                    "structured_evidence_item_ids": [],
                    "polarity_ref": None,
                    "organ_target_ref": None,
                    "temperament_ref": None,
                    "phase_ref": None,
                    "severity_ref": None,
                }
            ],
            "verified_age": {
                "age_years": 30,
                "verification_status": "VERIFIED",
                "verified_date_of_birth": "1990-01-01",
                "consultation_assessment_date": "2026-01-01",
            },
            "patient_wide_safety": {},
            "structured_evidence_item_ids": [],
        }
        sev = _base(
            [
                {
                    "formula_slot_id": "s1",
                    "formula_target_id": "t1",
                    "target_role": "STANDARD_FORMULA_TARGET",
                    "severity_evidence_assertions": [_doc(5, "MODERATE", "e1")],
                }
            ],
            ["s1"],
        )
        without = evaluate_rule4_shadow_bundle(shadow_base)
        with_sev = evaluate_rule4_shadow_bundle({**shadow_base, "severity_adapter": sev})
        self.assertEqual(
            with_sev["result"]["deterministic_fingerprint"],
            without["result"]["deterministic_fingerprint"],
        )
        self.assertIsNotNone(with_sev.get("severity_resolution"))


if __name__ == "__main__":
    unittest.main()
