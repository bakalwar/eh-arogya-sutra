"""Rule 4 Phase 7 eligibility fingerprint collision parity (mirrors TS)."""

from __future__ import annotations

import hashlib
import json
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1] / "src"
sys.path.insert(0, str(ROOT))

from ehas2_clinical_engine.rule4.eligibility.evaluate_eligibility_adapter import (  # noqa: E402
    evaluate_eligibility_adapter,
)
from ehas2_clinical_engine.rule4.eligibility.eligibility_fingerprint_v1 import (  # noqa: E402
    rule4_candidate_eligibility_fingerprint_v1_hash,
    rule4_candidate_eligibility_fingerprint_v1_payload,
)

RULESET = "ehas2-rule4-ruleset-v1-frozen-doc-4c35469"
REGISTRY = "rule4-reason-codes-phase7-candidate-eligibility-subset-v1"
PHASE7 = "ehas2-rule4-contract-v1-phase7-candidate-eligibility"


def _input(**overrides) -> dict:
    base = {
        "contract_version": PHASE7,
        "ruleset_version": RULESET,
        "registry_version": REGISTRY,
        "label": "SYNTHETIC",
        "trusted_synthetic_eligibility_bypass": True,
        "formula_slot_ids": ["s1"],
        "formula_eligibility_records": [
            {
                "formula_slot_id": "s1",
                "formula_target_id": "t1",
                "target_role": "STANDARD_FORMULA_TARGET",
                "common_gate_bundle": {"neg_complete": True, "pos_complete": True},
                "structured_hypofunction_evidence": {"pass": True, "evidence_item_ids": ["e1"]},
                "structured_moderating_force_evidence": {"pass": True, "evidence_item_ids": ["e2"]},
            }
        ],
    }
    base.update(overrides)
    return base


def _pol(pathway: str) -> dict:
    return {
        "slot_routings": [
            {
                "formula_slot_id": "s1",
                "formula_target_id": "t1",
                "pathway": pathway,
                "reason_codes": ["UPSTREAM_TEST"] if pathway == "UNRESOLVED_NO_CASCADE" else [],
            }
        ]
    }


def _sev(score: int) -> dict:
    return {
        "slot_resolutions": [
            {
                "formula_slot_id": "s1",
                "severity_status": "RESOLVED_NUMERIC",
                "severity_score": score,
                "severity_band": "MODERATE",
            }
        ]
    }


def _fp(out: dict) -> str:
    return rule4_candidate_eligibility_fingerprint_v1_hash(
        ruleset_version=out["ruleset_version"],
        registry_version=out["registry_version"],
        selection_status=out["selection_status"],
        slot_resolutions=list(out["slot_resolutions"]),
        reason_codes=list(out["reason_codes"]),
        limitation_codes=list(out["limitation_codes"]),
    )


class Rule4Phase7FingerprintCollisionTests(unittest.TestCase):
    def test_neutral_vs_neg_family_eligible(self) -> None:
        neutral = evaluate_eligibility_adapter(
            _input(),
            polarity_routing=_pol("NEUTRAL_NON_POTENCY"),
            binding_gate_mandatory=False,
        )
        neg = evaluate_eligibility_adapter(
            _input(),
            polarity_routing=_pol("NEGATIVE_DISEASE_POSITIVE_THERAPEUTIC_GROUP"),
            severity_resolution=_sev(4),
            binding_gate_mandatory=False,
        )
        self.assertNotEqual(_fp(neutral), _fp(neg))

    def test_low_vs_high_severity_neg_path(self) -> None:
        low = evaluate_eligibility_adapter(
            _input(),
            polarity_routing=_pol("NEGATIVE_DISEASE_POSITIVE_THERAPEUTIC_GROUP"),
            severity_resolution=_sev(4),
            binding_gate_mandatory=False,
        )
        high = evaluate_eligibility_adapter(
            _input(),
            polarity_routing=_pol("NEGATIVE_DISEASE_POSITIVE_THERAPEUTIC_GROUP"),
            severity_resolution=_sev(8),
            binding_gate_mandatory=False,
        )
        self.assertNotEqual(_fp(low), _fp(high))

    def test_safety_hold_changes_fingerprint(self) -> None:
        clear = evaluate_eligibility_adapter(
            _input(),
            polarity_routing=_pol("NEGATIVE_DISEASE_POSITIVE_THERAPEUTIC_GROUP"),
            severity_resolution=_sev(4),
            binding_gate_mandatory=False,
        )
        held = evaluate_eligibility_adapter(
            _input(),
            polarity_routing=_pol("NEGATIVE_DISEASE_POSITIVE_THERAPEUTIC_GROUP"),
            severity_resolution=_sev(4),
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
        out = evaluate_eligibility_adapter(
            _input(),
            polarity_routing=_pol("NEGATIVE_DISEASE_POSITIVE_THERAPEUTIC_GROUP"),
            severity_resolution=_sev(4),
            binding_gate_mandatory=False,
        )
        payload_a = rule4_candidate_eligibility_fingerprint_v1_payload(
            ruleset_version=out["ruleset_version"],
            registry_version=out["registry_version"],
            selection_status=out["selection_status"],
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
