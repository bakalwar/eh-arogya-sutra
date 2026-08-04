"""Phase 8 D3/D5 evidence provenance gates — mirrors TS negative coverage."""

from __future__ import annotations

import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1] / "src"
sys.path.insert(0, str(ROOT))

from ehas2_clinical_engine.rule4.selection.d3_d5_discriminator_fingerprint_v1 import (  # noqa: E402
    rule4_d3d5_discriminator_fingerprint_v1_hash,
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


def _envelope(**overrides) -> dict:
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
    body.update(overrides)
    body["discriminator_fingerprint"] = rule4_d3d5_discriminator_fingerprint_v1_hash(body)
    return body


def _ctx(**evidence_overrides) -> dict:
    item = {
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
    item.update(evidence_overrides.get("item", {}))
    pool = {
        "formula_slot_id": "s1",
        "formula_target_id": "t1",
        "usable_finding_ids": ["e1"],
        "ignored_finding_ids": [],
        "corroboration_distinct_parent_count": 1,
        "corroborating_parent_source_ids": ["src-1"],
        "contradiction": {
            "formula_slot_id": "s1",
            "evidence_status": "CLEAR",
            "doctor_review_required": True,
            "reason_codes": [],
            "limitation_codes": [],
        },
    }
    pool.update(evidence_overrides.get("pool", {}))
    adapter = {
        "formula_bound_pools": [pool],
        "document_gate_results": evidence_overrides.get(
            "document_gate_results",
            [{"document_id": "doc-1", "passed": True, "reason_codes": [], "limitation_codes": []}],
        ),
        "item_gate_results": evidence_overrides.get(
            "item_gate_results",
            [
                {
                    "finding_id": "e1",
                    "document_id": "doc-1",
                    "passed": True,
                    "reason_codes": [],
                    "limitation_codes": [],
                }
            ],
        ),
        "ignored_audit": evidence_overrides.get("ignored_audit", []),
        "dedupe_supersession": evidence_overrides.get("dedupe_supersession", []),
    }
    return {
        "formula_slot_id": "s1",
        "formula_target_id": "t1",
        "upstream_phase7_eligibility_fingerprint": (
            "1B0F098FA015D4903EC40FC691EA5E0DF6B81D6FF4F099022E85E5DEA0912F4E"
        ),
        "evidence_adapter": adapter,
        "evidence_items": [item],
    }


class TestRule4Phase8D3D5EvidenceProvenance(unittest.TestCase):
    def test_negated_assertion_rejected(self) -> None:
        out = validate_d3_d5_discriminator_envelope(
            _envelope(),
            _ctx(item={"assertion_status": "NEGATED"}),
        )
        self.assertIn("D3_D5_EVIDENCE_ITEM_GATE_NOT_MET", out["reason_codes"])
        self.assertIsNone(out["dilution"])

    def test_fingerprint_changes_when_provenance_document_changes(self) -> None:
        a = _envelope()
        b = _envelope(
            evidence_provenance=[
                {
                    "finding_id": "e1",
                    "document_id": "doc-2",
                    "item_gate_passed": True,
                    "document_gate_passed": True,
                }
            ]
        )
        self.assertNotEqual(
            a["discriminator_fingerprint"], b["discriminator_fingerprint"]
        )

    def test_resolves_d3_when_gates_pass(self) -> None:
        out = validate_d3_d5_discriminator_envelope(_envelope(), _ctx())
        self.assertEqual(out["status"], "resolved")
        self.assertEqual(out["dilution"], "D3")

    def test_pool_contradictory_rejected(self) -> None:
        ctx = _ctx()
        ctx["evidence_adapter"]["formula_bound_pools"][0]["contradiction"][
            "evidence_status"
        ] = "CONTRADICTORY_EVIDENCE"
        out = validate_d3_d5_discriminator_envelope(_envelope(), ctx)
        self.assertIn("D3_D5_EVIDENCE_POOL_CONTRADICTORY", out["reason_codes"])

    def test_item_gate_document_binding_mismatch(self) -> None:
        ctx = _ctx()
        ctx["evidence_adapter"]["item_gate_results"][0]["document_id"] = "doc-2"
        out = validate_d3_d5_discriminator_envelope(_envelope(), ctx)
        self.assertIn("D3_D5_EVIDENCE_DOCUMENT_BINDING_INVALID", out["reason_codes"])


if __name__ == "__main__":
    unittest.main()
