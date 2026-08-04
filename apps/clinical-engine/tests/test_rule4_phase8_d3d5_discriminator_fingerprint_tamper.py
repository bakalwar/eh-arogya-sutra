"""Discriminator fingerprint tamper matrix — Python parity with TS."""

from __future__ import annotations

import copy
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1] / "src"
sys.path.insert(0, str(ROOT))

from ehas2_clinical_engine.rule4.selection.d3_d5_discriminator_fingerprint_v1 import (  # noqa: E402
    rule4_d3d5_discriminator_fingerprint_v1_hash,
    with_computed_discriminator_fingerprint,
)
from ehas2_clinical_engine.rule4.selection.q7bf_gate_ids import (  # noqa: E402
    RULE4_Q7BF_MANDATORY_GATE_IDS,
)
from ehas2_clinical_engine.rule4.selection.validate_d3_d5_discriminator import (  # noqa: E402
    validate_d3_d5_discriminator_envelope,
)


def _q7bf_pass(evidence_ids: list[str]) -> list[dict]:
    gates = [
        "Q7BF_RULE3_TARGET_RESOLVED",
        "Q7BF_FORMULA_SPECIFIC_PATHOLOGY",
        "Q7BF_POSITIVE_DISEASE_POLARITY",
        "Q7BF_NEGATIVE_THERAPEUTIC_POLARITY",
        "Q7BF_ACUTE_PHASE",
        "Q7BF_CLOSE_D04_USABLE_EVIDENCE",
        "Q7BF_STRICT_FORMULA_ISOLATION",
        "Q7BF_NO_GLOBAL_EVIDENCE_LEAKAGE",
    ]
    return [
        {
            "gate_id": gate_id,
            "outcome": "PASS",
            "evidence_item_ids": evidence_ids,
            "reason_codes": [],
            "limitation_codes": [],
        }
        for gate_id in gates
    ]


def _base_envelope() -> dict:
    body = {
        "formula_slot_id": "s1",
        "formula_target_id": "t1",
        "upstream_phase7_eligibility_fingerprint": (
            "1B0F098FA015D4903EC40FC691EA5E0DF6B81D6FF4F099022E85E5DEA0912F4E"
        ),
        "q7bf_gate_results": _q7bf_pass(["e1"]),
        "d08_document_status": "USABLE",
        "d08_document_confidence": "PASS",
        "d08_item_status": "USABLE",
        "d08_item_confidence": "PASS",
        "sensitivity_assessment_status": "ASSESSED_D5_NOT_QUALIFIED",
        "close_d05_discriminator_status": "QUALIFIES_D3",
        "evidence_item_ids": ["e1"],
        "evidence_provenance": [
            {
                "finding_id": "e1",
                "document_id": "doc-1",
                "item_gate_passed": True,
                "document_gate_passed": True,
            }
        ],
        "source_reference_ids": ["ref-1"],
        "binding_status": "BOUND",
    }
    return with_computed_discriminator_fingerprint(body)


def _ctx() -> dict:
    return {
        "formula_slot_id": "s1",
        "formula_target_id": "t1",
        "upstream_phase7_eligibility_fingerprint": (
            "1B0F098FA015D4903EC40FC691EA5E0DF6B81D6FF4F099022E85E5DEA0912F4E"
        ),
        "evidence_adapter": {
            "formula_bound_pools": [
                {
                    "formula_slot_id": "s1",
                    "formula_target_id": "t1",
                    "usable_finding_ids": ["e1"],
                    "ignored_finding_ids": [],
                    "contradiction": {
                        "formula_slot_id": "s1",
                        "evidence_status": "CLEAR",
                        "doctor_review_required": True,
                        "reason_codes": [],
                        "limitation_codes": [],
                    },
                }
            ],
            "document_gate_results": [
                {"document_id": "doc-1", "passed": True, "reason_codes": [], "limitation_codes": []}
            ],
            "item_gate_results": [
                {
                    "finding_id": "e1",
                    "document_id": "doc-1",
                    "passed": True,
                    "reason_codes": [],
                    "limitation_codes": [],
                }
            ],
            "ignored_audit": [],
            "dedupe_supersession": [],
        },
        "evidence_items": [
            {
                "finding_id": "e1",
                "document_id": "doc-1",
                "parent_source_id": "src-1",
                "source_type": "DOCTOR_STRUCTURED_ENTRY",
                "source_reference": "ref-1",
                "timestamp_or_case_context": "c1",
                "formula_slot_id": "s1",
                "formula_target_id": "t1",
                "target_organ_system": "organ",
                "anatomical_site": "site",
                "target_pathology_id": "path-1",
                "assertion_status": "PRESENT",
                "verification_status": "VERIFIED",
                "formula_relevance": "DIRECT",
                "confidence_score": 0.95,
            }
        ],
    }


