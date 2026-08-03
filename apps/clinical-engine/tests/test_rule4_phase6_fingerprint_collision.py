"""Rule 4 Phase 6 severity fingerprint collision parity (mirrors TS)."""

from __future__ import annotations

import hashlib
import json
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1] / "src"
sys.path.insert(0, str(ROOT))

from ehas2_clinical_engine.rule4.severity.evaluate_severity_adapter import (  # noqa: E402
    evaluate_severity_adapter,
)
from ehas2_clinical_engine.rule4.severity.severity_fingerprint_v1 import (  # noqa: E402
    rule4_severity_resolution_fingerprint_v1_hash,
    rule4_severity_resolution_fingerprint_v1_payload,
)

RULESET = "ehas2-rule4-ruleset-v1-frozen-doc-4c35469"
REGISTRY = "rule4-reason-codes-phase6-structured-severity-subset-v1"
PHASE6 = "ehas2-rule4-contract-v1-phase6-structured-severity"


def _base() -> dict:
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


def _pol(pathway: str) -> dict:
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


def _phase_resolved() -> dict:
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
                "phase_status": "RESOLVED_BY_EVIDENCE",
                "resolved_phase": "ACUTE",
                "phase_resolution_source": "STRUCTURED_EVIDENCE",
                "selected_cascade": None,
                "selected_dilution": None,
                "reason_codes": [],
                "limitation_codes": ["PHASE5_NO_NUMERIC_CASCADE"],
            }
        ],
        "reason_codes": [],
        "limitation_codes": [],
        "deterministic_phase_resolution_fingerprint": "p",
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
        "deterministic_phase_resolution_fingerprint": "p",
    }


def _fp(out: dict) -> str:
    return rule4_severity_resolution_fingerprint_v1_hash(
        ruleset_version=out["ruleset_version"],
        registry_version=out["registry_version"],
        slot_resolutions=list(out["slot_resolutions"]),
        reason_codes=list(out["reason_codes"]),
        limitation_codes=list(out["limitation_codes"]),
    )


class Rule4Phase6FingerprintCollisionTests(unittest.TestCase):
    def test_neutral_vs_unresolved_polarity(self) -> None:
        neutral = evaluate_severity_adapter(
            _base(), polarity_routing=_pol("NEUTRAL_NON_POTENCY"), binding_gate_mandatory=False
        )
        unresolved = evaluate_severity_adapter(
            _base(), polarity_routing=_pol("UNRESOLVED_NO_CASCADE"), binding_gate_mandatory=False
        )
        self.assertEqual(
            neutral["slot_resolutions"][0]["upstream_context_status"],
            "AUDIT_ONLY_NON_POTENCY_CONTEXT",
        )
        self.assertEqual(
            unresolved["slot_resolutions"][0]["upstream_context_status"],
            "AUDIT_ONLY_UPSTREAM_UNRESOLVED",
        )
        self.assertNotEqual(_fp(neutral), _fp(unresolved))

    def test_ready_vs_audit_unresolved(self) -> None:
        ready = evaluate_severity_adapter(
            _base(),
            polarity_routing=_pol("POSITIVE_DISEASE_NEGATIVE_THERAPEUTIC_GROUP"),
            phase_resolution=_phase_resolved(),
            binding_gate_mandatory=False,
        )
        audit = evaluate_severity_adapter(
            _base(),
            polarity_routing=_pol("POSITIVE_DISEASE_NEGATIVE_THERAPEUTIC_GROUP"),
            phase_resolution=_phase_unresolved(),
            binding_gate_mandatory=False,
        )
        self.assertNotEqual(_fp(ready), _fp(audit))

    def test_safety_hold_changes_fingerprint(self) -> None:
        clear = evaluate_severity_adapter(_base(), binding_gate_mandatory=False)
        held = evaluate_severity_adapter(
            _base(),
            binding_gate_mandatory=False,
            safety_gate={
                "patient_wide_hold": True,
                "d13_hard_stop_active": False,
                "reason_codes": ["PRESCRIPTION_HOLD"],
                "limitation_codes": [],
            },
        )
        self.assertNotEqual(_fp(clear), _fp(held))

    def test_payload_key_order_stable(self) -> None:
        out = evaluate_severity_adapter(_base(), binding_gate_mandatory=False)
        payload_a = rule4_severity_resolution_fingerprint_v1_payload(
            ruleset_version=out["ruleset_version"],
            registry_version=out["registry_version"],
            slot_resolutions=list(out["slot_resolutions"]),
            reason_codes=list(out["reason_codes"]),
            limitation_codes=list(out["limitation_codes"]),
        )
        shuffled = json.loads(payload_a)
        payload_b = json.dumps(shuffled, sort_keys=True, separators=(",", ":"), ensure_ascii=False)
        self.assertEqual(
            hashlib.sha256(payload_a.encode()).hexdigest().upper(),
            hashlib.sha256(payload_b.encode()).hexdigest().upper(),
        )


if __name__ == "__main__":
    unittest.main()