class TestDiscriminatorFingerprintTamper(unittest.TestCase):
    def _assert_stale_fingerprint_rejected(self, tampered: dict) -> None:
        out = validate_d3_d5_discriminator_envelope(tampered, _ctx())
        self.assertIn("D3_D5_DISCRIMINATOR_FINGERPRINT_INVALID", out["reason_codes"])
        self.assertIsNone(out["dilution"])

    def _assert_fail_closed(self, tampered: dict) -> None:
        out = validate_d3_d5_discriminator_envelope(tampered, _ctx())
        self.assertIsNone(out["dilution"])
        self.assertEqual(out["status"], "unresolved")

    def test_q7bf_gate_tamper(self) -> None:
        env = _base_envelope()
        gates = copy.deepcopy(env["q7bf_gate_results"])
        gates[0]["evidence_item_ids"] = list(gates[0]["evidence_item_ids"]) + ["e-extra"]
        body = {k: v for k, v in env.items() if k != "discriminator_fingerprint"}
        body["q7bf_gate_results"] = gates
        tampered = with_computed_discriminator_fingerprint(body)
        tampered["discriminator_fingerprint"] = env["discriminator_fingerprint"]
        self._assert_stale_fingerprint_rejected(tampered)

    def test_d08_document_tamper(self) -> None:
        env = _base_envelope()
        body = {k: v for k, v in env.items() if k != "discriminator_fingerprint"}
        body["d08_document_status"] = "NOT_USABLE"
        nxt = with_computed_discriminator_fingerprint(body)
        self.assertNotEqual(nxt["discriminator_fingerprint"], env["discriminator_fingerprint"])
        tampered = {**nxt, "discriminator_fingerprint": env["discriminator_fingerprint"]}
        self._assert_fail_closed(tampered)

    def test_d08_item_confidence_tamper(self) -> None:
        env = _base_envelope()
        body = {k: v for k, v in env.items() if k != "discriminator_fingerprint"}
        body["d08_item_confidence"] = "FAIL"
        nxt = with_computed_discriminator_fingerprint(body)
        self.assertNotEqual(nxt["discriminator_fingerprint"], env["discriminator_fingerprint"])
        tampered = {**nxt, "discriminator_fingerprint": env["discriminator_fingerprint"]}
        self._assert_fail_closed(tampered)

    def test_sensitivity_tamper(self) -> None:
        env = _base_envelope()
        body = {k: v for k, v in env.items() if k != "discriminator_fingerprint"}
        body["sensitivity_assessment_status"] = "MISSING"
        tampered = with_computed_discriminator_fingerprint(body)
        tampered["discriminator_fingerprint"] = env["discriminator_fingerprint"]
        self._assert_stale_fingerprint_rejected(tampered)

    def test_close_d05_tamper(self) -> None:
        env = _base_envelope()
        body = {k: v for k, v in env.items() if k != "discriminator_fingerprint"}
        body["close_d05_discriminator_status"] = "QUALIFIES_D5"
        tampered = with_computed_discriminator_fingerprint(body)
        tampered["discriminator_fingerprint"] = env["discriminator_fingerprint"]
        self._assert_stale_fingerprint_rejected(tampered)

    def test_binding_status_tamper(self) -> None:
        env = _base_envelope()
        body = {k: v for k, v in env.items() if k != "discriminator_fingerprint"}
        body["binding_status"] = "UNBOUND"
        nxt = with_computed_discriminator_fingerprint(body)
        tampered = {**nxt, "discriminator_fingerprint": env["discriminator_fingerprint"]}
        self._assert_fail_closed(tampered)

    def test_evidence_item_id_tamper(self) -> None:
        env = _base_envelope()
        body = {k: v for k, v in env.items() if k != "discriminator_fingerprint"}
        body["evidence_item_ids"] = ["e2"]
        nxt = with_computed_discriminator_fingerprint(body)
        tampered = {**nxt, "discriminator_fingerprint": env["discriminator_fingerprint"]}
        self._assert_fail_closed(tampered)

    def test_provenance_document_id_tamper(self) -> None:
        env = _base_envelope()
        body = {k: v for k, v in env.items() if k != "discriminator_fingerprint"}
        body["evidence_provenance"] = [
            {
                "finding_id": "e1",
                "document_id": "doc-2",
                "item_gate_passed": True,
                "document_gate_passed": True,
            }
        ]
        nxt = with_computed_discriminator_fingerprint(body)
        tampered = {**nxt, "discriminator_fingerprint": env["discriminator_fingerprint"]}
        self._assert_fail_closed(tampered)

    def test_provenance_gate_flag_tamper(self) -> None:
        env = _base_envelope()
        body = {k: v for k, v in env.items() if k != "discriminator_fingerprint"}
        body["evidence_provenance"] = [
            {
                "finding_id": "e1",
                "document_id": "doc-1",
                "item_gate_passed": False,
                "document_gate_passed": True,
            }
        ]
        nxt = with_computed_discriminator_fingerprint(body)
        tampered = {**nxt, "discriminator_fingerprint": env["discriminator_fingerprint"]}
        self._assert_fail_closed(tampered)

    def test_source_reference_tamper(self) -> None:
        env = _base_envelope()
        body = {k: v for k, v in env.items() if k != "discriminator_fingerprint"}
        body["source_reference_ids"] = ["ref-2"]
        tampered = with_computed_discriminator_fingerprint(body)
        tampered["discriminator_fingerprint"] = env["discriminator_fingerprint"]
        self._assert_stale_fingerprint_rejected(tampered)

    def test_authentic_hash_matches(self) -> None:
        env = _base_envelope()
        self.assertEqual(
            rule4_d3d5_discriminator_fingerprint_v1_hash(env),
            env["discriminator_fingerprint"],
        )
        self.assertEqual(len(RULE4_Q7BF_MANDATORY_GATE_IDS), 8)


if __name__ == "__main__":
    unittest.main()
